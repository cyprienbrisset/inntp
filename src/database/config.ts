import type { DB } from './db'

export type ConfigMap = Record<string, string>

export function getAllConfig(db: DB): ConfigMap {
  const rows = db.prepare('SELECT key, value FROM config').all() as { key: string; value: string }[]
  const map: ConfigMap = {}
  for (const r of rows) map[r.key] = r.value
  return map
}

export function setConfig(db: DB, key: string, value: string) {
  db.prepare(
    'INSERT INTO config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP'
  ).run(key, value)
}

export function setManyConfig(db: DB, cfg: ConfigMap) {
  const tx = db.transaction((entries: [string, string][]) => {
    const stmt = db.prepare(
      'INSERT INTO config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP'
    )
    for (const [k, v] of entries) stmt.run(k, v)
  })
  tx(Object.entries(cfg))
}

export function maskConfig(cfg: ConfigMap): ConfigMap {
  const sensitive = new Set(['AZURE_CLIENT_SECRET'])
  const partial = new Set(['AZURE_TENANT_ID', 'AZURE_CLIENT_ID'])
  const out: ConfigMap = { ...cfg }
  for (const k of Object.keys(out)) {
    const v = out[k]
    if (!v) continue
    if (sensitive.has(k)) out[k] = maskSecret(v)
    else if (partial.has(k)) out[k] = maskPartial(v)
  }
  return out
}

function maskSecret(v: string) {
  if (!v) return v
  return '•'.repeat(Math.min(v.length, 12))
}

function maskPartial(v: string) {
  if (v.length <= 6) return v[0] + '•••'
  return v.slice(0, 3) + '••••••' + v.slice(-3)
}
