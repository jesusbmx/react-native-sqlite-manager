import type Column from "./Column";
import DB from "./DB";

/**
 * Gestiona las propiedades de un tabla de Sqlite
 */
export default class TableInfo {

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
  
