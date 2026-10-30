/**
 * genui-scope: three-level component scope for the GenUI card prompt.
 *
 * dsh-genui registers one static system-prompt section (`genui:cards`, ~62k chars)
 * that documents every card component. This plugin trims that section per session:
 * only the allowed components keep their catalog entry, JSON-schema enum values and
 * schema snippets, which is where most of the prompt's characters go.
 *
 * Scope precedence: session > workspace > global > the untouched prompt.
 * A workspace is keyed by the `sessions/<encoded cwd>` directory name that DSH
 * already uses, so the key is stable and collision free without decoding it.
 */

import { appendFileSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { zstdDecompressSync } from 'node:zlib'

export const name = 'genui-scope'
export const inject = ['systemPrompt', 'tools', 'sessions', 'webServer']

const here = dirname(fileURLToPath(import.meta.url))

/** Component metadata extracted from the GenUI authoring prompt (name + description). */
const COMPONENTS = (() => {
  try {
    const parsed = JSON.parse(readFileSync(join(here, 'data', 'components.json'), 'utf8'))
    if (Array.isArray(parsed)) return parsed.filter((item) => item && typeof item.component === 'string')
  } catch {}
  return []
})()

/** Derived from data/components.json, so the catalog only lives in one place. */
const ALL = [...new Set(COMPONENTS.map((item) => item.component))]
const ALL_SET = new Set(ALL)

/** Components grouped by the category recorded in data/components.json. */
const CATEGORY = (() => {
  const map = {}
  for (const item of COMPONENTS) {
    const cat = typeof item.category === 'string' && item.category ? item.category : 'basic'
    if (!map[cat]) map[cat] = []
    map[cat].push(item.component)
  }
  return map
})()
const pick = (...cats) => [...new Set(cats.flatMap((cat) => CATEGORY[cat] ?? []))]

/** Every hard-coded default; each can be overridden from the plugin config. */
const DEFAULTS = {
  stateFile: 'genui-scope.json',
  logFile: 'genui-scope.log',
  routePrefix: '/api/genui-scope',
  sectionPattern: 'genui',
  force: ['TinyCard'],
  anchors: {
    whitelist: '必须使用以下支持的 componentName',
    catalog: '具体组件的上下文如下',
    snippets: '## Schema Snippets',
  },
}
let CONFIG = { ...DEFAULTS, anchors: { ...DEFAULTS.anchors } }

/** Built-in named scopes; `null` means "every component". */
const PRESETS = {
  all: null,
  text: pick('basic'),
  form: pick('basic', 'form', 'control', 'layout'),
  table: pick('basic', 'table', 'layout'),
  chart: pick('basic', 'chart', 'layout'),
  lean: pick('basic', 'form', 'control', 'table', 'layout'),
}

const SCOPES = ['session', 'workspace', 'global']
const LOG_LIMIT = 8
let logCount = 0

function homeDir() {
  return process.env.DSH_HOME || process.env.DEEPSEEK_HOME || join(homedir(), '.dsh')
}
function statePath() {
  return join(homeDir(), CONFIG.stateFile)
}
function logLine(line) {
  if (logCount >= LOG_LIMIT) return
  logCount += 1
  try {
    appendFileSync(join(homeDir(), CONFIG.logFile), `${new Date().toISOString()} ${line}\n`)
  } catch {}
}

/** The `sessions/<dir>` name DSH derives from a workspace path. */
export function encodeWorkspace(cwd) {
  const body = String(cwd).replace(/:/g, '').replace(/[\\/]/g, '-')
  return `--${body}--`
}

function emptyState() {
  return { version: 2, global: null, workspaces: {}, sessions: {} }
}
/** Warn once per anchor: the prompt was not rewritten because its anchor moved. */
const warned = new Set()
function warnOnce(key, message) {
  if (warned.has(key)) return
  warned.add(key)
  try {
    appendFileSync(join(homeDir(), CONFIG.logFile), `${new Date().toISOString()} warn ${key}: ${message}\n`)
  } catch {}
}
function loadState() {
  let parsed
  try {
    parsed = JSON.parse(readFileSync(statePath(), 'utf8'))
  } catch {
    return emptyState()
  }
  const state = emptyState()
  if (parsed && typeof parsed === 'object') {
    if (Object.prototype.hasOwnProperty.call(parsed, 'global')) state.global = parsed.global
    else if (Object.prototype.hasOwnProperty.call(parsed, 'default')) state.global = parsed.default
    if (parsed.workspaces && typeof parsed.workspaces === 'object') state.workspaces = parsed.workspaces
    if (parsed.sessions && typeof parsed.sessions === 'object') state.sessions = parsed.sessions
  }
  return state
}
function saveState(state) {
  const file = statePath()
  try {
    mkdirSync(dirname(file), { recursive: true })
    const tmp = `${file}.${process.pid}.tmp`
    writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8')
    renameSync(tmp, file)
  } catch {}
}

function has(table, key) {
  return Boolean(key) && Object.prototype.hasOwnProperty.call(table, key)
}
/** Accept a preset name, an explicit list, or null; return a component list or null (= all). */
function normalise(value) {
  if (value == null) return null
  if (typeof value === 'string') {
    if (Object.prototype.hasOwnProperty.call(PRESETS, value)) return PRESETS[value] ? [...PRESETS[value]] : null
    return null
  }
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string')
  return null
}

/** Which level decided the effective scope: session, workspace, global or none. */
function resolveLevel(state, sessionId, cwd) {
  if (has(state.sessions, sessionId)) return { level: 'session', value: normalise(state.sessions[sessionId]) }
  const key = cwd ? encodeWorkspace(cwd) : undefined
  if (has(state.workspaces, key)) return { level: 'workspace', value: normalise(state.workspaces[key]), key }
  if (Object.prototype.hasOwnProperty.call(state, 'global') && state.global != null) {
    return { level: 'global', value: normalise(state.global) }
  }
  return { level: 'none', value: null }
}
const forcedList = () => CONFIG.force.filter((name) => ALL_SET.has(name))

function allowedFor(state, sessionId, cwd) {
  const picked = resolveLevel(state, sessionId, cwd).value
  if (picked === null) return null
  const set = new Set(picked.filter((n) => ALL_SET.has(n)))
  for (const forced of forcedList()) set.add(forced)
  return ALL.filter((n) => set.has(n))
}

const cache = new Map()

/** Rewrite the GenUI prompt so only `allowed` components survive. */
function filterPrompt(text, allowed) {
  if (!Array.isArray(allowed) || allowed.length === 0 || allowed.length >= ALL.length) return text
  const key = allowed.join('|')
  const hit = cache.get(key)
  if (hit !== undefined) return hit
  const keep = new Set(allowed)
  let out = text

  const anchors = CONFIG.anchors

  // 1. "必须使用以下支持的 componentName：`a`, `h1`, ..."
  const intro = out.indexOf(anchors.whitelist)
  if (intro >= 0) {
    const listMatch = /(`[A-Za-z][A-Za-z0-9]*`(?:, `[A-Za-z][A-Za-z0-9]*`)+)/.exec(out.slice(intro))
    if (listMatch) {
      const names = [...listMatch[1].matchAll(/`([A-Za-z][A-Za-z0-9]*)`/g)].map((m) => m[1])
      const kept = names.filter((n) => !ALL_SET.has(n) || keep.has(n))
      const rebuilt = kept.map((n) => `\`${n}\``).join(', ')
      const start = intro + listMatch.index
      out = out.slice(0, start) + rebuilt + out.slice(start + listMatch[1].length)
    }
  } else {
    warnOnce('whitelist', '组件名单锚点未找到，该段未裁剪')
  }

  // 2. The component catalog JSON array.
  const anchor = out.indexOf(anchors.catalog)
  if (anchor >= 0) {
    const open = out.indexOf('```json', anchor)
    const close = open >= 0 ? out.indexOf('```', open + 7) : -1
    if (open >= 0 && close > open) {
      try {
        const list = JSON.parse(out.slice(open + 7, close).trim())
        if (Array.isArray(list)) {
          const kept = list.filter((item) => !ALL_SET.has(item?.component) || keep.has(item.component))
          out = out.slice(0, open + 7) + '\n' + JSON.stringify(kept) + '\n' + out.slice(close)
        }
      } catch {}
    }
  } else {
    warnOnce('catalog', '组件目录锚点未找到，该段未裁剪')
  }

  // 3. Every component-name enum inside the schema document.
  out = out.replace(/"enum":\[([^\]]*)\]/g, (whole, inner) => {
    try {
      const arr = JSON.parse(`[${inner}]`)
      if (!Array.isArray(arr) || arr.length === 0) return whole
      if (!arr.every((v) => typeof v === 'string' && ALL_SET.has(v))) return whole
      const kept = arr.filter((v) => keep.has(v))
      return kept.length === 0 ? whole : `"enum":[${kept.map((v) => JSON.stringify(v)).join(',')}]`
    } catch {
      return whole
    }
  })

  // 4. Schema snippets of components that are no longer available.
  const snippets = out.indexOf(anchors.snippets)
  if (snippets >= 0) {
    const open = out.indexOf('```json', snippets)
    const close = open >= 0 ? out.indexOf('```', open + 7) : -1
    if (open >= 0 && close > open) {
      try {
        const list = JSON.parse(out.slice(open + 7, close).trim())
        if (Array.isArray(list)) {
          const kept = list.filter((item) => !ALL_SET.has(item?.componentName) || keep.has(item.componentName))
          out = out.slice(0, open + 7) + '\n' + JSON.stringify(kept) + '\n' + out.slice(close)
        }
      } catch {}
    }
  }

  cache.set(key, out)
  return out
}

