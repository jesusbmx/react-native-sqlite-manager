import type ItMigration from "./ItMigration"
import QueryBuilder from "./QueryBuilder"

//npm install --save-dev @types/react-native-sqlite-storage
const { openDatabase } = require('react-native-sqlite-storage');


export type SQLiteDatabase = {
  close(): () => void
  transaction: (tx: any) => void
}

export type Payload = {
  rows: {
    item(i: number): any;
    raw(): any[];
    length: number;
  },
  rowsAffected: number;
  insertId?: number;
}

/**
 * Resultado de los querys
 */
export type ResultSet = {
  insertId?: number;
  rowsAffected: number;
  rows: any[];
}

/**
 * Administra la base de datos.
 */
export default class DB {
  private static _instances = new Map<string, DB>();

  public name: string
  public sqlite?: SQLiteDatabase | null

  /**
   * @param {string} name nombre de la db
   */
  constructor(name: string) {
    this.name = name;
  }

  /**
   * Abre la base de datos
   * 
   * @param {string} name nombre de la db
   * @returns {DB} database
   */
  public static get(name: string): DB {
    var db = this._instances.get(name);
    if (!db) {
      db = new DB(name);
      this._instances.set(name, db);
    }
    return db;
  }

  /**
   * Abre la base de datos
   * 
   * @param {string} name nombre de la db
   * @returns {DB} database
   */
  public static async open(name: string): Promise<DB> {
    const db = DB.get(name);
    await db.open();
    return db;
  }

  /**
   * Abre la base de datos
   * @returns {SQLiteDatabase}
   */
  async open(): Promise<SQLiteDatabase> {
    if (!this.sqlite) {
      //console.debug("DB.open", this.name)
      this.sqlite = await openDatabase({ "name": this.name });
    }
    return this.sqlite!;
  }

  /**
   * Cierra la db
   */
  async close() {
    if (this.sqlite) {
      this.sqlite.close();
      this.sqlite = null;
    }
  }

  /**
   * Ejecuta sentecias sql.
   * 
   * @param {string[]} sql sentencias
   * @param {any[][]} params parametross
   * 
   * @returns {Payload[]} resultados
   */
  async executeBulkTransaction(
    sqls: string[], 
    params: any[][]
  ): Promise<Payload[]> {
    const db = await this.open(); // Asegurar que la base de datos está abierta.

    return new Promise<Payload[]>((txResolve, txReject) => {
      db.transaction((tx: any /*Transaction*/) => {

        Promise.all(sqls.map((sql, index) => {

          return new Promise<Payload>((sqlResolve, sqlReject) => {
            tx.executeSql(sql, params[index], 
              (_tx: any, result: Payload) => { sqlResolve(result) },
              (error: any) => { sqlReject(error) }
            )
          }) // Singel Promise 

        })).then(txResolve).catch(txReject) // Promise all
      }) // transaction
    }) // Promise transaction
  }

  /**
   * Ejecuta sentecias sql.
   * 
   * @param {string} sql sentencia
   * @param {any[]} params parametros
   * 
   * @returns {Payload} resultado
   */
  async executeTransaction(
    sql: string, 
    params: any[] = []
  ): Promise<Payload> {
    return this.executeBulkTransaction([sql], [params])
      .then(res => res[0] as Payload)
      .catch(error => { throw error })
  }


  /**
   * Ejecuta sentecias sql.
   * 
   * @param {string[]} sql sentencias
   * @param {any[][]} params parametross
   * 
   * @returns {ResultSet[]} resultados
   */
  async executeBulkSql(
    sqls: string[], 
    params: any[][]
  ): Promise<ResultSet[]> {
    const db = await this.open(); // Asegurar que la base de datos está abierta.

    return new Promise<ResultSet[]>((txResolve, txReject) => {
      db.transaction((tx: any /*Transaction*/) => {

        Promise.all(sqls.map((sql, index) => {

          return new Promise<ResultSet>((sqlResolve, sqlReject) => {
            tx.executeSql(sql, params[index], 
              (_tx: any, result: Payload) => {
                sqlResolve({ 
                  rows: result.rows.raw(), 
                  insertId: result.insertId,
                  rowsAffected: result.rowsAffected
                })
              },
              (error: any) => { sqlReject(error) }
            )
          }) // Singel Promise 

        })).then(txResolve).catch(txReject) // Promise all
      }) // transaction
    }) // Promise transaction
  }

  /**
   * Ejecuta sentecias sql.
   * 
   * @param {string} sql sentencia
   * @param {any[]} params parametros
   * 
   * @returns {ResultSet} resultado
   */
   async executeSql(
    sql: string, 
    params: any[] = []
  ): Promise<ResultSet> {
    return this.executeBulkSql([sql], [params])
      .then(res => res[0] as ResultSet)
      .catch(error => { throw error })
  }

  /**
   * Obtiene el numero de version de la db
   */
  async getVersion(): Promise<number> {
    const { rows } = await this.executeSql("PRAGMA user_version");
    const row = rows[0];
    return row.user_version ?? 0;
  }

  /**
   * Establece la versión de la base de datos.
   * @param {int} version la nueva versión de la base de datos
   */
  async setVersion(version: number) {
    await this.executeSql("PRAGMA user_version = " + version)
  }

  /**
   * Inicializa el scheme de la base de datos.
   */
  async migrate(migration: ItMigration, version: number) {
    //console.debug("DB.migrate");
    await this.open()

    // Obtiene la version actual de la db
    const dbVersion: number = await this.getVersion();

    // Valida la version actual con la version del archivo
    if (dbVersion == 0) {
      await migration.onCreate(this);
      await migration.onPostCreate(this);

    } else if (dbVersion != version) {
      await migration.onUpdate(this, dbVersion, version);
      await migration.onPostUpdate(this, dbVersion, version);
    }

    // Setea la nueva version en la base de datos
    await this.setVersion(version);
  }

  /**
   * Obtiene un QueryBuilder
   * 
   * @param tableName nombre de la tabla 
   * @returns 
   */
  table(tableName: string): QueryBuilder {
    return new QueryBuilder(this, tableName)
  }
}

