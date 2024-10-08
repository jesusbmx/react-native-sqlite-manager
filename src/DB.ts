import SQLite from 'react-native-sqlite-storage';
import type ItMigration from "./ItMigration"
import QueryBuilder from "./QueryBuilder"

export type SqlRequest = {
  sql: string;
  args?: any[];
}

/**
 * Resultado de los querys
 */
export type QueryResult = {
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
  public sqlite?: SQLite.SQLiteDatabase | null

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
   * @returns {SQLite.SQLiteDatabase}
   */
  async open(): Promise<SQLite.SQLiteDatabase> {
    if (!this.sqlite) {
      //console.debug("DB.open", this.name)
      this.sqlite = await SQLite.openDatabase({ "name": this.name });
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
   * Ejecuta múltiples sentencias SQL en una transacción.
   * 
   * ```js
   * db.executeTransaction([
   *   { 
   *     sql: "INSERT INTO users (id, name) VALUES (?, ?)", 
   *     args: [1, "John"] 
   *   },
   *   {
   *     sql: "INSERT INTO users (id, name) VALUES (?, ?)",
   *     args: [2, "Jane"]
   *   },
   * ])
   * ```
   * 
   * @param {SqlRequest[]} requests sentencias
   * 
   * @returns {SQLite.ResultSet[]} resultados
   */
  async executeTransaction(...requests: SqlRequest[]): Promise<SQLite.ResultSet[]> {
    const db = await this.open(); // Asegurar que la base de datos está abierta.

    return new Promise<SQLite.ResultSet[]>((txResolve, txReject) => 
    {
      db.transaction((tx: SQLite.Transaction) => 
      {
        Promise.all(requests.map((request) => 
        {
          return new Promise<SQLite.ResultSet>((sqlResolve, sqlReject) => 
          {
            tx.executeSql(request.sql, request.args, 
              (_tx: any, result: SQLite.ResultSet) => { sqlResolve(result) },
              (error: any) => { sqlReject(error) }
            )
          })
        }))
        .then(txResolve)
        .catch(txReject)
      })
    })
  }

  /**
   * Ejecuta sentecias sql.
   * 
   * ```js
   * db.rawQuery("SELECT * FROM users WHERE id = ?", [1])
   * db.rawQuery("INSERT INTO users (id, name) VALUES (?, ?)", [1, "John"])
   * ```
   * 
   * @param {string} sql sentencia
   * @param {any[]} args parametros
   * 
   * @returns {SQLite.ResultSet} resultado
   */
  async rawQuery(
    sql: string, 
    args: any[] = []
  ): Promise<SQLite.ResultSet> {
    const results = await this.executeTransaction({ sql, args });
    const result = results[0];
    if (!result) {
      throw new Error('No result returned from transaction.');
    }
    return result;
  }

 /**
  * Ejecuta una sentencia SQL con los parámetros dados y devuelve el resultado.
  * 
  * ```js
  * db.executeSql("SELECT * FROM users WHERE id = ?", [1])
  * db.executeSql("INSERT INTO users (id, name) VALUES (?, ?)", [1, "John"])
  * ```
  * 
  * @param {string} sql La sentencia SQL a ejecutar.
  * @param {any[]} args Los parámetros para la sentencia SQL.
  * 
  * @returns {Promise<QueryResult>} El resultado de la consulta en forma de QueryResult.
  */
   async executeSql(
    sql: string, 
    args: any[] = []
  ): Promise<QueryResult> {
  
    const results = await this.executeTransaction({ sql, args });
    const result = results[0];

    if (!result) {
      throw new Error('No result returned from SQL execution.');
    }

    return {
      rows: result.rows.raw(), 
      insertId: result.insertId ?? null,
      rowsAffected: result.rowsAffected
    };
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
    await migration.beforeMigration(this, dbVersion, version);

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
    await migration.afterMigration(this, dbVersion, version);
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