function filterAssembly(assembly, sessionId, cwd, state) {
  if (!assembly || !Array.isArray(assembly.sections)) return assembly
  const allowed = allowedFor(state, sessionId, cwd)
  if (allowed === null) return assembly
  let changed = false
  const sections = assembly.sections.map((section) => {
    if (!section || typeof section.text !== 'string' || !new RegExp(CONFIG.sectionPattern, 'i').test(section.name || '')) return section
    const trimmed = filterPrompt(section.text, allowed)
    if (trimmed === section.text) return section
    changed = true
    return { ...section, text: trimmed }
  })
  if (!changed) return assembly
  logLine(`filter session=${sessionId} allowed=${allowed.length} chars=${sections.map((s) => s.text.length).join(',')}`)
  return { ...assembly, sections }
}

/** Test surface for offline verification of the text filter. */
export const __test = { filterPrompt, allowedFor, resolveLevel, encodeWorkspace, scanSessions, PRESETS, ALL, COMPONENTS }

function describe(sessionId, cwd, state) {
  const resolved = resolveLevel(state, sessionId, cwd)
  const allowed = allowedFor(state, sessionId, cwd)
  return {
    session: sessionId ?? null,
    workspace: cwd ? { cwd, key: encodeWorkspace(cwd) } : null,
    level: resolved.level,
    value: resolved.value === null ? 'all' : resolved.value,
    effective: allowed === null ? 'all' : allowed,
    layers: {
      session: has(state.sessions, sessionId) ? state.sessions[sessionId] : null,
      workspace: has(state.workspaces, cwd ? encodeWorkspace(cwd) : undefined) ? state.workspaces[encodeWorkspace(cwd)] : null,
      global: state.global ?? null,
    },
  }
}

