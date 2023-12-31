import DB, { type ResultSet } from './DB';
import QueryBuilder, { type QueryOptions } from './QueryBuilder';

// Representa un modelos de base de datos
export default class Model {

  static get datebasaName(): string {
    throw new Error('datebasaName not defined')
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
  static async executeSql(
    sql: string, 
    params: any[] = []
  ): Promise<ResultSet> {
    const db = DB.get(this.datebasaName);
    await db.open();
    return await db.executeSql(sql, params);
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
  static findBy<T extends Model>(
    column: string, op: string, value: string
  ): Promise<T | undefined> {
    
    const sql = `
      SELECT * FROM ${this.tableName} WHERE ${column} ${op} ?
    `
    return this.executeSql(sql, [value])
      .then(result => result.rows[0])
      .then(row => row ? (new (this as any)(row) as T) : row)
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
  static first<T extends Model>(): Promise<T | null> {
    const sql = `
      SELECT * FROM ${this.tableName} ORDER BY ROWID ASC LIMIT 1
    `
    return this.executeSql(sql)
      .then(result => result.rows[0])
      .then(row => row ? (new (this as any)(row) as T) : row)
  }

  /**
   * ```js
   * Animal.last()
   * ```
   * @return último registro
   */
  static last<T extends Model>(): Promise<T | null> {
    const sql = `
      SELECT * FROM ${this.tableName} ORDER BY ROWID DESC LIMIT 1
    `
    return this.executeSql(sql)
      .then(result => result.rows[0])
      .then(row => row ? (new (this as any)(row) as T) : row)
  }
    
  /**
   * ```js
   * Animal.count()
   * ```
   * @return numero de registros
   */
  static count(): Promise<number> {
    const sql = `
      SELECT COUNT(*) AS __count__ FROM ${this.tableName}
    `
    return this.executeSql(sql)
      .then(result => result.rows[0])
      .then((row: any) => row["__count__"])
  }

  /**
   * ```js
   * Animal.all()
   * ```
   * @return array con todos los registros
   */
  static all(): Promise<any[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
    `
    return this.executeSql(sql)
      .then(result => result.rows)
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
  static query(options: QueryOptions = {}): Promise<any[]> {
    const sql = QueryBuilder.buildSelect(this.tableName, options);
    return this.executeSql(sql, options.where?.args)
      .then(result => result.rows)
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
  static create<T extends Model>(
    obj: any
  ): Promise<T | undefined> {
    var sql = QueryBuilder.buildInsert(this.tableName, obj)
    const params = Object.values(obj)
    
    return this.executeSql(sql, params)
      .then(result => this.find<T>(result.insertId))
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
  static update<T extends Model>(
    obj: any
  ): Promise<T | undefined> {
    // Extrae el valor de "id" y crea un nuevo objeto sin ese dato
    const { [this.primaryKey]: id, ...props } = obj

    const sql = QueryBuilder.buildUpdate(
      this.tableName, props, `${this.primaryKey} = ?`)

    const params = Object.values(props)

    return this.executeSql(sql, [...params, id])
     .then(_ => this.find<T>(id))
  }

  /**
   * ```js
   * Animal.destroy(100)
   * ```
   * @param id identificador
   * @returns rowsAffected
   */
  static destroy(id: any): Promise<number> {
    const sql = QueryBuilder.buildDelete(
      this.tableName, `${this.primaryKey} = ?`)

    return this.executeSql(sql, [id])
      .then(res => res.rowsAffected)
  }

  /**
   * ```js
   * Animal.destroyAll()
   * ```
   * @returns rowsAffected
   */
  static destroyAll(): Promise<number> {
    const sql = QueryBuilder.buildDelete(this.tableName)
    return this.executeSql(sql)
      .then(res => res.rowsAffected)
  }

  /**
   * ```js
   * Animal.save({
   *   id: 100,
   *   age: 10,
   *   color: '%Brown%',
   * })
   * ```
   * @param obj
   * @returns registro guardo o actualizado
   */
  save<T extends Model>(): Promise<T | undefined> {
    const model = (this.constructor as typeof Model);
    
    const obj: any = this;
    const id = obj[model.primaryKey]

    if (id) {
      return model.update<T>(obj)
    } else {
      return model.create<T>(obj)
    }
  }

  destroy(): Promise<number> {
    const model = (this.constructor as typeof Model);

    const obj: any = this;
    const id = obj[model.primaryKey]
    return model.destroy(id);
  }
}

