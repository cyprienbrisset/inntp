import 'dotenv/config'
import { ensureDatabase } from './database/db'
import { createWebApp } from './web/app'
import { startSmtpServer } from './smtp/server'

async function main() {
  const SMTP_PORT = parseInt(process.env.SMTP_PORT || '2525', 10)
  const WEB_PORT = parseInt(process.env.WEB_PORT || '3000', 10)

  const db = await ensureDatabase(process.env.DB_PATH || './data/relay.db')

  const app = createWebApp(db, { smtpPort: SMTP_PORT })
  app.listen(WEB_PORT, () => {
    console.log(`[web] HTTP API démarrée sur http://localhost:${WEB_PORT}`)
  })

  await startSmtpServer(db, SMTP_PORT)
}

main().catch((err) => {
  console.error('[fatal]', err)
  process.exit(1)
})
