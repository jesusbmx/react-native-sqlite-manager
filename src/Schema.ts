import DB, { type QueryResult } from './DB';

export default class Schema {

    public db: DB;

    constructor(db: DB) {
        this.db = db;
    }

    execSQL(sql: string): Promise<QueryResult> {
      console.debug(sql)
      return this.db.executeSql(sql)
    }

    /**
     * Crea la tabla
     * @param tableName 
     * @param closure 
     * @returns 
     */
    async create(tableName: string, closure: (table: TableSchema) => void): Promise<TableSchema> {
        const tableSchema = new TableSchema(tableName)
        await closure(tableSchema)
    
        // Create
        await this.execSQL(tableSchema.toString())
        tableSchema.isCreated = true
    
        for (const index of tableSchema.indexs) {
          await this.execSQL(index.toString())
        }
    
        return tableSchema
    }

    /**
     * Agrega las columnas nuevas que no existen fisicamente en la tabla.
     * @param tableName 
     * @param closure 
     */
    async alter(tableName: string, closure: (table: TableSchema) => void): Promise<TableSchema> {
        const tableSchema = new TableSchema(tableName)
        await closure(tableSchema)
    
        // Alter
        const missingColumns = await this.getMissingColumns(tableSchema)
        for (let i = 0; i < missingColumns.length; i++) {
          const col = missingColumns[i];
          await this.execSQL(`ALTER TABLE ${tableSchema.name} ADD COLUMN ${col}`)
        }
    
        for (const index of tableSchema.indexs) {
          await this.execSQL(`DROP INDEX IF EXISTS ${index.name}`)
          await this.execSQL(index.toString())
        }
    
        return tableSchema
    }

    /**
     * Crea o modifica la tabla
     * @param tableName 
     * @param closure 
     * @returns 
     */
    async createOrAlter(tableName: string, closure: (table: TableSchema) => void): Promise<TableSchema> {
      if (await this.hasTable(tableName)) {
        return await this.alter(tableName, closure);
      } else {
        return await this.create(tableName, closure);
      }
    }

    /** 
     * Elimina la tabla 
     */
    async drop(tableName: string) {
      await this.execSQL(`DROP TABLE IF EXISTS ${tableName}`)
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

    async getColumnNames(tableName: string): Promise<string[]> {
      const { rows } = await this.execSQL(`
          PRAGMA table_info(${tableName})
      `)
      return rows.map(row => row["name"])
    }

    /**
     * Obtiene un lista de columnas que ha un no exiten fisicamente en la tabla.
     */
    async getMissingColumns(table: TableSchema): Promise<Array<Column>> {
      const existingColumnNames = await this.getColumnNames(table.name);
      return table.columns.filter(col => !existingColumnNames.includes(col.name));
    }
}

/*
 * CREATE TABLE IF NOT EXISTS tb_usuario ( ... )
 */
export class TableSchema {

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