import nodemailer from 'nodemailer'
import type { DB } from '../database/db'
import { acquireAzureAccessToken, invalidateAzureTokenCache } from '../auth/azure'

type SendResult = { ok: boolean; messageId?: string; response?: string }

function getCfg(db: DB): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM config').all() as { key: string; value: string }[]
  const cfg: Record<string, string> = {}
  for (const r of rows) cfg[r.key] = r.value
  return cfg
}

export async function sendEmailViaO365(db: DB, emailId: number): Promise<SendResult> {
  const email = db.prepare('SELECT * FROM emails WHERE id = ?').get(emailId) as any
  if (!email) {
    throw new Error('email_not_found')
  }
  if (email.status === 'sent') {
    return { ok: true, messageId: email.o365_message_id }
  }

  const cfg = { ...getCfg(db),
    AZURE_TENANT_ID: process.env.AZURE_TENANT_ID || '',
    AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID || '',
    AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET || '',
    O365_USER_EMAIL: process.env.O365_USER_EMAIL || ''
  }
  const user = cfg.O365_USER_EMAIL
  if (!user) throw new Error('missing_O365_USER_EMAIL')

  // Marquer comme sending + incrément retry
  db.prepare('UPDATE emails SET status = ?, retry_count = retry_count + 1, last_error = NULL WHERE id = ?').run(
    'sending', emailId
  )

  async function attemptSend(useFreshToken: boolean) {
    if (useFreshToken) invalidateAzureTokenCache()
    const token = await acquireAzureAccessToken(cfg)
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        type: 'OAuth2',
        user,
        accessToken: token.accessToken
      }
    } as any)

    const toList: string[] = JSON.parse(email.to_addresses || '[]')
    const ccList: string[] = JSON.parse(email.cc_addresses || '[]')

    const info = await transporter.sendMail({
      from: email.from_address || user,
      to: toList.filter(Boolean).join(','),
      cc: (ccList || []).filter(Boolean).join(',') || undefined,
      subject: email.subject || '',
      text: email.body_text || undefined,
      html: email.body_html || undefined
      // Pièces jointes non envoyées pour l’instant (FR-07 partiel)
    })

    db.prepare(
      'UPDATE emails SET status = ?, sent_at = CURRENT_TIMESTAMP, o365_message_id = ? WHERE id = ?'
    ).run('sent', info.messageId || null, emailId)

    db.prepare('INSERT INTO system_logs (level, component, message, details) VALUES (?, ?, ?, ?)').run(
      'info', 'send', 'Email envoyé via O365', JSON.stringify({ emailId, messageId: info.messageId || null })
    )

    return { ok: true, messageId: info.messageId, response: info.response }
  }

  try {
    return await attemptSend(false)
  } catch (e: any) {
    const msg = e && e.message ? e.message : String(e)
    // Détection simple des erreurs d'authentification: codes SMTP 5.7.3/535, invalid_grant, Bearer
    const authErr = /5\.7\.3|535|invalid_grant|Authentication unsuccessful|Bearer/i.test(msg)
    if (authErr) {
      // Journaliser tentative de renouvellement et retry
      db.prepare('INSERT INTO system_logs (level, component, message, details) VALUES (?, ?, ?, ?)').run(
        'warn', 'send', 'Auth O365 échouée, renouvellement token et retry', JSON.stringify({ emailId, error: msg })
      )
      try {
        const res = await attemptSend(true)
        return res
      } catch (e2: any) {
        const msg2 = e2 && e2.message ? e2.message : String(e2)
        db.prepare('UPDATE emails SET status = ?, last_error = ? WHERE id = ?').run('failed', msg2, emailId)
        db.prepare('INSERT INTO system_logs (level, component, message, details) VALUES (?, ?, ?, ?)').run(
          'error', 'send', 'Echec envoi O365 (après retry)', JSON.stringify({ emailId, error: msg2 })
        )
        throw e2
      }
    }
    // autre erreur: marquer failed et relayer
    db.prepare('UPDATE emails SET status = ?, last_error = ? WHERE id = ?').run('failed', msg, emailId)
    db.prepare('INSERT INTO system_logs (level, component, message, details) VALUES (?, ?, ?, ?)').run(
      'error', 'send', 'Echec envoi O365', JSON.stringify({ emailId, error: msg })
    )
    throw e
  }
}
