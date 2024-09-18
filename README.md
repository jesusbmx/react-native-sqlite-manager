# react-native-sqlite-manager

Tool that simplifies management and access to SQLite databases in React Native applications

[Example](example)

#### Dependencies
```sh
npm install react-native-sqlite-storage

## Optional
npm install @types/react-native-sqlite-storage --save-dev
```

## Installation

```sh
npm install react-native-sqlite-manager
```

## Getting Started

You just have to import the library like this:

```js
import { DB } from 'react-native-sqlite-manager';
```

Get a database instance using:

```js
const db = DB.get("example.db");
```

Now, whenever you need to make some database call you can use db variable to execute the database query.

```js
const { rows } = await db.executeSql(`
  SELECT id, name, color FROM tb_animals
`)
```

Get row values

```js
for (const row of rows) {
  const id = row["id"]
  const name = row["name"]
  const color = row["color"]
}
```

## Create database

Initialize the database in your React Native application as follows:

```js
function App(): JSX.Element {
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    setLoading(true)

    // We get a database instance by name, and Initialize the database schema.
    const db = DB.get(/*database name*/"example.db")
    db.migrate(new Migration(), /*database version*/ 1).then(() => {
      setLoading(false)
    })

  }, []);

  if (loading) {
    return (
      <ActivityIndicator animating={true} size='large' style={{flex: 1}} />
    )
  }

  return (
    <PaperProvider>
      <AppNavigator/>
    </PaperProvider>
  );
}
```

### Defining the Schema
Define your database Schema by creating a class that extends ItMigration:

```js
import { DB, ItMigration, Schema } from 'react-native-sqlite-manager';

export default class Migration extends ItMigration {
    
  /**
   * When the database is created
   * @param db
   */
  async onCreate(db: DB) {
    const schema = new Schema(db)

    /*await db.executeSql(`
      CREATE TABLE IF NOT EXISTS tb_animals (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 
        name TEXT NOT NULL, 
        color TEXT NOT NULL, 
        age INTEGER NOT NULL, 
        timestamp INTEGER NOT NULL
      );
    `)*/
    await schema.create("tb_animals", (table) => {
      table.increments("id")
      table.text("name")
      table.text("color")
      table.integer("age")
      table.integer("timestamp")
    });

    // Define other tables here
  }

}
```

## Query Builder

#### Select
```js
// SELECT id, name, color FROM tb_animals 
// WHERE age > 8 AND age < 12
// ORDER BY name ASC 
// LIMIT 30 OFFSET 60
const rows = await db.table('tb_animals')
  .select('id, name, color')
  .where("age > ? AND age < ?", [8, 12])
  .orderBy('name ASC')
  .limit(30)
  .page(3)
  .get()
```

#### Insert
```js
// INSERT INTO tb_animals(name, color, age, timestamp) 
// VALUES("Bob", "Brown", 2, 1699018870505)
const insertId = await db.table('tb_animals')
  .insert({
    name: 'Bob',
    color: 'Brown',
    age: 2,
    timestamp: Date.now(),
  })
```

#### Insert Array
```js
// INSERT INTO tb_animals (name, color, age, timestamp) 
// VALUES 
//   ('Max', 'Black', 4, 1699018870505),
//   ('Bella', 'White', 3, 1699018870506)
await db.table('tb_animals')
  .insertArray(['name', 'color', 'age', 'timestamp'],
    [
      ['Max', 'Black', 4, Date.now()],  // First record
      ['Bella', 'White', 3, Date.now()]  // Second record
    ]
  )
```

#### Update
```js
// UPDATE tb_animals SET name = "Bob" WHERE id = 7
const rowsAffected = await db.table('tb_animals')
  .where("id = ?", [7])
  .update({
    name: 'Bob',
  })
```

#### Delete
```js
// DELETE FROM tb_animals WHERE id = 8
const rowsAffected = await db.table('tb_animals')
  .where("id = ?", [7])
  .delete()
```

## Model Definition
Create a model for your database table by extending the Model class:

```js
import { Model } from 'react-native-sqlite-manager';

export default class Animal extends Model {
  public id!: number;
  public name!: string;
  public color!: string;
  public age!: number;
  public timestamp!: number;

  constructor(props: any = {}) {
    super(props)
  }

  static get databaseName(): string {
    return 'example.db'
  }

  static get tableName(): string {
    return 'tb_animals'
  }
}

```

