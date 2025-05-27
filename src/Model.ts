import SQLite from 'react-native-sqlite-storage';
import DB, { type QueryResult } from './DB';
import QueryBuilder, { type QueryOptions } from './QueryBuilder';

// Representa un modelos de base de datos
export default class Model {

  static get databaseName(): string {
    throw new Error('databaseName not defined')
  }

  static get tableName(): string {
    throw new Error('tableName not defined')
  }

  static get primaryKey(): string {
    return "id";
  }

  constructor(props: any = {}) {
    // Copiar las propiedades al objeto actual (this)
    Object.assign(this, props);
  }

  //constructor(public id: number, public name: string) {}

  // Función que convierte valores de la base de datos a propiedades de la entidad
  static databaseToModel(databaseValues: any): Model {
    return new (this as any)(databaseValues);
  }

  // Función que convierte un modelo a valores que pueden ser insertados en la base de datos
  static modelToDatabase(props: any): any {
    return Object.assign({}, props);
  }

  /**
   * ```js
   * Animal.executeSql("SELECT * FROM tb_animal WHERE id = ?", [7])
   * ```
   * @return {QueryResult} result
   */
  static executeSql(
    sql: string, 
    args: any[] = []
  ): Promise<QueryResult> {
    const db = DB.get(this.databaseName);
    return db.executeSql(sql, args);
  }

  static rawQuery(
    sql: string, 
    args: any[] = []
  ): Promise<SQLite.ResultSet> {
    const db = DB.get(this.databaseName);
    return db.rawQuery(sql, args);
  }

  /**
   * ```js
   * Animal.findBy<Animal>("color", "LIKE", '%Brown%')
   * ```
   * @param column mombre de la columna
   * @param op operador: =, <>, <, <=, >, >=, LIKE
   * @param value qriterio de busqueda
   * @return registro
   */
  static async findBy<T extends Model>(
    column: string, op: string, value: any
  ): Promise<T | undefined> {
    
    const sql = `
      SELECT * FROM ${this.tableName} WHERE ${column} ${op} ?
    `
    const { rows } = await this.executeSql(sql, [value]);
    return rows.length ? this.databaseToModel(rows[0]) as T : undefined;
  }

  /**
   * ```js
   * Animal.find(1)
   * ```
   * @param id identificador del registro
   * @return registro
   */
  static find<T extends Model>(
    id: any
  ): Promise<T | undefined> {
    return this.findBy<T>(this.primaryKey, "=", id)
  }
  
  /**
   * ```js
   * Animal.first()
   * ```
   * @return primer registro
   */
  static async first<T extends Model>(): Promise<T | null> {
    const sql = `
      SELECT * FROM ${this.tableName} ORDER BY ROWID ASC LIMIT 1
    `
    const { rows } = await this.executeSql(sql);
    return rows.length ? this.databaseToModel(rows[0]) as T : null;
  }

  /**
   * ```js
   * Animal.last()
   * ```
   * @return último registro
   */
  static async last<T extends Model>(): Promise<T | null> {
    const sql = `
      SELECT * FROM ${this.tableName} ORDER BY ROWID DESC LIMIT 1
    `
    const { rows } = await this.executeSql(sql);
    return rows.length ? this.databaseToModel(rows[0]) as T : null;
  }
    
  /**
   * ```js
   * Animal.count()
   * ```
   * @return numero de registros
   */
  static async count(): Promise<number> {
    const sql = `
      SELECT COUNT(*) AS __count__ FROM ${this.tableName}
    `
    const result = await this.executeSql(sql);
    const row = result.rows[0];
    return row["__count__"];
  }

