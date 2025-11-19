// Déclarations minimales pour éviter les erreurs de compilation TypeScript

declare module 'sql.js' {
  export interface SqlJsStatement {
    bind(params: any[]): void
    step(): boolean
    getAsObject(): any
    free(): void
  }
  export interface SqlJsDatabase {
    exec(sql: string): any
    export(): Uint8Array
    prepare(sql: string): SqlJsStatement
  }
  // Fournir aussi un export nommé Database pour correspondre à l'import existant
  export class Database {
    constructor(data?: any)
    exec(sql: string): any
    export(): Uint8Array
    prepare(sql: string): SqlJsStatement
  }
  export interface SqlJsStatic {
    Database: typeof Database
  }
  export default function initSqlJs(opts?: any): Promise<SqlJsStatic>
}

declare module 'nodemailer' {
  export interface SendMailOptions {
    from?: string
    to?: string
    cc?: string
    subject?: string
    text?: string
    html?: string
    attachments?: any[]
    [k: string]: any
  }
  export interface SentMessageInfo {
    messageId?: string
    response?: string
    [k: string]: any
  }
  export interface Transporter<T = any> {
    sendMail(mail: SendMailOptions): Promise<SentMessageInfo>
  }
  const nodemailer: {
    createTransport(opts: any): Transporter
  }
  export default nodemailer
}

declare module 'smtp-server' {
  export class SMTPServer {
    constructor(options: any)
    listen(port: number, cb: (err?: any) => void): void
    close(cb: () => void): void
  }
}

declare module 'mailparser' {
  export function simpleParser(stream: any): Promise<any>
}

declare module 'express' {
  interface ExpressApp {
    use: (...args: any[]) => any
    get: (...args: any[]) => any
    post: (...args: any[]) => any
    put: (...args: any[]) => any
    listen: (port: number, cb?: (...args: any[]) => void) => any
  }
  function express(): ExpressApp
  namespace express {
    const json: (...args: any[]) => any
    const static: (...args: any[]) => any
  }
  export default express
}