#### Select
```js
// SELECT * FROM tb_animals
const animals = await Animal.all()

// SELECT * FROM tb_animals WHERE id = 1
const animalById = await Animal.find(1)

// SELECT * FROM tb_animals WHERE age > 10
const animalByAge = await Animal.findBy("age", ">", 10)

// SELECT * FROM tb_animals ORDER BY ROWID ASC LIMIT 1
const firtsAnimal = await Animal.first()

// SELECT id, name, color FROM tb_animals 
// WHERE age > 8 AND age < 12
// ORDER BY name ASC 
// LIMIT 30 OFFSET 60
const animalsByQuery = await Animal.query({
  columns: 'id, name, color',
  where: {
    clause: 'age > ? AND age < ?',
    args: [ 8, 12 ],
  },
  page: 3,
  limit: 30,
  order: 'name ASC'
})

```

#### Insert
```js
// INSERT INTO tb_animals(name, color, age, timestamp) 
// VALUES("Bob", "Brown", 2, 1699018870505)
const createdAnimal = await Animal.create({
  name: 'Bob',
  color: 'Brown',
  age: 2,
  timestamp: Date.now(),
})
```

#### Update
```js
// UPDATE tb_animals SET name = "Bob" WHERE id = 7
const updatedAnimal = await Animal.update({
  id: 7,
  name: 'Bob',
})
```

#### Delete
```js
// DELETE FROM tb_animals WHERE id = 8
await Animal.destroy(8)
```

#### Save
```js
const animalById = await Animal.find(1)
animalById.age = 12
await animalById.save()
```

#### Custom function

```js
export default class Animal extends Model {

  ...

  static async getAnimals(): Promise<any[]> {
    const { rows } = await Animal.executeSql(`
      SELECT * FROM tb_animals WHERE age > ? AND age < ?
    `, [
      8, 12
    ])

    return rows
  }
}

```

## Raw Query

#### Select

```js
const { rows } = await db.executeSql(`
  SELECT id, name, color FROM tb_animals 
  WHERE age > ? AND age < ?
  ORDER BY name ASC 
  LIMIT 30 OFFSET 60
`, [
  8, 12
])
```

#### Insert

```js
const { insertId } = await db.executeSql(`
  INSERT INTO tb_animals(name, color, age, timestamp) 
  VALUES("Bob", "Brown", 2, 1699018870505)
`)
```

#### Update

```js
const { rowsAffected } = await db.executeSql(`
  UPDATE tb_animals SET name = "Bob" WHERE id = 7
`)
```

#### Delete
```js
const { rowsAffected } = await db.executeSql(`
  DELETE FROM tb_animals WHERE id = 8
`)
```

## Update database version

To update your database schema to a new version, follow this process:

```js
const db = DB.get(/*name*/ "example.db")
db.migrate(new Migration(), /*version*/ 2).then(() => {
  setLoading(false)
})
```
In the code above, we use `DB.get("example.db")` to access the database instance, `new Migration()` to create an updated database schema, and 2 to set the new database version. The migrate function will execute the migration schema only if the database doesn't exist yet or if the version is being updated.

### Key Points:

  - `DB.get("example.db")` retrieves the database instance.
  - `new Migration()` defines the updated schema for version 2 of the database.
  - The migration process will only be triggered if the database is new or the version changes, ensuring efficient schema updates without redundant operations.

### Updated Schema

The `Migration` class defines the structural changes for the new database version. For example, in version 2, you might want to add a `description` column to the `tb_animals` table. Here's an example of how you can define that migration:
```js
import { DB, ItMigration, Schema } from 'react-native-sqlite-manager';

export default class Migration extends ItMigration {
    
  /**
   * When the database is created
   * @param db
   */
  async onCreate(db: DB) {
     const schema = new Schema(db)

    await schema.create("tb_animals", (table) => {
      table.increments("id")
      table.text("name")
      table.text("color")
      table.integer("age")
      table.integer("timestamp")
      table.text("description").defaultVal("") // Added in version 2
    });
  }
  
  /**
   * When the database version is updated
   * @param {DB} db
   * @param {number} oldVersion
   * @param {number} newVersion
   */
  async onUpdate(db: DB, oldVersion: number, newVersion: number) {
    if (oldVersion != newVersion) {
      // update version db
      const schema = new Schema(db)
      await schema.alter("tb_animals", (table) => {
        table.text("description").defaultVal("") // Added in version 2
      });
    }
  }
}
```

