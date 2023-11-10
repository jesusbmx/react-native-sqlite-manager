import QueryBuilder from "./QueryBuilder"

/**
  * id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL DEFAUL '' +
  */
export default class Column {
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
    
    
  