import DB, { type QueryResult } from "./DB"

// Clause Where
export type WhereClause = {
  clause?: string,  // Ej: "age > ? AND age < ?"
  args?: any[],     // Ej: [ 2, 10 ]
}

export type JoinClause = {
  table: string;      // Ej: "users"
  on: string;         // Ej: "users.id = orders.user_id"
  type?: "INNER" | "LEFT" | "RIGHT"; // Default: "INNER"
};

export type OrderBy = {
  column: string;       // Ej: "name"
  direction?: "ASC" | "DESC"  // Default: "ASC"
}

// Opciones para el QUERY
export type QueryOptions = {
  distinct?: boolean;           // SELECT DISTINCT
  columns?: string | string[];   // Ej: ["id", "name", "price"]
  joins?: JoinClause[];         // Soporte para múltiples joins
  where?: WhereClause;  
  groupBy?: string | string[];  // Ej: "category" o ["category", "status"]
  having?: WhereClause;         // Para filtros después de GROUP BY
  order?: OrderBy[];
  page?: number;
  limit?: number;
}

// Crea los querys
class QueryBuilder {
  public db: DB;
  public tableName: string;
  private _columns: string | string[] = "*";
  private _joins: JoinClause[] = [];
  private _where?: WhereClause;
  private _groupBy?: string | string[];
  private _having?: WhereClause;
  private _orderBy: OrderBy[] = [];
  private _limit?: number;
  private _page?: number;
  private _cursorFactory?: (row: any) => any;

  constructor(db: DB, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  select(columns: string | string[]): this {
    this._columns = columns;
    return this;
  }

  join(table: string, on: string, type: "INNER" | "LEFT" | "RIGHT" = "INNER"): this {
    this._joins.push({ table, on, type });
    return this;
  }
  
  where(clause: string, args?: any[]) {
    this._where = { clause, args }; 
    return this;
  }

  groupBy(group: string | string[]): this {
    this._groupBy = group;
    return this;
  }
  
  having(clause: string, args?: any[]) {
    this._having = { clause, args }; 
    return this;
  }

  orderBy(column: string, direction?: "ASC" | "DESC"): this {
    this._orderBy.push({ column, direction: direction?.toUpperCase() as "ASC" | "DESC" });
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
      joins: this._joins,
      where: this._where,
      groupBy: this._groupBy,
      having: this._having,
      order: this._orderBy,
      limit: this._limit,
      page: this._page,
    });

    const args = [...(this._where?.args || []), ...(this._having?.args || [])];
    const result = await this.db.rawQuery(sql, args);
    const factory: (row: any) => V = cursorFactory ?? this._cursorFactory ?? ((row: any) => row);
    return Array.from({ length: result.rows.length }, (_, i) => factory(result.rows.item(i)));
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
    const sql = QueryBuilder.buildUpdate(this.tableName, record, this._where?.clause);
    const args = [...Object.values(record), ...(this._where?.args || [])];
    const result = await this.db.executeSql(sql, args);
    return result.rowsAffected;
  }

  /** 
   * DELETE
   * 
   * @returns rowsAffected
   */
  async delete(): Promise<number> {
    const sql = QueryBuilder.buildDelete(this.tableName, this._where?.clause);
    const result = await this.db.executeSql(sql, this._where?.args);
    return result.rowsAffected;
  }

  /**  
   * Creates the "SELECT" sql statement
   * 
   * @param {string} tableName
   * @param {QueryOptions} options
   * @returns string
   */
  static buildSelect(table: string, opts: QueryOptions): string {
    const {
      distinct, columns = "*", joins = [], where, groupBy, having, order, limit, page,
    } = opts;

    const sql: string[] = [
      "SELECT", 
      distinct ? "DISTINCT" : "", 
      Array.isArray(columns) ? columns.join(", ") : columns,
      "FROM", table,
      ...joins.map(({ table, on, type = "INNER" }) => `${type} JOIN ${table} ON ${on}`),
      where?.clause ? `WHERE ${where.clause}` : "",
      groupBy ? `GROUP BY ${Array.isArray(groupBy) ? groupBy.join(", ") : groupBy}` : "",
      having?.clause ? `HAVING ${having.clause}` : "",
      order?.length ? `ORDER BY ${order.map(({ column, direction }) => `${column} ${direction ?? ""}`.trim()).join(", ")}` : "",
      limit ? `LIMIT ${limit}` : "",
      page && limit ? `OFFSET ${limit * (page - 1)}` : "",
    ];

    return sql.filter(Boolean).join(" ");
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
      throw new Error('keys is empty or undefined IN INSERT ARRAY')
    }
    if (data.length === 0) {
      throw new Error('data is empty or undefined IN INSERT ARRAY')
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
    if (!record || Object.keys(record).length === 0) {
      throw new Error("record is empty or undefined IN UPDATE");
    }
    
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