  /**
   * ```js
   * Animal.all()
   * ```
   * @return array con todos los registros
   */
  static async all<T extends Model>(): Promise<T[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
    `
    const result = await this.rawQuery(sql);
    const list: T[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      list.push(this.databaseToModel(row) as T);
    }
    return list;
  }
  

  /**
   * ```js
   * Animal.select({
   *   columns: 'id, name',
   *   where: {
   *     clause: 'age > ? AND age < ?',
   *     args: [ 2, 10 ],
   *   },
   *   page: 2,
   *   limit: 30,
   *   order: 'name ASC'
   * })
   * ```
   * @param {QueryOptions} options
   * @returns array de registros
   */
  static async select<T extends Model>(
    optionsOrSql: QueryOptions | string = {},
    args: any[] = []
  ): Promise<T[]> {
    let sql: string;
    let queryArgs: any[];
  
    if (typeof optionsOrSql === 'string') {
      // Caso: uso manual del query SQL
      sql = optionsOrSql;
      queryArgs = args;
    } else {
      // Caso: uso del objeto QueryOptions
      sql = QueryBuilder.buildSelect(this.tableName, optionsOrSql);
      queryArgs = optionsOrSql.where?.args || [];
    }
  
    const result = await this.rawQuery(sql, queryArgs);
    const list: T[] = [];
  
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      list.push(this.databaseToModel(row) as T);
    }
  
    return list;
  }  

  /**
   * ```js
   * const results = await Animal.query()
   *    .select('id, name')
   *    .where('age > ? AND age < ?', [2, 10])
   *    .orderBy('name ASC')
   *    .page(2)
   *    .limit(30)
   *    .get<Animal>();
   * ```
   * @returns 
   */
  static query(): QueryBuilder {
    const db = DB.get(this.databaseName);
    return db.table(this.tableName)
      .cursorFactory((row: any) => this.databaseToModel(row));
  }

  /**
   * ```js
   * Animal.create({
   *   age: 10,
   *   color: '%Brown%',
   * })
   * ```
   * @param record
   * @returns registro creado
   */
  static async create<T extends Model>(
    record: any
  ): Promise<T | undefined> {
    const databaseValues = this.modelToDatabase(record);
    var sql = QueryBuilder.buildInsert(this.tableName, databaseValues);
    const params = Object.values(databaseValues);
    
    const result = await this.executeSql(sql, params);
    return await this.find<T>(result.insertId);
  }

  /**
   * ```js
   * Animal.update({
   *   id: 100,
   *   age: 10,
   *   color: '%Brown%',
   * })
   * ```
   * @param record
   * @returns registro actualizado
   */
  static async update<T extends Model>(
    record: any
  ): Promise<T | undefined> {
    const databaseValues = this.modelToDatabase(record);

    // Extrae el valor de "id" y crea un nuevo objeto sin ese dato
    const { [this.primaryKey]: id, ...props } = databaseValues

    const sql = QueryBuilder.buildUpdate(
      this.tableName, props, `${this.primaryKey} = ?`
    );
    const params = Object.values(props);

    await this.executeSql(sql, [...params, id]);
    return await this.find<T>(id);
  }

  /**
   * ```js
   * Animal.destroy(100)
   * ```
   * @param id identificador
   * @returns rowsAffected
   */
  static async destroy(id: any): Promise<number> {
    const sql = QueryBuilder.buildDelete(
      this.tableName, `${this.primaryKey} = ?`)

    const result = await this.executeSql(sql, [id]);
    return result.rowsAffected;
  }

  /**
   * ```js
   * Animal.destroyAll()
   * ```
   * @returns rowsAffected
   */
  static async destroyAll(): Promise<number> {
    const sql = QueryBuilder.buildDelete(this.tableName)
    const result = await this.executeSql(sql);
    return result.rowsAffected;
  }

  save<T extends Model>(): Promise<T | undefined> {
    const ModelClass = (this.constructor as typeof Model);
    const currentInstance: any = this;
    const id = currentInstance[ModelClass.primaryKey]
    
    if (id) {
      return ModelClass.update<T>(currentInstance)
    } else {
      return ModelClass.create<T>(currentInstance)
    }
  }

  destroy(): Promise<number> {
    const ModelClass = (this.constructor as typeof Model);
    const currentInstance: any = this;
    const id = currentInstance[ModelClass.primaryKey]

    return ModelClass.destroy(id);
  }
}