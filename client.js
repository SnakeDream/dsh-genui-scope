window.__ModuleLoader__.load({
  id: 'dsh-genui-scope',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const DICT = {
      'zh-CN': {
        nav: '组件选择',
        title: '卡片组件选择',
        intro: '每轮请求都会带上卡片组件的说明（约 3 万字符）。按层挑掉用不到的组件，其余说明不再进入上下文。优先级：会话 > 工作区 > 全局 > 不裁剪。',
        hint: '点箭头展开工作区里的会话；点名字设置这一层',
        global: '全局规则',
        workspace: '工作区规则',
        session: '会话规则',
        enter: '进入',
        back: '返回',
        inherit: '继承上级',
        unfiltered: '未设置（全部组件）',
        count: '{n} 个组件',
        saving: '保存中…',
        save: '保存并生效',
        clear: '改回继承',
        cancel: '取消',
        saved: '已保存，下一条消息就会生效',
        savedScope: '已保存，下一条消息就会生效',
        loadFail: '读取失败：{e}',
        saveFail: '保存失败：{e}',
        presets: '整套预设',
        presetAll: '全部',
        presetLean: '精简',
        presetText: '纯文字',
        presetForm: '表单',
        presetTable: '表格',
        presetChart: '图表',
        pickTitle: '挑选这一层要用的组件',
        keepAlways: '始终保留',
        workspacesTitle: '选择工作区',
        workspacesEmpty: '还没有工作区',
        sessionsTitle: '选择会话',
        sessionsEmpty: '还没有会话',
        sessionsHint: '按最近活动排序',
        workspaceRule: '工作区规则',
        sessionRule: '会话规则',
        globalRule: '全局规则',
        sessionsCount: '{n} 个会话',
        newSession: '新建会话',
        newSessionTitle: '先定规则，再建会话',
        newSessionIntro: '先挑组件，再创建会话；规则会在会话刚建好时立刻写进去，然后打开它',
        pickWorkspace: '1. 会话放在哪个工作区',
        pickComponents: '2. 会话能用哪些组件',
        create: '创建会话并应用规则',
        created: '已创建会话，规则已写入',
        createdThenOpen: '已创建会话并打开',
        createFail: '创建失败：{e}',
        needWorkspace: '请先选择工作区',
        noWorkspacePath: '这个工作区没有路径信息，无法新建会话',
        noteTitle: '说明',
        untitled: '未命名会话',
        effect: '规则作用于系统提示词，保存后下一条消息立即生效；已经开始的这一轮不受影响',
        layer: '层级',
        expand: '展开',
        collapse: '收起',
        modifySession: '修改会话',
        modify: '修改',
        pickSession: '点下面的会话名就能改它的规则',
        modifyHint: '先展开工作区，再点要修改的会话',
        groupBasic: '基础',
        groupForm: '表单',
        groupControl: '控件',
        groupTable: '表格',
        groupLayout: '布局',
        groupChart: '图表',
        loading: '读取中…',
      },
    }

    const CHIP_PRESET = ['lean', 'text', 'form', 'table', 'chart']

    const S = {
      page: { padding: '4px 2px 24px', maxWidth: 820, fontSize: 13, lineHeight: 1.55 },
      h: { fontSize: 15, fontWeight: 600, margin: '0 0 6px' },
      sub: { fontSize: 13, fontWeight: 600, margin: '14px 0 6px' },
      intro: { color: 'var(--dsw-alias-label-secondary)', margin: '0 0 12px' },
      crumb: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
      card: { border: '1px solid var(--dsw-alias-border-l1)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 },
      row: {
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 4px', borderTop: '1px solid var(--dsw-alias-border-l1)',
        cursor: 'pointer',
      },
      rowFirst: { borderTop: 'none' },
      grow: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      meta: { color: 'var(--dsw-alias-label-secondary)', fontSize: 12, flex: '0 0 auto' },
      btn: {
        fontSize: 12, padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
        border: '1px solid var(--dsw-alias-border-l2)', background: 'transparent',
        color: 'var(--dsw-alias-label-primary)',
      },
      btnPrimary: {
        fontSize: 12, padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
        border: '1px solid var(--dsw-alias-brand-primary)', background: 'transparent',
        color: 'var(--dsw-alias-brand-primary)',
      },
      btnDisabled: { fontSize: 12, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--dsw-alias-border-l1)', background: 'transparent', color: 'var(--dsw-alias-label-secondary)', cursor: 'not-allowed' },
      groupTitle: { margin: '14px 0 6px', fontWeight: 600, fontSize: 12, color: 'var(--dsw-alias-label-secondary)' },
      item: { display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 0', cursor: 'pointer' },
      itemName: { fontFamily: 'ui-monospace, monospace', fontSize: 12 },
      itemDesc: { color: 'var(--dsw-alias-label-secondary)', fontSize: 12, marginLeft: 6 },
      itemText: { color: 'var(--dsw-alias-label-secondary)', fontSize: 12, marginTop: 1 },
      note: { marginTop: 10, fontSize: 12, color: 'var(--dsw-alias-label-secondary)' },
      error: { marginTop: 8, fontSize: 12, color: 'var(--dsw-alias-state-error-primary)' },
      list: { maxHeight: 420, overflowY: 'auto' },
      indent: { paddingLeft: 26 },
      arrow: { width: 16, padding: 0, border: 'none', background: 'transparent', color: 'var(--dsw-alias-label-secondary)', cursor: 'pointer', fontSize: 11 },
      chips: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 6 },
      actions: { display: 'flex', gap: 8, marginTop: 14, alignItems: 'center', flexWrap: 'wrap' },
      empty: { padding: '10px 2px', color: 'var(--dsw-alias-label-secondary)' },
    }

    function buildT(ctx) {
      let translate = null
      try {
        translate = ctx.locale.bind('genui-scope')
      } catch {
        translate = null
      }
      const fallback = DICT['zh-CN']
      return (key, vars) => {
        let text = key
        if (translate) {
          try {
            const hit = translate(key)
            if (hit && hit !== key) text = hit
            else if (fallback[key]) text = fallback[key]
          } catch {
            text = fallback[key] || key
          }
        } else {
          text = fallback[key] || key
        }
        if (typeof text !== 'string') return key
        if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v))
        return text
      }
    }

    const errText = (err) => String(err && err.message ? err.message : err)

    function button(t, label, onClick, kind) {
      const style = kind === 'primary' ? S.btnPrimary : kind === 'disabled' ? S.btnDisabled : S.btn
      return h('button', { style, onClick, disabled: kind === 'disabled' }, label)
    }

    const GROUP_LABEL = {
      basic: '基础',
      form: '表单',
      control: '控件',
      table: '表格',
      layout: '布局',
      chart: '图表',
    }

    function groupLabel(category) {
      return GROUP_LABEL[category] || category
    }

    function WorkspaceName(workspace) {
      if (workspace && workspace.title) return String(workspace.title)
      if (workspace && workspace.path) {
        const parts = String(workspace.path).split(/[\\/]/).filter(Boolean)
        if (parts.length > 0) return parts[parts.length - 1]
      }
      return String((workspace && workspace.key) || '').replace(/^--|--$/g, '')
    }

    function SettingsPage(props) {
      const t = props.t
      const ctx = props.ctx
      const [data, setData] = React.useState(null)
      const [routePrefix, setRoutePrefix] = React.useState('/api/genui-scope')
      const [error, setError] = React.useState('')
      const [view, setView] = React.useState({ name: 'home' })
      const [draft, setDraft] = React.useState([])
      const [busy, setBusy] = React.useState(false)
      const [note, setNote] = React.useState('')
      const [newWorkspace, setNewWorkspace] = React.useState('')
      const [expanded, setExpanded] = React.useState({})

      const toggleExpand = (key) => {
        setExpanded((prev) => Object.assign({}, prev, { [key]: !prev[key] }))
      }

      const reload = React.useCallback(async () => {
        try {
          const res = await fetch(`${routePrefix}/state`, { headers: { accept: 'application/json' } })
          const body = await res.json()
          if (!body.ok) throw new Error(body.error || '网络请求失败')
          setData(body)
          if (body.config && typeof body.config.routePrefix === 'string') setRoutePrefix(body.config.routePrefix)
          setError('')
          return body
        } catch (err) {
          setError(t('loadFail', { e: errText(err) }))
          return null
        }
      }, [t, routePrefix])

      React.useEffect(() => {
        reload()
      }, [reload])

      const components = data && Array.isArray(data.components) ? data.components : []
      const names = components.map((item) => item.component)
      const presets = data && data.presets ? data.presets : {}
      const state = data ? data.state : { global: null, workspaces: {}, sessions: {} }
      const forced = data && Array.isArray(data.forced) ? data.forced : ['TinyCard']
      const workspaces = data && Array.isArray(data.workspaces) ? data.workspaces : []

      const layerValue = (level, key) => {
        if (level === 'global') return state.global === undefined ? null : state.global
        if (level === 'session') return Object.prototype.hasOwnProperty.call(state.sessions, key) ? state.sessions[key] : null
        return Object.prototype.hasOwnProperty.call(state.workspaces, key) ? state.workspaces[key] : null
      }

      const statusText = (level, key) => {
        const value = layerValue(level, key)
        if (value === null || value === undefined) return level === 'global' ? t('unfiltered') : t('inherit')
        return t('count', { n: Array.isArray(value) ? value.length : 0 })
      }

      const go = (next) => {
        setNote('')
        setView(next)
      }

      const openEditor = (level, key, label, back) => {
        const value = layerValue(level, key)
        const base = value === null || value === undefined ? names : value
        setDraft(base.filter((n) => names.indexOf(n) >= 0))
        go({ name: 'editor', level, key, label, back: back || { name: 'home' } })
      }

      const draftFor = (wsKey) => {
        if (!wsKey) return names.slice()
        const value = layerValue('workspace', wsKey)
        if (Array.isArray(value)) {
          const picked = value.filter((n) => names.indexOf(n) >= 0)
          return picked.length > 0 ? picked : names.slice()
        }
        return names.slice()
      }

      const openNewSession = (workspaceKey) => {
        const key = workspaceKey || (workspaces[0] && workspaces[0].key) || ''
        setDraft(draftFor(key))
        setNewWorkspace(key)
        go({ name: 'newSession' })
      }

      const openModify = (workspaceKey) => {
        setExpanded((prev) => Object.assign({}, prev, { [workspaceKey]: true }))
        setNote(t('pickSession'))
      }

      const toggle = (name) => {
        setDraft((prev) => (prev.indexOf(name) >= 0 ? prev.filter((n) => n !== name) : prev.concat([name])))
      }

      const normaliseValue = (value) => {
        if (value === null || value === undefined) return null
        if (Array.isArray(value)) {
          const selected = value.filter((n) => names.indexOf(n) >= 0)
          return selected.length >= names.length ? null : selected
        }
        return value
      }

      const postLevel = async (level, key, value) => {
        const res = await fetch(`${routePrefix}/set`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ level, key, value }),
        })
        const body = await res.json()
        if (!body.ok) throw new Error(body.error || '网络请求失败')
        setData((prev) => (prev ? Object.assign({}, prev, { state: body.state }) : prev))
      }

      const save = async (value) => {
        if (view.name !== 'editor') return
        setBusy(true)
        setNote('')
        try {
          await postLevel(view.level, view.key, normaliseValue(value))
          setNote(t('saved'))
          setView(view.back || { name: 'home' })
        } catch (err) {
          setNote(t('saveFail', { e: errText(err) }))
        } finally {
          setBusy(false)
        }
      }

      const createSession = async () => {
        if (!newWorkspace) {
          setNote(t('needWorkspace'))
          return
        }
        const ws = workspaces.filter((w) => w.key === newWorkspace)[0]
        if (!ws || !ws.path) {
          setNote(t('noWorkspacePath'))
          return
        }
        if (typeof ctx.sessions.create !== 'function') {
          setNote(t('createFail', { e: '当前版本不支持从界面新建会话' }))
          return
        }
        setBusy(true)
        setNote('')
        try {
          const target = ws.workspaceId ? { workspaceId: ws.workspaceId } : { cwd: ws.path }
          const id = await ctx.sessions.create(target)
          await postLevel('session', id, normaliseValue(draft))
          try {
            ctx.uiWorkspace.openSession(id)
            setNote(t('createdThenOpen'))
          } catch (err2) {
            setNote(t('created') + '（' + errText(err2) + '）')
          }
          await reload()
        } catch (err) {
          setNote(t('createFail', { e: errText(err) }))
        } finally {
          setBusy(false)
        }
      }

      const picker = () => {
        if (components.length === 0) return h('div', { style: S.empty }, t('loading'))
        const nodes = []
        nodes.push(h('div', { style: S.chips, key: 'presets' },
          h('span', { style: S.meta }, t('presets')),
          ...CHIP_PRESET.map((name) => button(t, t('preset' + name[0].toUpperCase() + name.slice(1)), () => {
            const preset = presets[name]
            setDraft(preset === null || preset === undefined ? names.slice() : preset.slice())
          })),
          button(t, t('presetAll'), () => setDraft(names.slice()))))
        const byGroup = new Map()
        for (const item of components) {
          const g = item.category || 'basic'
          if (!byGroup.has(g)) byGroup.set(g, [])
          byGroup.get(g).push(item)
        }
        for (const [g, items] of byGroup) {
          nodes.push(h('div', { style: S.groupTitle, key: 'g-' + g }, groupLabel(g)))
          for (const item of items) {
            const checked = draft.indexOf(item.component) >= 0
            const locked = forced.indexOf(item.component) >= 0
            nodes.push(h('label', { style: S.item, key: 'c-' + item.component },
              h('input', {
                type: 'checkbox',
                checked: checked || locked,
                disabled: locked,
                onChange: () => { if (!locked) toggle(item.component) },
              }),
              h('span', { style: S.grow },
                h('span', { style: S.itemName }, item.component),
                h('span', { style: S.itemDesc }, item.name + (locked ? ' · ' + t('keepAlways') : '')),
                h('div', { style: S.itemText }, item.description))))
          }
        }
        return h('div', null, nodes)
      }

      const header = (titleText, backView) => h('div', { style: S.crumb },
        button(t, '← ' + t('back'), () => go(backView || { name: 'home' })),
        h('div', { style: S.h }, titleText))

      const statusView = () => {
        if (error) {
          return h('div', { style: S.page }, h('div', { style: S.error }, error), button(t, t('cancel'), reload))
        }
        if (!data) return h('div', { style: Object.assign({}, S.page, S.meta) }, t('loading'))

        if (view.name === 'home') {
          const tree = []
          workspaces.forEach((w, wi) => {
            const open = !!expanded[w.key]
            tree.push(h('div', {
              style: Object.assign({}, S.row, wi === 0 ? S.rowFirst : null),
              key: 'w-' + w.key,
            },
              h('button', {
                style: S.arrow,
                title: open ? t('collapse') : t('expand'),
                onClick: () => toggleExpand(w.key),
              }, open ? '▾' : '▸'),
              h('span', {
                style: S.grow,
                title: w.path || w.key,
                onClick: () => openEditor('workspace', w.key, WorkspaceName(w), { name: 'home' }),
              }, WorkspaceName(w)),
              h('span', { style: S.meta }, statusText('workspace', w.key)),
              button(t, t('modifySession'), () => openModify(w.key))))
            if (!open) return
            const live = (w.sessions || []).filter((s) => !s.archived)
            if (live.length === 0) {
              tree.push(h('div', { style: Object.assign({}, S.row, S.indent), key: 'e-' + w.key },
                h('span', { style: S.empty }, t('sessionsEmpty'))))
              return
            }
            for (const s of live) {
              tree.push(h('div', {
                style: Object.assign({}, S.row, S.indent),
                key: s.id,
                onClick: () => openEditor('session', s.id, SessionName(s), { name: 'home' }),
              },
                h('span', { style: S.grow, title: s.id }, SessionName(s)),
                h('span', { style: S.meta }, statusText('session', s.id)),
                h('span', { style: S.meta }, t('modify') + ' →')))
            }
          })
          return h('div', { style: S.page },
            h('div', { style: S.h }, t('title')),
            h('div', { style: S.intro }, t('intro')),
            h('div', { style: S.sub }, t('globalRule')),
            h('div', { style: S.card },
              h('div', { style: Object.assign({}, S.row, S.rowFirst), onClick: () => openEditor('global', undefined, t('global')) },
                h('span', { style: S.grow }, t('global')),
                h('span', { style: S.meta }, statusText('global')),
                h('span', { style: S.meta }, t('enter') + ' →'))),
            h('div', { style: Object.assign({}, S.sub, { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }) },
              h('span', null, t('workspacesTitle')),
              button(t, t('newSession'), () => openNewSession(), 'primary')),
            h('div', { style: S.card },
              tree.length > 0 ? h('div', { style: S.list }, tree) : h('div', { style: S.empty }, t('workspacesEmpty'))),
            h('div', { style: S.note }, t('hint')),
            h('div', { style: S.note }, t('effect')),
            note ? h('div', { style: S.note }, note) : null)
        }

        if (view.name === 'newSession') {
          const wsRows = workspaces.map((w) => {
            const active = w.key === newWorkspace
            return h('div', {
              style: Object.assign({}, S.row, { cursor: 'pointer' }),
              key: w.key,
              onClick: () => { setNewWorkspace(w.key); setDraft(draftFor(w.key)) },
            },
              h('span', { style: S.grow }, WorkspaceName(w)),
              h('span', { style: S.meta }, active ? '✓' : ''))
          })
          return h('div', { style: S.page },
            header(t('newSessionTitle'), { name: 'home' }),
            h('div', { style: S.intro }, t('newSessionIntro')),
            h('div', { style: S.sub }, t('pickWorkspace')),
            h('div', { style: S.card }, wsRows.length === 0 ? h('div', { style: S.empty }, t('workspacesEmpty')) : wsRows),
            h('div', { style: S.sub }, t('pickComponents')),
            h('div', { style: S.card }, picker()),
            h('div', { style: S.actions },
              busy ? h('span', { style: S.meta }, t('saving')) : null,
              button(t, t('create'), createSession, newWorkspace ? 'primary' : 'disabled'),
              button(t, t('cancel'), () => go({ name: 'home' }))),
            note ? h('div', { style: S.note }, note) : null)
        }

        if (view.name === 'editor') {
          const titleText = view.label || (view.level === 'global' ? t('globalRule') : view.level === 'workspace' ? t('workspaceRule') : t('sessionRule'))
          const back = view.back || { name: 'home' }
          return h('div', { style: S.page },
            header(titleText, back),
            h('div', { style: S.sub }, t('pickTitle')),
            h('div', { style: S.card }, picker()),
            h('div', { style: S.actions },
              busy ? h('span', { style: S.meta }, t('saving')) : null,
              button(t, t('save'), () => save(draft), 'primary'),
              button(t, t('clear'), () => save(null)),
              button(t, t('cancel'), () => go({ name: 'home' }))),
            h('div', { style: S.note }, t('effect')),
            note ? h('div', { style: S.note }, note) : null)
        }

        return h('div', { style: S.page }, header(t('title')), h('div', { style: S.empty }, '—'))
      }

      function SessionName(session) {
        const title = session && session.title ? String(session.title) : ''
        if (title) return title
        const id = String(session && session.id ? session.id : '')
        const tail = id.replace(/^session-/, '').slice(0, 6)
        return t('untitled') + (tail ? ' ' + tail : '')
      }

      function allSessions() {
        const out = []
        for (const w of workspaces) {
          for (const s of (w.sessions || [])) {
            if (s.archived) continue
            out.push({ id: s.id, title: SessionName(s), mtime: s.mtime, workspace: WorkspaceName(w) })
          }
        }
        out.sort((a, b) => b.mtime - a.mtime)
        return out
      }

      return statusView()
    }

    return {
      inject: ['slots', 'locale', 'uiWorkspace', 'sessions'],
      apply(ctx) {
        const t = buildT(ctx)
        ctx.effect(() => ctx.locale.register('genui-scope', 'zh-CN', DICT['zh-CN']))
        if (DICT.en) ctx.effect(() => ctx.locale.register('genui-scope', 'en', DICT.en))

        const Page = (props) => h(SettingsPage, Object.assign({}, props, { t, ctx }))
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'genui-scope',
          order: 60,
          label: () => t('nav'),
        }, Page))
      },
    }
  },
})