### Simplified Approach for Schema Updates

To avoid manually checking the version, you can streamline the process using a centralized schema definition. By defining a helper function that adds the new column when needed, the schema can be consistently updated both during creation and version updates:

```js
import { DB, ItMigration, Schema } from 'react-native-sqlite-manager';

export default class Migration extends ItMigration {

  define(db: DB) {
    const schema = new Schema(db)

    await schema.createOrAlter("tb_animals", (table) => {
      table.increments("id")
      table.text("name")
      table.text("color")
      table.integer("age")
      table.integer("timestamp")
      table.text("description").defaultVal("") // Added in version 2
    });
  }
    
  /**
   * When the database is created
   * @param db
   */
  async onCreate(db: DB) {
    await define(db)
  }
  
  /**
   * When the database version is updated
   * @param {DB} db
   * @param {number} oldVersion
   * @param {number} newVersion
   */
  async onUpdate(db: DB, oldVersion: number, newVersion: number) {
    if (oldVersion != newVersion) {
      await define(db)
    }
  }
}
```

### Key Points:

  - `createOrAlter`: Ensures that the new columns are added even if they don't exist in the current schema.
  - Centralized schema definition: By using the `define` function, the same schema logic is applied when creating the database or updating its version, reducing redundancy.


# Documentation

## `DB` Class

### `constructor(name: string)`

- Initializes the `DB` instance.

  **Parameters:**
  
  - `name` (string): Name of the database.

---

### `get(name: string): DB`

- Obtains an instance of the database.

  **Parameters:**
  
  - `name` (string): Name of the database.

  **Returns:**
  
  - `DB`: Instance of the database.

---

### `open(): Promise<SQLiteDatabase>`

- Opens the database asynchronously and returns a promise resolving to the `SQLiteDatabase` instance.

  **Returns:**
  
  - `Promise<SQLiteDatabase>`: Promise resolving to the `SQLiteDatabase` instance.

---

### `close(): void`

- Closes the database connection.

---

### `executeSql(sql: string, params: any[] = []): Promise<QueryResult>`

- Executes an SQL statement and returns a promise resolving to the result.

  **Parameters:**
  
  - `sql` (string): SQL statement.
  - `params` (any[]): Parameters for the SQL statement. Default is an empty array.

  **Returns:**
  
  - `Promise<QueryResult>`: Promise resolving to the result of the query.

---

### `executeTransaction(requests: SqlRequest[]): Promise<SQLite.ResultSet[]>`

- Executes a series of SQL statements in bulk and returns a promise resolving to an array of results.

  **Parameters:**
  
  - `requests` (SqlRequest[]): SQL statements to be executed in the transaction.

  **Returns:**
  
  - `Promise<SQLite.ResultSet[]>`: Promise resolving to an array of results of the queries.

---

### `getVersion(): Promise<number>`

- Retrieves the database version.

  **Returns:**
  
  - `Promise<number>`: Promise resolving to the current version number of the database.

---

### `setVersion(version: number): Promise<void>`

- Sets the database version.

  **Parameters:**
  
  - `version` (number): New version number for the database.

  **Returns:**
  
  - `Promise<any>`: Promise.

---

### `migrate(migration: ItMigration, version: number): void`

- Initializes the database schema and applies migrations for the specified version.

  **Parameters:**
  
  - `migration` (ItMigration): Instance of the `ItMigration` class defining schema changes.
  - `version` (number): New version number for the database.

---

### `table(tableName: string): QueryBuilder`

- Returns a `QueryBuilder` instance for interacting with a specific table.

  **Parameters:**
  
  - `tableName` (string): Name of the table.

  **Returns:**
  
  - `QueryBuilder`: Instance of the `QueryBuilder` for building and executing queries.

---


## `QueryResult` Type

### `insertId?: number`

- The ID of the last inserted row, if applicable.

---

### `rowsAffected: number`

- The number of rows affected by the query.

---

### `rows: any[]`

- An array containing the result rows of the query.

---


## `QueryBuilder` Class

### `constructor(database: DB, tableName: string)`

- Initializes the `QueryBuilder` for a specific table.

  **Parameters:**
  
  - `database` (DB): Instance of the database.
  - `tableName` (string): Name of the table.

