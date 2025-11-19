import { SMTPServer } from 'smtp-server'
import { simpleParser } from 'mailparser'
import type { DB } from '../database/db'

let currentServer: SMTPServer | null = null
let currentPort: number | null = null
let currentDb: DB | null = null

export function getSmtpStatus() {
  return { running: !!currentServer, port: currentPort }
}

export async function stopSmtpServer() {
  if (!currentServer) return
  await new Promise<void>((resolve) => {
    try {
      currentServer!.close(() => resolve())
    } catch {
      resolve()
    }
  })
  currentServer = null
  currentPort = null
  currentDb = null
}

export async function startSmtpServer(db: DB, port: number) {
  // Si déjà en cours sur le même port, ne rien faire
  if (currentServer && currentPort === port) return
  // Si un autre serveur tourne, l'arrêter d'abord
  if (currentServer && currentPort !== port) {
    await stopSmtpServer()
  }

  const server = new SMTPServer({
    disabledCommands: ['AUTH'],
    logger: false,
    onConnect(session: any, callback: any) {
      try {
        const info = { remote_ip: session.remoteAddress || 'unknown' }
        const stmt = db.prepare('INSERT INTO smtp_connections (remote_ip) VALUES (?)')
        const res = stmt.run(info.remote_ip)
        ;(session as any)._conn_id = res.lastInsertRowid
        callback()
      } catch (e) {
        callback(new Error('connexion refusée'))
      }
    },
    onClose(session: any) {
      try {
        const id = (session as any)._conn_id
        if (id) {
          db.prepare('UPDATE smtp_connections SET disconnected_at = CURRENT_TIMESTAMP WHERE id = ?').run(id)
        }
      } catch {}
    },
    async onData(stream: any, session: any, callback: any) {
      try {
        const parsed = await simpleParser(stream)
        const toAddresses = ([] as string[]).concat(
          (parsed.to?.value || []).map((v: any) => v.address || ''),
          (parsed.cc?.value || []).map((v: any) => v.address || '')
        )
        const bcc = (parsed.bcc?.value || []).map((v: any) => v.address || '')
        const insert = db.prepare(`
          INSERT INTO emails (
            message_id, from_address, to_addresses, cc_addresses, bcc_addresses,
            subject, body_text, body_html, attachments, headers, size_bytes, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received')
        `)

        const attachments = (parsed.attachments || []).map((a: any) => ({
          filename: a.filename,
          contentType: a.contentType,
          size: a.size
        }))

        const headersObj: Record<string, any> = {}
        for (const [k, v] of parsed.headerLines) headersObj[k] = v

        const info = insert.run(
          parsed.messageId || null,
          parsed.from?.value?.[0]?.address || 'unknown',
          JSON.stringify(toAddresses),
          JSON.stringify((parsed.cc?.value || []).map((v: any) => v.address || '')),
          JSON.stringify(bcc),
          parsed.subject || null,
          parsed.text || null,
          parsed.html || null,
          JSON.stringify(attachments),
          JSON.stringify(headersObj),
          parsed.headers.get('size') || null
        )

        if ((session as any)._conn_id) {
          db.prepare('UPDATE smtp_connections SET emails_received = emails_received + 1 WHERE id = ?').run(
            (session as any)._conn_id
          )
        }

        callback()
      } catch (err) {
        db.prepare(
          'INSERT INTO system_logs (level, component, message, details) VALUES (?, ?, ?, ? )'
        ).run('error', 'smtp', 'Parse/insert error', JSON.stringify({ err: String(err) }))
        callback(err as Error)
      }
    }
  })

  await new Promise<void>((resolve, reject) => {
    server.listen(port, (err?: any) => (err ? reject(err) : resolve()))
  })

  currentServer = server
  currentPort = port
  currentDb = db
  console.log(`[smtp] Serveur en écoute sur ${port}`)
}