const META_CACHE = new Map()

/** Title and cwd of one session log: the last `session/title` event names it. */
function sessionMeta(file) {
  let st
  try {
    st = statSync(file)
  } catch {
    return null
  }
  const hit = META_CACHE.get(file)
  if (hit && hit.size === st.size && hit.mtime === st.mtimeMs) return hit.meta
  let meta = null
  try {
    const buf = readFileSync(file)
    const starts = []
    for (let i = 0; i + 3 < buf.length; i += 1) {
      if (buf[i] === 0x28 && buf[i + 1] === 0xb5 && buf[i + 2] === 0x2f && buf[i + 3] === 0xfd) starts.push(i)
    }
    let text = ''
    for (let k = 0; k < starts.length; k += 1) {
      const end = k + 1 < starts.length ? starts[k + 1] : buf.length
      try {
        text += zstdDecompressSync(buf.subarray(starts[k], end)).toString('utf8')
      } catch {}
    }
    let title = null
    let cwd = null
    for (const line of text.split('\n')) {
      if (!line) continue
      let event
      try {
        event = JSON.parse(line)
      } catch {
        continue
      }
      if (!cwd && event.type === 'session' && typeof event.cwd === 'string') cwd = event.cwd
      if (event.type === 'session/title' && typeof event.data?.title === 'string') title = event.data.title
    }
    meta = { title, cwd }
  } catch {
    meta = null
  }
  META_CACHE.set(file, { size: st.size, mtime: st.mtimeMs, meta })
  return meta
}