---

### `select(columns: string[] = []): QueryBuilder`

- Specifies the columns to be selected in the query.

  **Parameters:**
  
  - `columns` (string[]): Array of column names. Default is an empty array.

  **Returns:**
  
  - `QueryBuilder`: Instance of `QueryBuilder` with the SELECT clause.

---

### `where(condition: string, params: any[] = []): QueryBuilder`

- Specifies the WHERE clause in the query.

  **Parameters:**
  
  - `condition` (string): WHERE clause condition.
  - `params` (any[]): Parameters for the WHERE condition. Default is an empty array.

  **Returns:**
  
  - `QueryBuilder`: Instance of `QueryBuilder` with the WHERE clause.

---

### `orderBy(column: string, order: 'ASC' | 'DESC' = 'ASC'): QueryBuilder`

- Specifies the ORDER BY clause in the query.

  **Parameters:**
  
  - `column` (string): Column name to sort by.
  - `order` ('ASC' | 'DESC'): Sorting order. Default is 'ASC'.

  **Returns:**
  
  - `QueryBuilder`: Instance of `QueryBuilder` with the ORDER BY clause.

---

### `limit(limit: number, offset: number = 0): QueryBuilder`

- Specifies the LIMIT clause in the query.

  **Parameters:**
  
  - `limit` (number): Maximum number of rows to return.
  - `offset` (number): Number of rows to skip. Default is 0.

  **Returns:**
  
  - `QueryBuilder`: Instance of `QueryBuilder` with the LIMIT clause.

---

### `get(): Promise<any[]>`

- Executes the SELECT query and returns a promise resolving to the result.

  **Returns:**
  
  - `Promise<any[]>`: Promise resolving to an array of records matching the query.

---

### `insert(record: Record<string, any>): Promise<number>`

- Executes the INSERT query and returns a promise resolving to the result.

  **Parameters:**
  
  - `record` (Record<string, any>): Object containing column-value pairs to insert.

  **Returns:**
  
  - `Promise<number>`: Promise resolving to the ID of the last inserted row.

---

### `insertArray(fields: string[], data: any[][]): Promise<QueryResult>`

- Executes the INSERT query and returns a promise resolving to the result.

  **Parameters:**
  
  - `fields` (string[]): fields to insert.
  - `data` (any[][]): records to insert.

  **Returns:**
  
  - `Promise<QueryResult>`: Promise resolving to the result of the query.

---

### `update(record: Record<string, any>): Promise<number>`

- Executes the UPDATE query and returns a promise resolving to the result.

  **Parameters:**
  
  - `record` (Record<string, any>): Object containing column-value pairs to update.

  **Returns:**
  
  - `Promise<number>`: Promise resolving to the number of rows affected by the query.

---

### `delete(): Promise<number>`

- Executes the DELETE query and returns a promise resolving to the result.

  **Returns:**
  
  - `Promise<number>`: Promise resolving to the number of rows affected by the query.

---


## `ItMigration` Class

### `onCreate(db: DB): void`

- Abstract method that must be implemented to define the actions to perform when the database is created.

  **Parameters:**
  
  - `db` (DB): The instance of the database being created.

---

### `onPostCreate(db: DB): void`

- Method that can be optionally overridden to define actions to perform after the database is created.

  **Parameters:**
  
  - `db` (DB): The instance of the database.

---

### `onUpdate(db: DB, oldVersion: number, newVersion: number): void`

- Method that can be overridden to define actions to perform when the database is updated to a new version.

  **Parameters:**
  
  - `db` (DB): The instance of the database.
  - `oldVersion` (number): The previous version of the database.
  - `newVersion` (number): The new version of the database.

---

### `onPostUpdate(db: DB, oldVersion: number, newVersion: number): void`

- Method that can be optionally overridden to define actions to perform after the database update is completed.

  **Parameters:**
  
  - `db` (DB): The instance of the database.
  - `oldVersion` (number): The previous version of the database.
  - `newVersion` (number): The new version of the database.

---


## `Schema` Class

### `constructor(db: DB)`

- Initializes the `Schema` instance, which is responsible for creating, altering, and managing tables in the database.

  **Parameters:**
  
  - `db` (DB): Instance of the database.

---

### `execSQL(sql: string): Promise<QueryResult>`

