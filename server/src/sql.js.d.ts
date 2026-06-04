declare module 'sql.js' {
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database
  }

  interface Database {
    run(sql: string, params?: unknown[]): Database
    exec(sql: string): QueryExecResult[]
    prepare(sql: string): Statement
    export(): Uint8Array
    close(): void
    getRowsModified(): number
  }

  interface Statement {
    bind(params?: unknown[]): boolean
    step(): boolean
    getAsObject(params?: unknown[]): Record<string, unknown>
    free(): boolean
  }

  interface QueryExecResult {
    columns: string[]
    values: unknown[][]
  }

  export default function initSqlJs(config?: object): Promise<SqlJsStatic>
  export type { SqlJsStatic, Database, Statement }
}