/** Windows path identity: case and trailing separator insensitive. */
function normPath(value) {
  return normalize(String(value)).replace(/[\\/]+$/, '').toLowerCase()
}

let REG_CACHE = { stamp: null, value: null }

/**
 * `$DSH_HOME/storages/workspace.json` is the Workspace registry the sidebar renders:
 * it carries the display title, the workspace id and the session order.
 */
function workspaceRegistry() {
  const file = join(homeDir(), 'storages', 'workspace.json')
  let st
  try {
    st = statSync(file)
  } catch {
    return null
  }
  const stamp = `${st.size}:${st.mtimeMs}`
  if (REG_CACHE.stamp === stamp) return REG_CACHE.value
  let value = null
  try {
    const doc = JSON.parse(readFileSync(file, 'utf8'))
    const table = doc?.tables?.workspaces ?? {}
    const byPath = new Map()
    for (const [workspaceId, entry] of Object.entries(table)) {
      if (!entry || typeof entry.path !== 'string') continue
      byPath.set(normPath(entry.path), {
        workspaceId,
        title: typeof entry.title === 'string' && entry.title ? entry.title : basename(entry.path),
        order: new Map((Array.isArray(entry.sessionIds) ? entry.sessionIds : []).map((id, i) => [id, i])),
      })
    }
    const archived = new Set(Array.isArray(doc?.global?.archivedSessionIds) ? doc.global.archivedSessionIds : [])
    value = { byPath, archived }
  } catch {
    value = null
  }
  REG_CACHE = { stamp, value }
  return value
}

/** Live scan of `$DSH_HOME/sessions`: workspaces and their recent sessions. */
function scanSessions() {
  const root = join(homeDir(), 'sessions')
  const registry = workspaceRegistry()
  const out = []
  let dirs = []
  try {
    dirs = readdirSync(root, { withFileTypes: true })
  } catch {
    return out
  }
  for (const dir of dirs) {
    if (!dir.isDirectory()) continue
    const found = []
    try {
      for (const sub of readdirSync(join(root, dir.name), { withFileTypes: true })) {
        if (!sub.isDirectory()) continue
        const dirPath = join(root, dir.name, sub.name)
        let mtime = 0
        try {
          mtime = statSync(dirPath).mtimeMs
        } catch {}
        found.push({ id: sub.name, mtime, file: join(dirPath, 'session.v4.jsonl.zstd') })
      }
    } catch {}
    found.sort((a, b) => b.mtime - a.mtime)
    let path = null
    const sessions = found.slice(0, 100).map((item) => {
      const meta = sessionMeta(item.file)
      if (meta?.cwd && !path) path = meta.cwd
      return { id: item.id, title: meta?.title ?? null, mtime: item.mtime }
    })
    const entry = path ? registry?.byPath.get(normPath(path)) : undefined
    const order = entry?.order
    sessions.sort((a, b) => {
      const oa = order?.get(a.id)
      const ob = order?.get(b.id)
      if (oa !== undefined || ob !== undefined) {
        return (oa ?? Number.MAX_SAFE_INTEGER) - (ob ?? Number.MAX_SAFE_INTEGER)
      }
      return b.mtime - a.mtime
    })
    for (const item of sessions) item.archived = registry?.archived.has(item.id) ?? false
    out.push({
      key: dir.name,
      path,
      workspaceId: entry?.workspaceId ?? null,
      title: entry?.title ?? (path ? basename(path) : dir.name),
      count: found.length,
      sessions,
    })
  }
  out.sort((a, b) => b.count - a.count)
  return out
}

