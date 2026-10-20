# dsh-global-persona

给 DeepSeek Harness 加一个「全局人设」设置页：在 **设置 → 全局人设** 里直接查看和修改
用户级的 `AGENTS.md`（`$DSH_HOME/AGENTS.md`，缺省 `~/.dsh/AGENTS.md`）。

## 它改的是哪个文件

`@deepseek-ai/dsh-agent-instructions` 会在每次请求时把这个 user-global 文件注入到系统提示里，
所以保存之后：

- 新会话的下一次请求立刻带上新内容；
- 已经在跑的会话保持它启动时的基线（不会中途换人设）。

## 组成

| 文件 | 作用 |
| --- | --- |
| `index.js` | 宿主半侧：解析文件路径，注册回环-only 的 HTTP 读写接口 |
| `client.js` | 浏览器半侧：向 `settings.section` 注册「全局人设」小节，渲染查看 / 编辑界面 |
| `cordis.patch.yml` | bundle patch：把插件插进 profile |
| `locale/*.json` | 中英文案 |

## 接口

```
GET  /api/dsh-global-persona/document   → { ok, value: { path, exists, content, version, bytes, updatedAt } }
POST /api/dsh-global-persona/document   ← { content, expectedVersion? }
                                        → { ok, value } | { ok: false, error, conflict? }
```

- 只接受回环请求（`127.0.0.1` / `::1` / `localhost`），不会把全局人设暴露给局域网。
- `expectedVersion` 是 `mtimeMs:size` 指纹。带上它做乐观并发校验：文件在别处被改过就返回
  `conflict: true`，界面提示先「重新读取」，避免两个窗口互相覆盖。
- 写入走「临时文件 + rename」，不会出现半截内容落盘。
- 单次写入上限 1 MiB。

## 样式约定（踩过的坑）

只使用主题 token，不写死颜色。**但 token 要选对**：

- 按钮底色用 `--dsw-alias-button-primary-fill`，按钮文字用
  `--dsw-alias-label-primary-foreground`——这是宿主自己主按钮的配对。
- **不要**拿 `--dsw-alias-brand-primary` 当填充色。它不是填充色：桌面窗口主题
  （`window-material.css`）会在 `body` 上把它改写成 `var(--dsw-alias-label-primary)`，
  于是底色变近白、再配上写死的 `#fff` 文字，按钮就白底白字整个隐形了。
- 自定义属性是在**声明它的元素**上完成替换的：`:root` 上算好的
  `--dsw-alias-button-primary-fill` 不会因为 `body` 改写 `brand-primary` 而变，
  这也是宿主按钮没坏、而直接引用 `brand-primary` 的元素坏了的原因。
- 禁用态只降 `opacity`，不换颜色，避免任何主题下的低对比。

## 安装

本机已经以 `link:` 方式装进 `desktop` profile：

```bash
dsh plugin add link:D:/20761/Documents/dshwork/dsh-global-persona --profile desktop
```

改完代码后重启 `dsh web` 即可生效（宿主半侧改动需要重启；只改 `client.js` 时刷新页面即可）。
