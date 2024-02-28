import DB, { type ResultSet } from './DB';

export default class Schema {

    public db: DB;

    constructor(db: DB) {
        this.db = db;
    }

    execSQL(sql: string): Promise<ResultSet> {
      console.debug(sql)
      return this.db.executeSql(sql)
    }

    /**
     * Crea la tabla
     * @param tableName 
     * @param closure 
     * @returns 
     */
    async create(
      tableName: string, 
      closure: (table: Table) => void
    ): Promise<Table> {

        const table = new Table(tableName)
        await closure(table)
    
        // Create
        await this.execSQL(table.toString())
        table.isCreated = true
    
        for (const index of table.indexs) {
          await this.execSQL(index.toString())
        }
    
        return table
    }

    /**
     * Agrega las columnas nuevas que no existen fisicamente en la tabla.
     * @param tableName 
     * @param closure 
     */
    async alter(
      tableName: string, 
      closure: (table: Table) => void
    ): Promise<Table> {
      
        const table = new Table(tableName)
        await closure(table)
    
        // Alter
        const set = await this.getColumnsNotExist(table)
        for (let i = 0; i < set.length; i++) {
          const col = set[i];
          await this.execSQL(`
              ALTER TABLE ${table.name} ADD COLUMN ${col}
          `)
        }
    
        for (const index of table.indexs) {
          await this.execSQL(`DROP INDEX IF EXISTS ${index.name}`)
          await this.execSQL(index.toString())
        }
    
        return table
    }

    /**
     * Crea o modifica la tabla
     * @param tableName 
     * @param closure 
     * @returns 
     */
    async createOrAlter(
      tableName: string, 
      closure: (table: Table) => void
    ): Promise<Table> {

      if (await this.hasTable(tableName)) {
        return await this.alter(tableName, closure);
      } else {
        return await this.create(tableName, closure);
      }
    }

    /**
     * Valida si existe una tabla en la base de datos.
     */
    async hasTable(tableName: string): Promise<boolean> {
        const { rows } = await this.execSQL(`
            SELECT COUNT(*) AS _count_ FROM sqlite_master WHERE type = 'table' AND name = '${tableName}'
        `);

        if (rows[0]) {
            const first = rows[0]
            return (first['_count_'] > 0);
        }

        return false;
    }

    /**
     * Obtiene un lista de columnas que ha un no exiten fisicamente en la tabla.
     */
    async getColumnsNotExist(
      table: Table
    ): Promise<Array<Column>> {
        const { rows } = await this.execSQL(`
            PRAGMA table_info(${table.name})
        `)

        const existingColumnNames: string[] = rows.map(it => it["name"])
        const missingColumns: Array<Column> = [];

        for (const col of table.columns) {
          // Verifica si la columna no está presente
          if (!existingColumnNames.includes(col.name)) {
              // La columna no existe, añadirla al resultado
              missingColumns.push(col);
          }
        }

        return missingColumns
    }
}

/*
 * CREATE TABLE IF NOT EXISTS tb_usuario ( ... )
 */
export class Table {

    public name: string;
    public isCreated: boolean = false;
    public columns = new Array<Column>()
    public constraints = new Array<Constraint>()
    public indexs = new Array<Index>()

    constructor(name: string) {
        this.name = name;
    }
    
    addColumn(columname: string, type: string): Column {
      const col = new Column(columname, type)
      this.columns.push(col)
      return col
    }
    
    addConstraint(): Constraint {
      const constraint = new Constraint()
      this.constraints.push(constraint)
      return constraint
    }
    
    addIndex(indexname: string): Index {
      const index = new Index(indexname, this.name)
      this.indexs.push(index)
      return index
    }
    
    /** Incrementing ID to the table (primary key)  */
    increments(column: string): Column {
        return this.integer(column).primaryKey().autoIncrement()
    }
    
    /** INTEGER equivalent to the table  */
    integer(column: string): Column {
        return this.addColumn(column, "INTEGER")
    }

    /** FLOAT equivalent to the table  */
    float(column: string): Column {
      return this.addColumn(column, "FLOAT")
    }
    
    /** DECIMAL equivalent with a precision and scale  */
    real(column: string): Column{
        return this.addColumn(column, "REAL")
    }
    