export function apply(ctx, config) {
  const incoming = config && typeof config === 'object' ? config : {}
  CONFIG = {
    ...DEFAULTS,
    ...incoming,
    anchors: { ...DEFAULTS.anchors, ...(incoming.anchors || {}) },
  }
  cache.clear()
  const state = { current: loadState() }
  const cwdOf = (sessionId) => {
    try {
      return sessionId ? ctx.sessions.get(sessionId)?.header?.cwd : undefined
    } catch {
      return undefined
    }
  }

  // ---- HTTP bridge for the settings page -------------------------------------
  const sendJson = (res, status, body) => {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
    res.end(JSON.stringify(body))
  }
  const readJson = (req) => new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 1_000_000) req.destroy()
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'))
      } catch {
        resolve(null)
      }
    })
    req.on('error', () => resolve(null))
  })
  const snapshot = () => ({
    state: state.current,
    components: COMPONENTS,
    presets: PRESETS,
    forced: forcedList(),
    config: { routePrefix: CONFIG.routePrefix, sectionPattern: CONFIG.sectionPattern, force: CONFIG.force },
    workspaces: scanSessions(),
  })

  ctx.effect(() => {
    const offState = ctx.webServer.register({
      kind: 'exact',
      path: `${CONFIG.routePrefix}/state`,
      handler: (req, res) => {
        if (req.method !== 'GET') return sendJson(res, 405, { ok: false, error: 'GET only' })
        try {
          sendJson(res, 200, { ok: true, ...snapshot() })
        } catch (err) {
          sendJson(res, 500, { ok: false, error: String(err?.message ?? err) })
        }
      },
    })
    const offSet = ctx.webServer.register({
      kind: 'exact',
      path: `${CONFIG.routePrefix}/set`,
      handler: async (req, res) => {
        if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'POST only' })
        const body = await readJson(req)
        if (!body) return sendJson(res, 400, { ok: false, error: 'invalid json' })
        const level = body.level
        const key = typeof body.key === 'string' && body.key ? body.key : undefined
        const table = level === 'global' ? 'global' : level === 'session' ? 'sessions' : level === 'workspace' ? 'workspaces' : null
        if (!table) return sendJson(res, 400, { ok: false, error: 'level must be global | workspace | session' })
        if (table !== 'global' && !key) return sendJson(res, 400, { ok: false, error: `missing key for ${level}` })

        const raw = body.value ?? null
        let next = null
        if (raw !== null) {
          if (typeof raw === 'string') {
            if (!Object.prototype.hasOwnProperty.call(PRESETS, raw)) {
              return sendJson(res, 400, { ok: false, error: `unknown preset: ${raw}` })
            }
            next = PRESETS[raw]
          } else if (Array.isArray(raw)) {
            const wanted = raw.filter((v) => typeof v === 'string')
            const unknown = wanted.filter((n) => !ALL_SET.has(n))
            if (unknown.length > 0) return sendJson(res, 400, { ok: false, error: 'unknown components', unknown })
            if (wanted.length === 0) return sendJson(res, 400, { ok: false, error: 'empty component list' })
            next = wanted
          } else {
            return sendJson(res, 400, { ok: false, error: 'value must be null, a preset name or an array' })
          }
        }

        if (table === 'global') state.current.global = next
        else if (next === null) delete state.current[table][key]
        else state.current[table][key] = next
        saveState(state.current)
        logLine(`set ${level}${key ? `=${key}` : ''} => ${next === null ? 'inherit' : Array.isArray(next) ? next.length : next}`)
        sendJson(res, 200, { ok: true, state: state.current })
      },
    })
    return () => {
      offState()
      offSet()
    }
  }, 'genui-scope: web routes')

  ctx.effect(() => ctx.tools.register({
    name: 'card_components',
    description: [
      'Choose which GenUI card components this session may use. The untrimmed card prompt costs ~62k characters;',
      'restricting it to the needed components removes most of it from every request of this session.',
      'Scopes: session (default), workspace (keyed by the workspace directory), global. Precedence: session > workspace > global.',
      'Actions: status | catalog | list | use {profile, scope?} | set {components, scope?} | clear {scope}.',
      'Built-in presets: all (no restriction), lean (text+form+table, no charts), text, form, table, chart.',
    ].join(' '),
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['status', 'catalog', 'list', 'use', 'set', 'clear'] },
        scope: { type: 'string', enum: SCOPES },
        profile: { type: 'string', description: 'Preset or saved profile name, or "all".' },
        components: { type: 'array', items: { type: 'string' }, description: 'Explicit component names.' },
      },
      required: ['action'],
      additionalProperties: false,
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render(args, value) {
        return [{ type: 'text', text: JSON.stringify(value) }]
      },
    },
    async execute(args, exec) {
      const action = String(args?.action ?? 'status')
      const sessionId = exec?.agent?.id
      const cwd = cwdOf(sessionId)
      const scope = SCOPES.includes(args?.scope) ? args.scope : 'session'
      const state0 = state.current
      const reply = (data) => ({ ok: true, ...data })

      if (action === 'list') return reply({ components: ALL, presets: Object.keys(PRESETS) })
      if (action === 'catalog') return reply({ components: COMPONENTS, presets: Object.keys(PRESETS) })
      if (action === 'status') return reply(describe(sessionId, cwd, state0))

      const requireKey = () => {
        if (scope === 'session') return sessionId ? { table: 'sessions', key: sessionId } : null
        if (scope === 'workspace') return cwd ? { table: 'workspaces', key: encodeWorkspace(cwd) } : null
        return { table: 'global' }
      }
      const target = requireKey()
      if (!target) return { ok: false, error: `no ${scope} scope available` }

      if (action === 'clear') {
        if (target.table === 'global') state0.global = null
        else if (Object.prototype.hasOwnProperty.call(state0[target.table], target.key)) delete state0[target.table][target.key]
        saveState(state0)
        return reply({ cleared: scope, ...describe(sessionId, cwd, state0) })
      }

      let value
      if (action === 'use') {
        const wanted = String(args?.profile ?? '')
        if (wanted !== 'all' && PRESETS[wanted] === undefined) {
          return { ok: false, error: `unknown profile: ${wanted}`, presets: Object.keys(PRESETS) }
        }
        value = wanted === 'all' ? null : wanted
      } else if (action === 'set') {
        const wanted = Array.isArray(args?.components) ? args.components.map(String) : []
        const unknown = wanted.filter((n) => !ALL_SET.has(n))
        if (unknown.length > 0) return { ok: false, error: 'unknown components', unknown, components: ALL }
        if (wanted.length === 0) return { ok: false, error: 'empty component list; use clear to inherit' }
        value = wanted
      } else {
        return { ok: false, error: `unknown action: ${action}` }
      }

      if (target.table === 'global') state0.global = value
      else state0[target.table][target.key] = value
      saveState(state0)
      return reply({ scope, saved: value ?? 'all', ...describe(sessionId, cwd, state0) })
    },
  }), 'genui-scope: card_components tool')

  const agentDisposers = new Map()
  ctx.effect(() => () => {
    for (const dispose of agentDisposers.values()) dispose()
    agentDisposers.clear()
  }, 'genui-scope: agent listeners')

  ctx.on('agent/created', ({ agent }) => {
    if (!agent?.ctx?.on || !agent?.id) return
    const dispose = agent.ctx.effect(() => agent.ctx.on('system-prompt/assemble', async (assembly, context, next) => {
      const resolved = await next()
      return filterAssembly(resolved, agent.id, cwdOf(agent.id), state.current)
    }), 'genui-scope: prompt filter')
    agentDisposers.set(agent.id, dispose)
  })

  // Fallback: a root-scoped listener also sees every assembly; it only acts when the
  // agent-scoped listener is unavailable and the scope exposes a session id.
  ctx.on('system-prompt/assemble', async (assembly, context, next) => {
    const resolved = await next()
    const scope = context?.scope
    const id = typeof scope?.id === 'string' ? scope.id : (typeof scope?.sessionId === 'string' ? scope.sessionId : undefined)
    if (!id || agentDisposers.has(id)) return resolved
    return filterAssembly(resolved, id, cwdOf(id), state.current)
  })
}
