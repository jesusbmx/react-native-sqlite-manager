import type { ResultSet } from "./DB"
import type DB from "./DB"

// Opciones para el QUERY
export type QueryOptions = {
  columns?: string
  page?: number
  limit?: number
  where?: Where,
  order?: string
}

// Clause Where
export type Where = {
  clause: string,
  args?: any[],
}

// Crea los querys
class QueryBuilder {

  public db: DB;
  public tableName: string;
  private _columns: string = '*';
  private _whereClause: string = '';
  private _whereArgs: any[] = [];
  private _orderBy: string = '';
  private _limit: number | undefined = undefined;
  private _page: number | undefined = undefined;

  constructor(db: DB, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  // SELECT
  static query(
    tableName: string, 
    options: QueryOptions
  ): string {

    let sqlParts: any[] = [
      'SELECT',
      options.columns ?? "*",
      'FROM',
      tableName,
    ]

    if (options.where) {
      sqlParts.push("WHERE")
      sqlParts.push(options.where.clause)
    }
    
    if (options.order) {
      sqlParts.push("ORDER BY")
      sqlParts.push(options.order)
    }

    if (options.limit) {
      sqlParts.push("LIMIT")
      sqlParts.push(options.limit)

      if (options.page) {
        sqlParts.push("OFFSET")
        sqlParts.push(options.limit * (options.page - 1))
      }
    }

    return sqlParts.filter(p => p !== '').join(' ')
  }

  // Creates the "INSERT" sql statement
  static create(tableName: string, object: any): string {
    const keys = Object.keys(object)
    const columns = keys.join(', ')
    const values = keys.map(() => '?').join(', ')

    return `INSERT INTO ${tableName} (${columns}) VALUES (${values});`
  }

  // Creates the "INSERT" sql statement
  static createArray(tableName: string, array: any[]): string {
    if (array.length === 0) {
      throw new Error('array is empty')
    }
  
    const keys = Object.keys(array[0]);
    const columns = keys.join(', ');
  
    //const values = objects.map(() => `(${keys.map(() => '?').join(', ')})`).join(', ');
    const values = array.map(() => {
      const placeholders = keys.map(() => '?').join(', ');
      return `(${placeholders})`;
    }).join(', ');
  
    return `INSERT INTO ${tableName} (${columns}) VALUES ${values};`;
  }

  // Creates the "Update" sql statement
  static update(tableName: string, object: any, whereClause: string): string {
    // Extrae el valor de "id" y crea un nuevo objeto sin ese dato
    //const { id, ...props } = object
    const values = Object.keys(object)
      .map(k => `${k} = ?`)
      .join(', ')

    return `UPDATE ${tableName} SET ${values} WHERE ${whereClause};`
  }

  // Creates the "DELETE" sql statement
  static destroy(tableName: string, whereClause: string): string {
    return `DELETE FROM ${tableName} WHERE ${whereClause};`
  }
  
  // Creates the "DELETE ALL" sql statement
  static destroyAll(tableName: string): string {
    return `DELETE FROM ${tableName};`
  }
  
  /**
   * Compila una clausula where
   * 
   * @param {any[]} array [1,3,4,2]
   * @returns (?, ?, ?, ?)
   */
  static whereClausePlaceholders(array: any[]): string {
    var args: string[] = [];
    for (let i = 0; i < array.length; i++) {
      args.push("?");
    }
    return "(" + args.join(", ") + ")";
  }
  
  /**
   * @param sqlString "valor con 'comillas'"
   * @returns "'valor con \'comillas\''"
   */
  static escapeSqlString(sqlString: string, escape = '\''): string {
    var sb: any[] = []
    sb.push(escape);

    if (sqlString.indexOf(escape) != -1) {
      var length: number = sqlString.length;
      for (var i = 0; i < length; i++) {
          var c: string = sqlString.charAt(i);
          if (c == escape) {
            sb.push(escape);
          }
          sb.push(c);
      }
    } else {
      sb.push(sqlString);
    }

    sb.push(escape);
    return sb.join("")
  }

  select(columns: string): this {
    this._columns = columns;
    return this;
  }

  where(clause: string, args: any[]): this {
    this._whereClause = clause;
    this._whereArgs = args;
    return this;
  }

  orderBy(orderBy: string): this {
    this._orderBy = orderBy;
    return this;
  }

  limit(limit: number): this {
    this._limit = limit;
    return this;
  }

  page(page: number): this {
    this._page = page;
    return this;
  }

  /** 
   * SELECT
   * 
   * @returns array de registros
   */ 
  get(): Promise<any[]> {
    const sql = QueryBuilder.query(this.tableName, {
      columns: this._columns,
      where: {
        clause: this._whereClause,
        args: this._whereArgs,
      },
      order: this._orderBy,
      limit: this._limit,
      page: this._page,
    });

    return this.db.executeSql(sql, this._whereArgs)
      .then((result: ResultSet) => result.rows)
  }

  /** 
   * INSERT
   * 
   * @param {any} values
   * @returns insertId
   */
  insert(values: any): Promise<number> {
    var sql = QueryBuilder.create(this.tableName, values)
    const params = Object.values(values)
    
    return this.db.executeSql(sql, params)
      .then(result => result.insertId ?? -1)
  }

  /** 
   * INSERT
   * 
   * @param {any[]} array
   * @returns result
   */
  insertArray(array: any[]): Promise<ResultSet> {
    const sql = QueryBuilder.createArray(this.tableName, array)
    const params: any[] = []

    array.forEach(obj => {
      const values: any[] = Object.values(obj)
      values.forEach(val => {
        params.push(val)
      })
    })

    return this.db.executeSql(sql, params)
  }

  /** 
   * UPDATE
   * 
   * @param {any} values
   * @returns rowsAffected
   */
  update(values: any): Promise<number> {
    const sql = QueryBuilder.update(
      this.tableName, values, this._whereClause)

    const params = Object.values(values)
    const whereArgs = this._whereArgs ?? []

    return this.db.executeSql(sql, [...params, ...whereArgs])
      .then(result => result.rowsAffected)
  }

  /** 
   * DELETE
   * 
   * @returns rowsAffected
   */
  delete(): Promise<number> {
    const sql = QueryBuilder.destroy(
      this.tableName, this._whereClause)

    return this.db.executeSql(sql, this._whereArgs)
      .then(result => result.rowsAffected)
  }
}

export default QueryBuilder