    /** VARCHAR equivalent column  */
    text(column: string): Column {
        return this.addColumn(column, "TEXT")
    }
    
    /** Binary equivalent column  */
    blob(column: string): Column {
        return this.addColumn(column, "BLOB")
    }
    
    toString(): string {
      // Asegura que las columnas y las restricciones se unan correctamente, separadas por comas si es necesario
      const columnDefinitions = [...this.columns, ...this.constraints].join(",\n\t");
      return `
        CREATE TABLE IF NOT EXISTS ${this.name} (
          ${columnDefinitions
        })
      `;
    }

    foreign(columnname: string): Constraint {
        return this.addConstraint().foreign(columnname)
    }

    index(indexname: string): Index {
        return this.addIndex(indexname)
    }
}

/**
 * id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL DEFAUL '' +
 */
export class Column {
    private _primaryKey: boolean = false;
    private _autoIncrement: boolean = false;
    private _nullable: boolean = false;
    private _defaultVal: any | null = null;
  
    constructor(public name: string, public type: string) {}
  
    primaryKey(): Column {
      this._primaryKey = true;
      return this;
    }
  
    autoIncrement(): Column {
      this._autoIncrement = true;
      return this;
    }
  
    default(defaultVal: any): Column {
      this._defaultVal = defaultVal;
      return this;
    }
  
    nullable(): Column {
      this._nullable = true;
      return this;
    }
  
    toString(): string {
      let sql = `${this.name} ${this.type}`;
      if (this._primaryKey) sql += " PRIMARY KEY";
      if (this._autoIncrement) sql += " AUTOINCREMENT";
      sql += this._nullable ? " NULL" : " NOT NULL";
      if (this._defaultVal !== null) {
        // Aquí se simplifica el escape de la cadena SQL. 
        // Deberías implementar una función adecuada para escapar la cadena SQL según tus necesidades.
        sql += ` DEFAULT '${this._defaultVal}'`;
      }
      return sql;
    }
}

/**
 * CREATE UNIQUE INDEX IF NOT EXISTS 'index_picking'
 * ON 'tb_picking' ('folio')
 */
export class Index {
    private _unique: boolean = false;
    private _columns: string[] = [];
  
    constructor(public name: string, public tablename: string) {}
  
    unique(...columns: string[]): void {
      this._unique = true;
      this._columns = columns;
    }
  
    columns(...columns: string[]): void {
      this._columns = columns;
    }
  
    toString(): string {
      let sql = `CREATE`;
      if (this._unique) sql += ` UNIQUE`;
      sql += ` INDEX IF NOT EXISTS ${this.escapeSQLString(this.name)} ON ${this.escapeSQLString(this.tablename)} (`;
      sql += this._columns.map(column => `${this.escapeSQLString(column)}`).join(", ");
      sql += `)`;
      return sql;
    }
  
    private escapeSQLString(value: string): string {
      // Implementa aquí tu lógica de escape de cadenas SQL, según sea necesario.
      // Esta es una implementación básica que simplemente devuelve la cadena entre comillas simples como ejemplo.
      return `'${value.replace(/'/g, "''")}'`;
    }
}

/**
 * FOREIGN KEY(id_inventario) REFERENCES tb_inventario(id) ON DELETE CASCADE
 */
export class Constraint {
  private _foreign: string[] = [];
  private _references: string[] = [];
  private _table: string | null = null;
  private _onDelete: string | null = null;

  foreign(...key: string[]): Constraint {
    this._foreign = key;
    return this;
  }

  references(...key: string[]): Constraint {
    this._references = key;
    return this;
  }

  on(table: string): Constraint {
    this._table = table;
    return this;
  }

  onDelete(on: string = "CASCADE"): void {
    this._onDelete = on;
  }

  toString(): string {
    let sql = "";
    if (this._foreign.length > 0)
      sql += `FOREIGN KEY (${this._foreign.join(", ")})`;

    if (this._table !== null && this._references.length > 0)
      sql += ` REFERENCES ${this._table} (${this._references.join(", ")})`;

    if (this._onDelete !== null)
      sql += ` ON DELETE ${this._onDelete}`;

    return sql;
  }
}