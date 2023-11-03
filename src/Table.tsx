import DB from "./DB";
import QueryBuilder from "./QueryBuilder";

/**
 * Gestiona las propiedades de un tabla de Sqlite
 */
export default class Table {

  public db: DB;
  public name: string

  constructor(db: DB, name: string) {
    this.db = db;
    this.name = name
  }

  /**
   * ```
   *  cid 	name      type 	  notnull 	dflt_value 	  pk
   *    0   id      integer 	      0 	      null 	    1
   *    1   type       text 	      0 	      null 	    0
   *    2   data       json 	      0 	      null 	    0
   * ```
   * 
   * @param name nombre de la tabla
   * @returns 
   */
  info(): Promise<any[]> {
    return this.db.executeSql(`PRAGMA table_info(${this.name})`)
    .then(({rows}) => rows);
  }

  /**
   * Agrega las columnas que no existen
   * @param db 
   * @param columns 
   * @returns 
   */
  async addColumns(columns: Column[]): Promise<Column[]> {
    const currentColumns = await this.info()
    
    return await columns.filter(async (columnOptions: Column) => {
      for (let i = 0; i < currentColumns.length; i++) {
        const currentColumn = currentColumns[i];
        if (columnOptions.name == currentColumn.name) {
          return false; // ya existe la columna en la tabla
        }
      }

      const sqlColumn = columnOptions.compile()
      const sql = `ALTER TABLE ${this.name} ADD COLUMN ${sqlColumn};`
      console.debug(sql)
      await this.db.executeSql(sql)

      return true; // no existia la columna en la tabla
    });
  }
}
  

/**
  * id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL DEFAUL '' +
  */
export class Column {
  public name: string
  public type: string
  private _primaryKey: boolean = false
  private _autoIncrement: boolean = false
  private _nullable: boolean = false
  private _defaultVal?: string

  constructor(name: string, type: string) {
    this.name = name
    this.type = type;
  }

  primaryKey(): Column {
    this._primaryKey = true
    return this
  }

  autoIncrement(): Column {
    this._autoIncrement = true
    return this
  }

  defaultVal(defaultVal: string): Column {
    this._defaultVal = defaultVal
    return this
  }

  nullable(): Column {
    this._nullable = true
    return this
  }

  compile(): string {
    var sql: any[] = []
    // column-def:
    sql.push(this.name)
    sql.push(" ")
    sql.push(this.type)
    // column-constraint:
    if (this._primaryKey) sql.push(" PRIMARY KEY")
    if (this._autoIncrement) sql.push(" AUTOINCREMENT")

    sql.push((this._nullable) ? " NULL" : " NOT NULL")
    if (this._defaultVal != null) {
      sql.push(" DEFAULT ")
      sql.push(QueryBuilder.escapeSqlString(this._defaultVal))
    }
    return sql.join("")
  }
}
  
  
