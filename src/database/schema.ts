import type { DB } from './db'

export function createSchema(db: DB) {
  const pragma = db.prepare("PRAGMA user_version").get() as unknown as { user_version: number }
  const version = (pragma && (pragma as any).user_version) || 0

  if (version === 0) {
    const ddl = `
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT UNIQUE,
      from_address TEXT NOT NULL,
      to_addresses TEXT NOT NULL,
      cc_addresses TEXT,
      bcc_addresses TEXT,
      subject TEXT,
      body_text TEXT,
      body_html TEXT,
      attachments TEXT,
      headers TEXT,
      size_bytes INTEGER,
      received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'received',
      retry_count INTEGER DEFAULT 0,
      last_error TEXT,
      sent_at DATETIME,
      o365_message_id TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at);
    CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
    CREATE INDEX IF NOT EXISTS idx_emails_from ON emails(from_address);

    CREATE TABLE IF NOT EXISTS smtp_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      remote_ip TEXT NOT NULL,
      connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      disconnected_at DATETIME,
      emails_received INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_smtp_connections_date ON smtp_connections(connected_at);

    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      component TEXT NOT NULL,
      message TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_system_logs_date ON system_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);

    CREATE TABLE IF NOT EXISTS daily_metrics (
      date DATE PRIMARY KEY,
      emails_received INTEGER DEFAULT 0,
      emails_sent INTEGER DEFAULT 0,
      emails_failed INTEGER DEFAULT 0,
      total_size_bytes INTEGER DEFAULT 0,
      avg_latency_ms INTEGER DEFAULT 0
    );
    `
    db.exec(ddl)
    db.pragma('user_version = 1')
  }
}