- Executes an SQL statement and returns a promise resolving to the result.

  **Parameters:**
  
  - `sql` (string): SQL statement to be executed.

  **Returns:**
  
  - `Promise<QueryResult>`: Promise resolving to the result of the query.

---

### `create(tableName: string, closure: (table: TableSchema) => void): Promise<TableSchema>`

- Creates a new table in the database with columns, indexes, and constraints defined in the `TableSchema`. Constraints such as `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, and `CHECK` are applied during the table creation.

  **What it does:**

  - Creates a table with the defined columns and constraints.
  - Creates the specified indexes after the table is created.
  - Ensures that column names and constraints are correctly included in the SQL query.
  
  **Parameters:**
  
  - `tableName` (string): The name of the table to be created.
  - `closure` (function): A function that defines the columns and constraints of the table.

  **Returns:**
  
  - `Promise<TableSchema>`: A promise that resolves to the created `TableSchema` instance.

---

### `alter(tableName: string, closure: (table: TableSchema) => void): Promise<TableSchema>`

- Alters an existing table by adding new columns that do not already exist. The table structure is modified by appending these columns, but it does not modify existing columns or constraints.

  **What it does:**

  - Adds new columns to the table if they do not already exist.
  - Recreates indexes if any are defined in the `TableSchema`.

  **Parameters:**
  
  - `tableName` (string): The name of the table to be altered.
  - `closure` (function): A function that defines the new columns to be added and the corresponding constraints.
  
  **Returns:**
  
  - `Promise<TableSchema>`: A promise that resolves to the altered `TableSchema` instance.

---

### `createOrAlter(tableName: string, closure: (table: TableSchema) => void): Promise<TableSchema>`

- Create or modify the table

  **Parameters:**
  
  - `tableName` (string): Name of the table.
  - `closure` (function): Function that defines the new columns and constraints to be added.

  **Returns:**
  
  - `Promise<TableSchema>`: Promise resolving to the altered `TableSchema` instance.

## `TableSchema` Class

### `constructor(name: string)`

- Initializes a new `TableSchema` instance.

  **Parameters:**
  
  - `name` (string): The name of the table.

---

### `addColumn(columname: string, type: string): Column`

- Adds a new column to the table with the specified name and type.

  **Parameters:**
  
  - `columname` (string): The name of the column.
  - `type` (string): The data type of the column.

  **Returns:**
  
  - `Column`: The created column.

---

### `increments(column: string): Column`

- Adds an auto-incrementing primary key to the table.

  **Parameters:**
  
  - `column` (string): The name of the primary key column.

  **Returns:**
  
  - `Column`: The auto-incrementing primary key column.

---

### `integer(column: string): Column`

- Adds an `INTEGER` column to the table.

  **Parameters:**
  
  - `column` (string): The name of the column.

  **Returns:**
  
  - `Column`: The created `INTEGER` column.

---

### `float(column: string): Column`

- Adds a `FLOAT` column to the table.

  **Parameters:**
  
  - `column` (string): The name of the column.

  **Returns:**
  
  - `Column`: The created `FLOAT` column.

---

### `real(column: string): Column`

- Adds a `REAL` (decimal) column to the table with a precision and scale.

  **Parameters:**
  
  - `column` (string): The name of the column.

  **Returns:**
  
  - `Column`: The created `REAL` column.

---

### `text(column: string): Column`

- Adds a `TEXT` (VARCHAR equivalent) column to the table.

  **Parameters:**
  
  - `column` (string): The name of the column.

  **Returns:**
  
  - `Column`: The created `TEXT` column.

---

### `blob(column: string): Column`

- Adds a `BLOB` (binary) column to the table.

  **Parameters:**
  
  - `column` (string): The name of the column.

  **Returns:**
  
  - `Column`: The created `BLOB` column.

---

### `foreign(columnname: string): Constraint`

- Adds a foreign key constraint to the specified column.

  **Parameters:**
  
  - `columnname` (string): The name of the column that will have the foreign key.

  **Returns:**
  
  - `Constraint`: The created foreign key constraint.

---

### `index(indexname: string): Index`

- Adds an index to the specified column in the table.

  **Parameters:**
  
  - `indexname` (string): The name of the index.

  **Returns:**
  
  - `Index`: The created index.


## `Model` Class

### Static Properties

#### `databaseName: string`

- **Type:** `string`
- **Description:** Name of the database. Must be defined in the model class.

---

#### `tableName: string`

- **Type:** `string`
- **Description:** Name of the table associated with the model. Must be defined in the model class.

---

#### `primaryKey: string`

- **Type:** `string`
- **Default:** `"id"`
- **Description:** The primary key of the table. Defaults to `"id"`.

---

### Constructor

#### `constructor(props: any = {})`

- Initializes a new instance of the model.

  **Parameters:**
  
  - `props` (any): Object containing properties to set on the model instance.

---

### Instance Methods

#### `save(): Promise<any | undefined>`

- Saves the model instance to the database. If the primary key is not set, a new record is created; otherwise, the existing record is updated.

  **Returns:**
  
  - `Promise<any | undefined>`: Promise resolving to the saved or updated record.

---

#### `destroy(): Promise<number>`

- Deletes the model instance from the database.

  **Returns:**
  
  - `Promise<number>`: Promise resolving to the number of affected rows.

---

### Static Methods

#### `executeSql(sql: string, params: any[] = []): Promise<QueryResult>`

- Executes a raw SQL query on the database.

  **Parameters:**
  
  - `sql` (string): SQL query string.
  - `params` (any[]): Parameters for the SQL query. Default is an empty array.

  **Returns:**
  
  - `Promise<QueryResult>`: Promise resolving to the result of the query.

---

#### `all(): Promise<any[]>`

- Retrieves all records from the table.

  **Returns:**
  
  - `Promise<any[]>`: Promise resolving to an array of all records.

---

#### `findBy(column: string, op: string, value: any): Promise<any | undefined>`

- Finds a record by a specified column, comparison operator, and value.

  **Parameters:**
  
  - `column` (string): Column name.
  - `op` (string): Comparison operator (e.g., "=", ">", "<").
  - `value` (any): Value to compare against.

  **Returns:**
  
  - `Promise<any | undefined>`: Promise resolving to the found record, or undefined if not found.

---

#### `find(id: any): Promise<any | undefined>`

- Finds a record by its primary key.

  **Parameters:**
  
  - `id` (any): Value of the primary key.

  **Returns:**
  
  - `Promise<any | undefined>`: Promise resolving to the found record, or undefined if not found.

---

#### `first(): Promise<any | null>`

- Retrieves the first record from the table.

  **Returns:**
  
  - `Promise<any | null>`: Promise resolving to the first record, or null if no records exist.

---

#### `last(): Promise<any | null>`

- Retrieves the last record from the table.

  **Returns:**
  
  - `Promise<any | null>`: Promise resolving to the last record, or null if no records exist.

---

#### `count(): Promise<number>`

- Counts the number of records in the table.

  **Returns:**
  
  - `Promise<number>`: Promise resolving to the count of records.

---

#### `query(options: QueryOptions = {}): Promise<any[]>`

- Executes a query with specified options.

  **Parameters:**
  
  - `options` (QueryOptions): Query options, such as columns to select, conditions, limit, etc.

  **Returns:**
  
  - `Promise<any[]>`: Promise resolving to an array of records matching the query.

---

#### `create(obj: any): Promise<any | undefined>`

- Creates a new record in the table.

  **Parameters:**
  
  - `obj` (any): Object containing column-value pairs for the new record.

  **Returns:**
  
  - `Promise<any | undefined>`: Promise resolving to the created record.

---

#### `update(obj: any): Promise<any | undefined>`

- Updates a record in the table.

  **Parameters:**
  
  - `obj` (any): Object containing column-value pairs for the update.

  **Returns:**
  
  - `Promise<any | undefined>`: Promise resolving to the updated record.

---

#### `destroy(id: any): Promise<number>`

- Deletes a record from the table by its primary key.

  **Parameters:**
  
  - `id` (any): Value of the primary key.

  **Returns:**
  
  - `Promise<number>`: Promise resolving to the number of affected rows.

---

#### `databaseToModel(databaseValues: any): Model`

- Converts database values to a model instance.

  **Parameters:**
        
  - `databaseValues` (any): Values from the database to convert.

  **Returns:**
        
  - `Model`: Model instance created from the database values.

---

#### `modelToDatabase(props: any): any`

- Converts a model instance to values that can be inserted into the database.

  **Parameters:**
    
  - `props` (any): The model properties.

  **Returns:**

  - `any`: Database-compatible values converted from the model instance.





## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
