import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js'
import { createSchema } from './schema'
import fs from 'node:fs'
import path from 'node:path'

// Interface d'adaptation (mimique better-sqlite3)
export type RunResult = { changes?: number; lastInsertRowid?: number }
export type Statement = {
  run: (...params: any[]) => RunResult
  get: (...params: any[]) => any
  all: (...params: any[]) => any[]
}
export type DB = {
  prepare: (sql: string) => Statement
  exec: (sql: string) => void
  pragma: (sql: string) => any
  transaction: <T>(fn: (args: T) => void) => (args: T) => void
}

class SqlJsAdapter implements DB {
  private sql: SqlJsStatic
  private db: SqlJsDatabase
  private filePath: string

  constructor(sql: SqlJsStatic, db: SqlJsDatabase, filePath: string) {
    this.sql = sql
    this.db = db
    this.filePath = filePath
  }

  private persist() {
    const data = this.db.export()
    const buf = Buffer.from(data)
    // s'assurer que le dossier existe
    const dir = this.filePath.endsWith('.db') ? path.dirname(this.filePath) : this.filePath
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(this.filePath, buf)
  }

  prepare(sql: string): Statement {
    const db = this.db
    const persist = this.persist.bind(this)
    return {
      run: (...params: any[]) => {
        const stmt = db.prepare(sql)
        try {
          stmt.bind(params)
          // Pour run, exécuter sans récupérer de lignes
          while (stmt.step()) {
            // vider toutes les lignes produites (si UPDATE/INSERT pas de lignes)
          }
        } finally {
          stmt.free()
        }
        // sql.js ne fournit pas changes/rowid facilement; tenter via last_insert_rowid()
        let lastId: number | undefined
        try {
          const r = db.exec('SELECT last_insert_rowid() as id')
          if (r && r[0] && r[0].values && r[0].values[0]) lastId = Number(r[0].values[0][0])
        } catch {}
        // changes() non disponible directement; laisser undefined
        persist()
        return { lastInsertRowid: lastId }
      },
      get: (...params: any[]) => {
        const stmt = db.prepare(sql)
        try {
          stmt.bind(params)
          if (stmt.step()) {
            return stmt.getAsObject()
          }
          return undefined
        } finally {
          stmt.free()
        }
      },
      all: (...params: any[]) => {
        const stmt = db.prepare(sql)
        const rows: any[] = []
        try {
          stmt.bind(params)
          while (stmt.step()) {
            rows.push(stmt.getAsObject())
          }
        } finally {
          stmt.free()
        }
        return rows
      }
    }
  }

  exec(sql: string) {
    this.db.exec(sql)
    this.persist()
  }

  pragma(sql: string) {
    // Accept both forms: "PRAGMA x=y" and "x=y" (or "x")
    const input = sql.trim()
    const stmt = /^PRAGMA\b/i.test(input) ? input : `PRAGMA ${input}`
    // Detect setter vs getter
    if (/^PRAGMA\s+[^;=]+\s*=/.test(stmt)) {
      // Set pragma
      this.db.exec(stmt)
      this.persist()
      return undefined
    } else {
      const res = this.db.exec(stmt)
      if (!res || !res[0]) return undefined
      const cols = res[0].columns as any[]
      const vals = res[0].values as any[][]
      const obj: any = {}
      cols.forEach((c: any, i: any) => (obj[c] = vals[0][i]))
      return obj
    }
  }

  transaction<T>(fn: (args: T) => void) {
    return (args: T) => {
      try {
        this.db.exec('BEGIN')
        fn(args)
        this.db.exec('COMMIT')
        this.persist()
      } catch (e) {
        try { this.db.exec('ROLLBACK') } catch {}
        throw e
      }
    }
  }
}

export async function ensureDatabase(dbPath: string): Promise<DB> {
  // Localiser le fichier WASM de sql.js pour un environnement Node
  const wasmFile = require.resolve('sql.js/dist/sql-wasm.wasm')
  const wasmDir = path.dirname(wasmFile)
  const SQL = await initSqlJs({ locateFile: (file: string) => path.join(wasmDir, file) })
  let db: SqlJsDatabase
  // charger si fichier existe
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath)
    db = new SQL.Database(new Uint8Array(buf))
  } else {
    db = new SQL.Database()
  }
  const adapter = new SqlJsAdapter(SQL, db, dbPath)
  // PRAGMA compatibles
  try { adapter.pragma('PRAGMA foreign_keys = ON') } catch {}
  createSchema(adapter)
  return adapter
}
