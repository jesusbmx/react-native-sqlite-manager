import DB, { type ResultSet } from "./DB"

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
  clause?: string,
  args?: any[],
}

// Crea los querys
class QueryBuilder {

  public db: DB;
  public tableName: string;
  private _columns: string = '*';
  private _whereClause: string | undefined = undefined;
  private _whereArgs: any[] | undefined = undefined;
  private _orderBy: string | undefined = undefined;
  private _limit: number | undefined = undefined;
  private _page: number | undefined = undefined;

  constructor(db: DB, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  // SELECT
  static buildSelect(
    tableName: string, 
    options: QueryOptions
  ): string {

    const { where } = options

    let sqlParts: any[] = [
      'SELECT',
      options.columns ?? "*",
      'FROM',
      tableName,
    ]

    if (where && where.clause) {
      sqlParts.push("WHERE")
      sqlParts.push(where.clause)
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
  static buildInsert(tableName: string, object: any): string {
    const keys = Object.keys(object)
    const columns = keys.join(', ')
    const values = keys.map(() => '?').join(', ')

    return `INSERT INTO ${tableName} (${columns}) VALUES (${values});`
  }

  // Creates the "INSERT" sql statement
  static buildInsertArray(tableName: string, keys: string[], data: any[][]): string {
    if (keys.length === 0) {
      throw new Error('fields is empty')
    }
    if (data.length === 0) {
      throw new Error('data is empty')
    }
  
    const columns = keys.join(', ');
    const values = keys.map(() => '?').join(', ')
    const valuesArray = data.map(() => `(${values})`).join(', ');
  
    return `INSERT INTO ${tableName} (${columns}) VALUES ${valuesArray};`;
  }

  // Creates the "Update" sql statement
  static buildUpdate(tableName: string, object: any, whereClause?: string): string {
    // Extrae el valor de "id" y crea un nuevo objeto sin ese dato
    //const { id, ...props } = object
    const values = Object.keys(object)
      .map(k => `${k} = ?`)
      .join(', ')

    const wherePart = whereClause && whereClause.trim().length > 0 
      ? ` WHERE ${whereClause}` : '';

    return `UPDATE ${tableName} SET ${values}${wherePart};`;
  }

  // Creates the "DELETE" sql statement
  static buildDelete(tableName: string, whereClause?: string): string {
    const wherePart = whereClause && whereClause.trim().length > 0 
      ? ` WHERE ${whereClause}` : '';

    return `DELETE FROM ${tableName}${wherePart};`
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
    const sql = QueryBuilder.buildSelect(this.tableName, {
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
    var sql = QueryBuilder.buildInsert(this.tableName, values)
    const params = Object.values(values)
    
    return this.db.executeSql(sql, params)
      .then(result => result.insertId ?? -1)
  }

  /** 
   * INSERT
   * 
   * @param {string[]} fields ["Column 1", "Column 2"]
   * @param {any[][]} data [
   *  ["foo", "bar"],
   *  ["abc", "def"]
   * ]
   * @returns result
   */
  insertArray(fields: string[], data: any[][]): Promise<ResultSet> {
    const sql = QueryBuilder.buildInsertArray(
      this.tableName, fields, data)
    // crea una nueva matriz con todos los elementos de las submatrices 
    // concatenados recursivamente hasta la profundidad especificada
    const params: any[] = data.flat()
    return this.db.executeSql(sql, params)
  }

  /** 
   * UPDATE
   * 
   * @param {any} values
   * @returns rowsAffected
   */
  update(values: any): Promise<number> {
    const sql = QueryBuilder.buildUpdate(
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
    const sql = QueryBuilder.buildDelete(
      this.tableName, this._whereClause)

    return this.db.executeSql(sql, this._whereArgs)
      .then(result => result.rowsAffected)
  }
}

export default QueryBuilder