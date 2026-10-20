window.__ModuleLoader__.load({
  id: 'dsh-global-persona',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** 字典命名空间。 */
    const NS = 'globalPersona'
    /** 设置页席位 id。 */
    const SECTION_ID = 'global-persona'
    /** 宿主接口（见 index.js）。 */
    const DOCUMENT_PATH = '/api/dsh-global-persona/document'

    const zh = {
      nav: '全局人设',
      title: '全局人设',
      intro:
        '这里编辑用户级的全局 AGENTS.md：它对本机所有工作区生效，是比项目内 AGENTS.md 更宽的那一层。保存后，新会话的下一次请求就会带上新内容；已经在跑的会话保持它启动时的基线。',
      pathLabel: '文件位置',
      stateLabel: '状态',
      stateExists: '已存在',
      stateMissing: '尚未创建（保存时会自动建）',
      updatedLabel: '最后修改',
      bytesLabel: '大小',
      charsSuffix: '字',
      loading: '读取中…',
      editorLabel: '文件内容',
      placeholder:
        '# 工作方式偏好（全局）\n\n在这里写下你希望所有会话都遵守的偏好，例如：\n\n- 同一轮里尽量并发发出互不依赖的工具调用\n- 回答先给结论，再给理由\n',
      reload: '重新读取',
      save: '保存',
      saving: '保存中…',
      saved: '已保存',
      clear: '清空编辑器',
      unsaved: '有未保存的修改',
      dirtyHint: '改动尚未写入文件。',
      conflict: '文件在别处被修改了，请先点「重新读取」再决定怎么合并。',
      errorPrefix: '出错了',
      loadFailed: '读取失败',
      emptyNote: '文件当前为空。',
      note: '提示：这个文件由 @deepseek-ai/dsh-agent-instructions 读取，缺省位置是 ~/.dsh/AGENTS.md。',
    }

    const en = {
      nav: 'Global Persona',
      title: 'Global Persona',
      intro:
        'Edit the user-global AGENTS.md here: it applies to every workspace on this machine, one layer broader than a project AGENTS.md. After saving, the next request of a new session picks it up; running sessions keep the baseline they started with.',
      pathLabel: 'Location',
      stateLabel: 'State',
      stateExists: 'Present',
      stateMissing: 'Not created yet (created on save)',
      updatedLabel: 'Last modified',
      bytesLabel: 'Size',
      charsSuffix: 'chars',
      loading: 'Loading…',
      editorLabel: 'File content',
      placeholder:
        '# Working preferences (global)\n\nWrite the preferences every session should follow, for example:\n\n- Send independent tool calls together in one step\n- Answer with the conclusion first\n',
      reload: 'Reload',
      save: 'Save',
      saving: 'Saving…',
      saved: 'Saved',
      clear: 'Clear editor',
      unsaved: 'Unsaved changes',
      dirtyHint: 'Changes are not written to disk yet.',
      conflict: 'The file changed elsewhere. Reload first, then decide how to merge.',
      errorPrefix: 'Error',
      loadFailed: 'Failed to load',
      emptyNote: 'The file is currently empty.',
      note: 'Note: this file is read by @deepseek-ai/dsh-agent-instructions; the default location is ~/.dsh/AGENTS.md.',
    }

    const styles = {
      root: { display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' },
      heading: { margin: 0, fontSize: '15px', fontWeight: 600 },
      intro: {
        margin: 0,
        fontSize: '12px',
        lineHeight: 1.7,
        color: 'var(--dsw-alias-label-secondary)',
      },
      card: {
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '6px 12px',
        padding: '10px 12px',
        border: '1px solid var(--dsw-alias-border-l2)',
        borderRadius: '10px',
        fontSize: '12px',
      },
      key: { color: 'var(--dsw-alias-label-secondary)', whiteSpace: 'nowrap' },
      value: {
        color: 'var(--dsw-alias-label-primary)',
        wordBreak: 'break-all',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      },
      toolbar: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
      button: {
        font: 'inherit',
        fontSize: '12px',
        padding: '4px 12px',
        borderRadius: '8px',
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'transparent',
        color: 'inherit',
        cursor: 'pointer',
      },
      // 主按钮照宿主自己的写法：底色 --dsw-alias-button-primary-fill，
      // 文字 --dsw-alias-label-primary-foreground。
      // 之前写成「brand-primary 当底色 + 文字写死 #fff」是错的：brand-primary
      // 不是填充色——桌面窗口主题里它直接解析成 --dsw-alias-label-primary
      // （近白），于是白底白字，按钮整个隐形。
      // 注意：var() 的兜底只在「变量未定义」时生效，值算出来是浅色时救不了，
      // 所以这里只能依赖正确的 token 配对，别指望兜底色救场。
      primaryButton: {
        font: 'inherit',
        fontSize: '12px',
        fontWeight: 500,
        padding: '4px 14px',
        borderRadius: '8px',
        border: '1px solid transparent',
        background: 'var(--dsw-alias-button-primary-fill, #4d6bfe)',
        color: 'var(--dsw-alias-label-primary-foreground, #fff)',
        cursor: 'pointer',
      },
      // 禁用态：只降透明度，不换颜色——避免任何主题下的低对比。
      disabled: { opacity: 0.45, cursor: 'not-allowed' },
      textarea: {
        font: 'inherit',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: '12px',
        lineHeight: 1.7,
        padding: '10px 12px',
        borderRadius: '10px',
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'transparent',
        color: 'inherit',
        width: '100%',
        minHeight: '320px',
        resize: 'vertical',
        boxSizing: 'border-box',
        // 按钮已经证明这个主题会改写表面色，长文本编辑区同样显式钉住
        // 前景/背景，免得继承到某个浅色组合。
        caretColor: 'var(--dsw-alias-label-primary)',
      },
      hint: { margin: 0, fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' },
      ok: { margin: 0, fontSize: '12px', color: 'var(--dsw-alias-state-success-primary)' },
      warn: { margin: 0, fontSize: '12px', color: 'var(--dsw-alias-state-warn-primary)' },
      error: { margin: 0, fontSize: '12px', color: 'var(--dsw-alias-state-error-primary)' },
      badge: {
        fontSize: '11px',
        padding: '1px 8px',
        borderRadius: '999px',
        border: '1px solid var(--dsw-alias-border-l2)',
        color: 'var(--dsw-alias-label-secondary)',
      },
    }

    /** 一次读取。 */
    function fetchDocument() {
      if (typeof fetch !== 'function') return Promise.reject(new Error('fetch unavailable'))
      return fetch(DOCUMENT_PATH, { headers: { accept: 'application/json' } }).then((response) =>
        response.json().then((body) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          if (!body || body.ok !== true) throw new Error((body && body.error) || 'malformed payload')
          return body.value
        }),
      )
    }

    /** 一次写入。 */
    function postDocument(payload) {
      if (typeof fetch !== 'function') return Promise.reject(new Error('fetch unavailable'))
      return fetch(DOCUMENT_PATH, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((response) =>
        response.json().then((body) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          if (!body || body.ok !== true) {
            const error = new Error((body && body.error) || 'request rejected')
            error.conflict = body ? body.conflict === true : false
            throw error
          }
          return body.value
        }),
      )
    }

    /** 字节数（UTF-8）。 */
    function byteLength(text) {
      if (typeof TextEncoder === 'function') return new TextEncoder().encode(text).length
      return unescape(encodeURIComponent(text)).length
    }

    /** 设置页里的「全局人设」小节。 */
    function GlobalPersonaSection(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => key
      const [doc, setDoc] = React.useState(null)
      const [draft, setDraft] = React.useState('')
      const [phase, setPhase] = React.useState('loading')
      const [busy, setBusy] = React.useState(false)
      const [message, setMessage] = React.useState(null)

      const applyDoc = React.useCallback((value) => {
        setDoc(value)
        setDraft(typeof value.content === 'string' ? value.content : '')
        setPhase('ready')
      }, [])

      const load = React.useCallback(() => {
        setPhase('loading')
        setMessage(null)
        fetchDocument()
          .then(applyDoc)
          .catch((error) => {
            setPhase('error')
            setMessage({ kind: 'error', text: `${t('loadFailed')}: ${error && error.message ? error.message : String(error)}` })
          })
      }, [applyDoc, t])

      React.useEffect(() => {
        load()
      }, [load])

      const dirty = doc !== null && draft !== (typeof doc.content === 'string' ? doc.content : '')

      const save = React.useCallback(() => {
        if (doc === null) return
        setBusy(true)
        setMessage(null)
        postDocument({ content: draft, expectedVersion: doc.exists ? doc.version : '' })
          .then((value) => {
            applyDoc(value)
            setMessage({ kind: 'ok', text: t('saved') })
          })
          .catch((error) => {
            if (error && error.conflict === true) setMessage({ kind: 'warn', text: t('conflict') })
            else setMessage({ kind: 'error', text: error && error.message ? error.message : String(error) })
          })
          .then(() => setBusy(false))
      }, [applyDoc, doc, draft, t])

      const children = []
      children.push(h('h2', { key: 'title', style: styles.heading }, t('title')))
      children.push(h('p', { key: 'intro', style: styles.intro }, t('intro')))

      if (phase === 'loading' && doc === null) {
        children.push(h('p', { key: 'loading', style: styles.hint }, t('loading')))
        return h('div', { style: styles.root }, children)
      }

      if (doc !== null) {
        children.push(
          h(
            'div',
            { key: 'card', style: styles.card },
            h('div', { style: styles.key }, t('pathLabel')),
            h('div', { style: styles.value }, doc.path || '—'),
            h('div', { style: styles.key }, t('stateLabel')),
            h('div', { style: styles.value }, doc.exists ? t('stateExists') : t('stateMissing')),
            h('div', { style: styles.key }, t('bytesLabel')),
            h(
              'div',
              { style: styles.value },
              `${byteLength(draft)} B · ${draft.length} ${t('charsSuffix')}`,
            ),
            h('div', { style: styles.key }, t('updatedLabel')),
            h('div', { style: styles.value }, doc.updatedAt || '—'),
          ),
        )
      }

      children.push(
        h(
          'div',
          { key: 'toolbar', style: styles.toolbar },
          h(
            'button',
            {
              type: 'button',
              style: busy || !dirty ? { ...styles.primaryButton, ...styles.disabled } : styles.primaryButton,
              disabled: busy || !dirty,
              onClick: save,
            },
            busy ? t('saving') : t('save'),
          ),
          h(
            'button',
            {
              type: 'button',
              style: busy ? { ...styles.button, ...styles.disabled } : styles.button,
              disabled: busy,
              onClick: load,
            },
            t('reload'),
          ),
          h(
            'button',
            {
              type: 'button',
              style:
                busy || draft.length === 0
                  ? { ...styles.button, ...styles.disabled }
                  : styles.button,
              disabled: busy || draft.length === 0,
              onClick: () => setDraft(''),
            },
            t('clear'),
          ),
          dirty ? h('span', { style: styles.badge }, t('unsaved')) : null,
        ),
      )

      if (message !== null) {
        const style = message.kind === 'ok' ? styles.ok : message.kind === 'warn' ? styles.warn : styles.error
        children.push(h('p', { key: 'message', style }, message.text))
      } else if (dirty) {
        children.push(h('p', { key: 'dirty', style: styles.hint }, t('dirtyHint')))
      } else if (doc !== null && draft.length === 0) {
        children.push(h('p', { key: 'empty', style: styles.hint }, t('emptyNote')))
      }

      children.push(h('label', { key: 'editorLabel', style: styles.key }, t('editorLabel')))
      children.push(
        h('textarea', {
          key: 'editor',
          style: styles.textarea,
          value: draft,
          placeholder: t('placeholder'),
          spellCheck: false,
          onChange: (event) => setDraft(event.target.value),
        }),
      )
      children.push(h('p', { key: 'note', style: styles.hint }, t('note')))

      return h('div', { style: styles.root }, children)
    }

    /** 需要的客户端服务：slot 注册表与本地化字典。 */
    const inject = ['slots', 'locale']

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-global-persona: dictionaries')
      const t = ctx.locale.bind(NS)
      ctx.slots.inject('settings.section', () =>
        ctx.slots.register(
          {
            name: 'settings.section',
            id: SECTION_ID,
            order: 19,
            label: () => t('nav'),
            locale: NS,
            inject: () => ({ t }),
          },
          GlobalPersonaSection,
        ),
      )
    }

    return {
      inject,
      apply,
      NS,
      SECTION_ID,
      GlobalPersonaSection,
    }
  },
})
