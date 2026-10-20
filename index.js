/**
 * dsh-global-persona — 「全局人设」插件。
 *
 * 宿主（host）半侧：
 *  1. 定位用户级全局 AGENTS.md：`$DSH_HOME/AGENTS.md`，缺省 `~/.dsh/AGENTS.md`。
 *     这与 `@deepseek-ai/dsh-agent-instructions` 读取的 user-global 文件是同一个，
 *     所以这里改完，新会话的下一次请求就会带上新内容。
 *  2. 注册回环-only 的 HTTP 接口，供浏览器半侧（client.js 的设置页）读写：
 *     `GET  /api/dsh-global-persona/document`  读取全局 AGENTS.md
 *     `POST /api/dsh-global-persona/document`  写入全局 AGENTS.md
 *
 * 写入带版本守卫（mtime+size），避免两个窗口互相覆盖。
 *
 * @module dsh-global-persona
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/** Cordis 插件名。 */
export const name = 'dsh-global-persona'

/** 浏览器半侧读取文档的接口路径。 */
export const DOCUMENT_PATH = '/api/dsh-global-persona/document'

/** 单次写入的体积上限（字节）。 */
export const MAX_DOCUMENT_BYTES = 1024 * 1024

/** DSH 主目录：优先 `$DSH_HOME`，否则 `~/.dsh`。 */
function dshHome() {
  const fromEnv = process.env.DSH_HOME
  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) return fromEnv
  return path.join(os.homedir(), '.dsh')
}

/** 全局 AGENTS.md 的绝对路径。 */
export function globalAgentsPath() {
  return path.join(dshHome(), 'AGENTS.md')
}

/**
 * 读一次文档快照。
 * @returns 文件内容、版本与元信息；文件不存在时 exists=false。
 */
function readDocument() {
  const file = globalAgentsPath()
  let stat
  try {
    stat = fs.statSync(file)
  } catch {
    return { path: file, exists: false, content: '', version: '', bytes: 0, updatedAt: null }
  }
  let content = ''
  try {
    content = fs.readFileSync(file, 'utf8')
  } catch (error) {
    return {
      path: file,
      exists: true,
      content: '',
      version: versionOf(stat),
      bytes: stat.size,
      updatedAt: stat.mtime.toISOString(),
      readError: String(error?.message ?? error),
    }
  }
  return {
    path: file,
    exists: true,
    content,
    version: versionOf(stat),
    bytes: stat.size,
    updatedAt: stat.mtime.toISOString(),
  }
}

/** 版本指纹：mtime（毫秒）+ 字节数。 */
function versionOf(stat) {
  return `${Math.round(stat.mtimeMs)}:${stat.size}`
}

/**
 * 写一次文档。`expectedVersion` 非空时做乐观并发校验。
 * @returns `{ ok: true, value }` 或 `{ ok: false, error }`。
 */
function writeDocument(payload) {
  const file = globalAgentsPath()
  const content = typeof payload?.content === 'string' ? payload.content : undefined
  if (content === undefined) return { ok: false, error: '缺少 content 字段' }
  if (Buffer.byteLength(content, 'utf8') > MAX_DOCUMENT_BYTES) {
    return { ok: false, error: `内容超过 ${MAX_DOCUMENT_BYTES} 字节上限` }
  }

  const expected = typeof payload?.expectedVersion === 'string' ? payload.expectedVersion : undefined
  if (expected !== undefined) {
    let current
    try {
      current = fs.statSync(file)
    } catch {
      current = undefined
    }
    const currentVersion = current === undefined ? '' : versionOf(current)
    if (currentVersion !== expected) {
      return {
        ok: false,
        error: '文件在别处已被修改，请刷新后再保存',
        conflict: true,
      }
    }
  }

  try {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    // 先写临时文件再 rename，避免半截内容落盘。
    const temp = `${file}.tmp-${process.pid}-${Date.now()}`
    fs.writeFileSync(temp, content, 'utf8')
    fs.renameSync(temp, file)
  } catch (error) {
    return { ok: false, error: `写入失败：${error?.message ?? error}` }
  }
  return { ok: true, value: readDocument() }
}

/** 只认回环请求，避免把用户全局人设暴露给局域网。 */
function isLoopbackRequest(request) {
  const address = request?.socket?.remoteAddress
  const okAddress =
    address === '127.0.0.1' ||
    address === '::1' ||
    address === '::ffff:127.0.0.1' ||
    address === undefined
  if (!okAddress) return false
  const host = request?.headers?.host
  if (typeof host !== 'string') return true
  try {
    const hostname = new URL(`http://${host}`).hostname
    return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '[::1]' || hostname === '::1'
  } catch {
    return false
  }
}

/** 写一份 JSON 响应。 */
function writeJson(response, status, payload) {
  const body = JSON.stringify(payload)
  response.writeHead?.(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  response.end?.(body)
}

/** 读 JSON 请求体，带体积上限。 */
function readJsonBody(request, limit = MAX_DOCUMENT_BYTES + 64 * 1024) {
  return new Promise((resolve) => {
    let size = 0
    const chunks = []
    let settled = false
    const finish = (value) => {
      if (settled) return
      settled = true
      resolve(value)
    }
    request.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        finish(undefined)
        request.destroy?.()
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => {
      if (chunks.length === 0) return finish({})
      try {
        finish(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        finish(undefined)
      }
    })
    request.on('error', () => finish(undefined))
  })
}

/** 取一个可用的 logger；拿不到就返回 undefined。 */
function loggerOf(ctx) {
  try {
    if (typeof ctx.logger === 'function') return ctx.logger('dsh-global-persona')
    return ctx.logger
  } catch {
    return undefined
  }
}

/**
 * 注册宿主侧的一切。
 * @param ctx - 插件上下文。
 */
export function apply(ctx) {
  loggerOf(ctx)?.info?.(`全局人设文件：${globalAgentsPath()}`)

  if (typeof ctx.inject !== 'function') return
  ctx.inject(['webServer'], (scope) => {
    scope.effect(
      () => scope.webServer.register({
        kind: 'exact',
        path: DOCUMENT_PATH,
        handler: async (request, response) => {
          if (!isLoopbackRequest(request)) {
            writeJson(response, 403, { ok: false, error: 'loopback requests only' })
            return
          }
          const method = request.method ?? 'GET'

          if (method === 'GET') {
            writeJson(response, 200, { ok: true, value: readDocument() })
            return
          }

          if (method === 'POST') {
            const body = await readJsonBody(request)
            if (body === undefined) {
              writeJson(response, 400, { ok: false, error: 'malformed JSON body' })
              return
            }
            const result = writeDocument(body)
            if (!result.ok) {
              writeJson(response, 200, { ok: false, error: result.error, conflict: result.conflict === true })
              return
            }
            writeJson(response, 200, { ok: true, value: result.value })
            return
          }

          writeJson(response, 405, { ok: false, error: 'method not allowed' })
        },
      }),
      'dsh-global-persona: document bridge',
    )
  })
}
