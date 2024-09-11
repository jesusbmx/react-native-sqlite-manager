import DB, { type Payload, type ResultSet } from './DB';
import QueryBuilder, { type QueryOptions } from './QueryBuilder';

// Representa un modelos de base de datos
export default class Model {

  static get databasaName(): string {
    throw new Error('databasaName not defined')
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

  /**
   * ```js
   * Animal.executeSql("SELECT * FROM tb_animal WHERE id = ?", [7])
   * ```
   * @return {ResultSet} result
   */
  static executeSql(
    sql: string, 
    params: any[] = []
  ): Promise<ResultSet> {
    const db = DB.get(this.databasaName);
    return db.executeSql(sql, params);
  }

  static executeTransaction(
    sql: string, 
    params: any[] = []
  ): Promise<Payload> {
    const db = DB.get(this.databasaName);
    return db.executeTransaction(sql, params);
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
    column: string, op: string, value: string
  ): Promise<T | undefined> {
    
    const sql = `
      SELECT * FROM ${this.tableName} WHERE ${column} ${op} ?
    `
    const result = await this.executeSql(sql, [value]);
    const row = result.rows[0];
    return row ? (new (this as any)(row) as T) : undefined;
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
    const result = await this.executeSql(sql);
    const row = result.rows[0];
    return row ? (new (this as any)(row) as T) : null;
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
    const result = await this.executeSql(sql);
    const row = result.rows[0];
    return row ? (new (this as any)(row) as T) : null;
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
    const result = await this.executeTransaction(sql);
    const list: T[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      list.push(new (this as any)(row) as T);
    }
    return list;
  }
  

  /**
   * ```js
   * Animal.query({
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
  static async query<T extends Model>(options: QueryOptions = {}): Promise<any[]> {
    const sql = QueryBuilder.buildSelect(this.tableName, options);
    const result = await this.executeTransaction(sql, options.where?.args);
    const list: T[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      list.push(new (this as any)(row) as T);
    }
    return list;
  }

  /**
   * ```js
   * Animal.create({
   *   age: 10,
   *   color: '%Brown%',
   * })
   * ```
   * @param obj
   * @returns registro creado
   */
  static async create<T extends Model>(
    obj: any
  ): Promise<T | undefined> {
    var sql = QueryBuilder.buildInsert(this.tableName, obj)
    const params = Object.values(obj)
    
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
   * @param obj
   * @returns registro actualizado
   */
  static async update<T extends Model>(
    obj: any | T
  ): Promise<T | undefined> {
    // Extrae el valor de "id" y crea un nuevo objeto sin ese dato
    const { [this.primaryKey]: id, ...props } = obj

    const sql = QueryBuilder.buildUpdate(
      this.tableName, props, `${this.primaryKey} = ?`)

    const params = Object.values(props)

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