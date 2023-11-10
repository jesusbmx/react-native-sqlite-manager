import type { ItScheme } from "./ItScheme"
import QueryBuilder from "./QueryBuilder"

const { openDatabase } = require('react-native-sqlite-storage')

//SQLite.DEBUG(config.app.isDebug)

export type SQLiteDatabase = {
  close(): () => void
  transaction: (tx: any) => void
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
   * @param {string} sql sentencia
   * @param {any[]} params parametros
   * 
   * @returns {ResultSet} resultado
   */
  executeSql(
    sql: string, 
    params: any[] = []
  ): Promise<ResultSet> {

    return new Promise((txResolve, txReject) => {
      this.sqlite?.transaction((tx: any /*Transaction*/) => {

        new Promise<ResultSet>((sqlResolve, sqlReject) => {
          tx.executeSql(sql, params,
            (_tx: any, result: any) => {
              sqlResolve({ 
                rows: result.rows.raw(), 
                insertId: result.insertId,
                rowsAffected: result.rowsAffected
              })
            },
            (error: any) => { sqlReject(error) }
          )
        }).then(txResolve).catch(txReject)
        
      });
    });
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

    return new Promise((txResolve, txReject) => {
      this.sqlite?.transaction((tx: any /*Transaction*/) => {

        Promise.all(sqls.map((sql, index) => {

          return new Promise<ResultSet>((sqlResolve, sqlReject) => {
            tx.executeSql(sql, params[index],
              (_tx: any, result: any) => {
                sqlResolve({ 
                  rows: result.rows.raw(), 
                  insertId: result.insertId,
                  rowsAffected: result.rowsAffected
                })
              },
              (error: any) => { sqlReject(error) }
            )
          })

        })).then(txResolve).catch(txReject)
      })
    })
  }

  /**
   * Obtiene el numero de version de la db
   */
  getVersion(): Promise<number> {
    return this.executeSql("PRAGMA user_version")
      .then(({rows}) => rows[0])
      .then((row) => row.user_version ?? 0);
  }

  /**
   * Establece la versión de la base de datos.
   * @param {int} version la nueva versión de la base de datos
   */
  setVersion(version: number) {
    return this.executeSql("PRAGMA user_version = " + version)
      .then(({rows}) => rows[0]);
  }

  /**
   * Inicializa el scheme de la base de datos.
   */
  async init(scheme: ItScheme, version: number) {
    console.debug("DB.init");
    await this.open()

    // Obtiene la version actual de la db
    const dbVersion: number = await this.getVersion();

    // Valida la version actual con la version del archivo
    if (dbVersion == 0) {
      await scheme.onCreate(this);

    } else if (dbVersion != version) {
      await scheme.onUpdate(this, dbVersion, version);
    }

    // Setea la nueva version en la base de datos
    this.setVersion(version);

    scheme.onLoad(this)
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

