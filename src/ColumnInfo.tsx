import QueryBuilder from "./QueryBuilder"

/**
  * id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL DEFAUL '' +
  */
export default class ColumnInfo {
  public name: string;
  public type: string;
  private _primaryKey: boolean = false;
  private _autoIncrement: boolean = false;
  private _nullable: boolean = false;
  private _defaultVal?: string;

  constructor(name: string, type: string) {
    this.name = name;
    this.type = type;
  }

  primaryKey(): ColumnInfo {
    this._primaryKey = true;
    return this;
  }

  autoIncrement(): ColumnInfo {
    this._autoIncrement = true;
    return this;
  }

  defaultVal(defaultVal: string): ColumnInfo {
    this._defaultVal = defaultVal;
    return this;
  }

  nullable(): ColumnInfo {
    this._nullable = true;
    return this;
  }

  compile(): string {
    const sql: string[] = [
      `${this.name} ${this.type}`,
      this._primaryKey ? " PRIMARY KEY" : "",
      this._autoIncrement ? " AUTOINCREMENT" : "",
      this._nullable ? " NULL" : " NOT NULL",
      this._defaultVal != null ? ` DEFAULT ${QueryBuilder.escapeSqlString(this._defaultVal)}` : "",
    ];

    return sql.join("");
  }
}
