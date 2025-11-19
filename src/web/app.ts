import express from 'express'
import type { DB } from '../database/db'
import { getAllConfig, maskConfig, setManyConfig } from '../database/config'
import { testAzureToken } from '../auth/azure'
import { sendEmailViaO365 } from '../smtp/o365Client'
import { getSmtpStatus, startSmtpServer, stopSmtpServer } from '../smtp/server'

export function createWebApp(db: DB, ctx: { smtpPort: number }) {
  const app = express()
  app.use(express.json({ limit: '2mb' }))
  // Servir les fichiers statiques de l'interface web
  app.use(express.static('public'))

  app.get('/api/status', (_req: any, res: any) => {
    const row = db.prepare('SELECT COUNT(1) as c FROM emails').get() as { c: number }
    const st = getSmtpStatus()
    res.json({
      smtp: { running: st.running, port: st.port ?? ctx.smtpPort },
      db: { ok: true },
      totals: { emails: row?.c || 0 },
      version: '1.0.0'
    })
  })

  app.get('/api/emails', (req: any, res: any) => {
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10), 200)
    const offset = Math.max(parseInt(String(req.query.offset || '0'), 10), 0)
    const where: string[] = []
    const params: any[] = []
    const status = String(req.query.status || '')
    const from = String(req.query.from || '')
    const to = String(req.query.to || '')
    const q = String(req.query.q || '')
    if (status) { where.push('status = ?'); params.push(status) }
    if (from) { where.push('from_address LIKE ?'); params.push(`%${from}%`) }
    if (to) { where.push('to_addresses LIKE ?'); params.push(`%${to}%`) }
    if (q) { where.push('(subject LIKE ? OR body_text LIKE ?)'); params.push(`%${q}%`, `%${q}%`) }
    const whereSql = where.length ? ('WHERE ' + where.join(' AND ')) : ''
    const sql = `SELECT id, from_address, to_addresses, subject, received_at, status, size_bytes FROM emails ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`
    const rows = db.prepare(sql).all(...params, limit, offset)
    res.json({ items: rows, limit, offset, filters: { status, from, to, q } })
  })

  app.get('/api/emails/:id', (req: any, res: any) => {
    const row = db.prepare('SELECT * FROM emails WHERE id = ?').get(req.params.id)
    if (!row) return res.status(404).json({ error: 'not_found' })
    res.json(row)
  })

  app.get('/api/logs/system', (_req: any, res: any) => {
    const rows = db.prepare(
      'SELECT id, level, component, message, created_at FROM system_logs ORDER BY id DESC LIMIT 200'
    ).all()
    res.json({ items: rows })
  })

  // Configuration - lecture
  app.get('/api/config', (_req: any, res: any) => {
    const envDefaults: Record<string, string> = {
      SMTP_PORT: String(process.env.SMTP_PORT || '2525'),
      WEB_PORT: String(process.env.WEB_PORT || '3000'),
      AZURE_TENANT_ID: String(process.env.AZURE_TENANT_ID || ''),
      AZURE_CLIENT_ID: String(process.env.AZURE_CLIENT_ID || ''),
      AZURE_CLIENT_SECRET: String(process.env.AZURE_CLIENT_SECRET || ''),
      O365_USER_EMAIL: String(process.env.O365_USER_EMAIL || '')
    }
    const cfg = { ...envDefaults, ...getAllConfig(db) }
    res.json({ config: maskConfig(cfg) })
  })

  // Configuration - écriture basique
  app.put('/api/config', (req: any, res: any) => {
    const body = (req.body || {}) as Record<string, any>
    const allowedKeys = new Set([
      'SMTP_PORT',
      'WEB_PORT',
      'AZURE_TENANT_ID',
      'AZURE_CLIENT_ID',
      'AZURE_CLIENT_SECRET',
      'O365_USER_EMAIL'
    ])
    const updates: Record<string, string> = {}
    for (const [k, v] of Object.entries(body)) {
      if (!allowedKeys.has(k)) continue
      if (typeof v !== 'string') return res.status(400).json({ error: 'invalid_type', key: k })
      if (v.length > 4000) return res.status(400).json({ error: 'too_long', key: k })
      updates[k] = v
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'no_updates' })
    setManyConfig(db, updates)
    db.prepare('INSERT INTO system_logs (level, component, message, details) VALUES (?, ?, ?, ?)').run(
      'info',
      'web',
      'Configuration mise à jour',
      JSON.stringify({ keys: Object.keys(updates) })
    )
    const cfg = { ...getAllConfig(db) }
    res.json({ ok: true, config: maskConfig(cfg) })
  })

  // Test Azure AD (OAuth2) - obtention d'un token (sans divulguer le token)
  app.post('/api/config/test', async (_req: any, res: any) => {
    try {
      const cfg = { ...getAllConfig(db) }
      const result = await testAzureToken(db, cfg)
      res.json({ ok: true, provider: 'azure', expiresOn: result.expiresOn, scope: result.scope })
    } catch (err) {
      db.prepare('INSERT INTO system_logs (level, component, message, details) VALUES (?, ?, ?, ?)').run(
        'error',
        'oauth',
        'Echec test Azure token',
        JSON.stringify({ err: String(err) })
      )
      res.status(400).json({ ok: false, error: 'oauth_error', details: String(err) })
    }
  })

  // Déclencher l'envoi d'un email vers Office 365
  app.post('/api/emails/:id/send', async (req: any, res: any) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: 'invalid_id' })
    try {
      const result = await sendEmailViaO365(db, id)
      res.json({ ok: result.ok, messageId: result.messageId, response: result.response })
    } catch (err: any) {
      res.status(400).json({ ok: false, error: String(err && err.message ? err.message : err) })
    }
  })

  // Alias retry
  app.post('/api/emails/:id/retry', async (req: any, res: any) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: 'invalid_id' })
    try {
      const result = await sendEmailViaO365(db, id)
      res.json({ ok: result.ok, messageId: result.messageId, response: result.response })
    } catch (err: any) {
      res.status(400).json({ ok: false, error: String(err && err.message ? err.message : err) })
    }
  })

  // Redémarrer le serveur SMTP (FR-28)
  app.post('/api/smtp/restart', async (_req: any, res: any) => {
    try {
      await stopSmtpServer()
      const port = parseInt(String((getAllConfig(db) as any).SMTP_PORT || process.env.SMTP_PORT || '2525'), 10)
      await startSmtpServer(db, port)
      db.prepare('INSERT INTO system_logs (level, component, message, details) VALUES (?, ?, ?, ?)').run(
        'info', 'web', 'SMTP redémarré', JSON.stringify({ port })
      )
      res.json({ ok: true, port })
    } catch (err: any) {
      db.prepare('INSERT INTO system_logs (level, component, message, details) VALUES (?, ?, ?, ?)').run(
        'error', 'web', 'Echec redémarrage SMTP', JSON.stringify({ err: String(err) })
      )
      res.status(500).json({ ok: false, error: String(err) })
    }
  })

  // Route racine: livrer l'interface
  app.get('/', (_req: any, res: any) => {
    res.sendFile('index.html', { root: 'public' })
  })

  return app
}
