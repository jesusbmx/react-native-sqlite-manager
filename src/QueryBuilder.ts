import DB, { type QueryResult } from "./DB"

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
  private _cursorFactory?: (row: any) => any;

  constructor(db: DB, tableName: string) {
    this.db = db;
    this.tableName = tableName;
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

  cursorFactory(factory: (row: any) => any): this {
    this._cursorFactory = factory;
    return this;
  }

  /** 
   * SELECT
   * 
   * @returns array de registros
   */ 
  async get<V>(cursorFactory?: (row: any) => V): Promise<V[]> {
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

    const result = await this.db.rawQuery(sql, this._whereArgs);
    const rows: V[] = [];

    const factory: (row: any) => V =
        cursorFactory ?? this._cursorFactory ?? ((row: any) => row);

    for (let i = 0; i < result.rows.length; i++) {
      rows.push(factory(result.rows.item(i)));
    }

    return rows;
  }

  /** 
   * INSERT
   * 
   * @param {any} record { "Column 1": "foo", "Column 2": "bar" }
   * @returns insertId
   */
  async insert(record: any): Promise<number> {
    var sql = QueryBuilder.buildInsert(this.tableName, record)
    const args = Object.values(record)
    
    const result = await this.db.executeSql(sql, args);
    return result.insertId ?? -1;
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
  insertArray(fields: string[], data: any[][]): Promise<QueryResult> {
    const sql = QueryBuilder.buildInsertArray(
      this.tableName, fields, data)
    // crea una nueva matriz con todos los elementos de las submatrices 
    // concatenados recursivamente hasta la profundidad especificada
    const args: any[] = data.flat()
    return this.db.executeSql(sql, args)
  }

  /** 
   * UPDATE
   * 
   * @param {any} record { "Column 1": "foo", "Column 2": "bar" }
   * @returns rowsAffected
   */
  async update(record: any): Promise<number> {
    const sql = QueryBuilder.buildUpdate(
      this.tableName, record, this._whereClause)

    const args = Object.values(record)
    const whereArgs = this._whereArgs ?? []

    const result = await this.db.executeSql(sql, [...args, ...whereArgs])
    return result.rowsAffected;
  }

  /** 
   * DELETE
   * 
   * @returns rowsAffected
   */
  async delete(): Promise<number> {
    const sql = QueryBuilder.buildDelete(
      this.tableName, this._whereClause)

    const result = await this.db.executeSql(sql, this._whereArgs);
    return result.rowsAffected;
  }

  /**  
   * Creates the "SELECT" sql statement
   * 
   * @param {string} tableName
   * @param {QueryOptions} options
   * @returns string
   */
  static buildSelect(tableName: string, options: QueryOptions): string {
    const { columns = "*", where, order, limit, page } = options;
  
    const sqlParts = [
      'SELECT',
      columns,
      'FROM',
      tableName,
      where && where.clause ? `WHERE ${where.clause}` : '',
      order ? `ORDER BY ${order}` : '',
      limit ? `LIMIT ${limit}` : '',
      page && limit ? `OFFSET ${limit * (page - 1)}` : '',
    ];
  
    return sqlParts.filter(Boolean).join(' ');
  }  

  /** 
   * Creates the "INSERT" sql statement
   * 
   * @param {string} tableName
   * @param {any} record { "Column 1": "foo", "Column 2": "bar" }
   * @returns string
   */
  static buildInsert(tableName: string, record: any): string {
    const keys = Object.keys(record)
    const columns = keys.join(', ')
    const values = keys.map(() => '?').join(', ')

    return `INSERT INTO ${tableName} (${columns}) VALUES (${values});`
  }

  /** 
   * Creates the "INSERT" sql statement
   * 
   * @param {string} tableName
   * @param {string[]} fields ["Column 1", "Column 2"]
   * @param {any[][]} data [
   *  ["foo", "bar"],
   *  ["abc", "def"]
   * ]
   * @returns string
   */
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

  /** 
   * Creates the "Update" sql statement
   * 
   * @param {string} tableName
   * @param {any} record { "Column 1": "foo", "Column 2": "bar" }
   * @param {string} whereClause
   * @returns string
   */
  static buildUpdate(tableName: string, record: any, whereClause?: string): string {
    // Extrae el valor de "id" y crea un nuevo objeto sin ese dato
    //const { id, ...props } = object
    const values = Object.keys(record)
      .map(k => `${k} = ?`)
      .join(', ')

    const wherePart = whereClause && whereClause.trim().length > 0 
      ? ` WHERE ${whereClause}` : '';

    return `UPDATE ${tableName} SET ${values}${wherePart};`;
  }

  /**
   * Creates the "DELETE" sql statement
   * 
   * @param {string} tableName
   * @param {string} whereClause
   * @returns string
   */
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
    return `(${Array(array.length).fill('?').join(', ')})`;
  }
  
  /**
   * @param sqlString "valor con 'comillas'"
   * @returns "'valor con \'comillas\''"
   */
  static escapeSqlString(sqlString: string, escape = '\''): string {
    const escapedString = sqlString.replace(new RegExp(escape, 'g'), escape + escape);
    return escape + escapedString + escape;
  }  
}

export default QueryBuilder