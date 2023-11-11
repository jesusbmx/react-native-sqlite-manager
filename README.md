# react-native-sqlite-manager

Tool that simplifies management and access to SQLite databases in React Native applications

#### Dependencies
```sh
npm install react-native-sqlite-storage
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

Open the database using

```js
const db = await DB.open("myApp.db");
```

Now, whenever you need to make some database call you can use db variable to execute the database query.

```js
const { rows } = await db.executeSql(`
  SELECT id, name, color FROM tb_animals
`)
```

## Create database

Initialize the database in your React Native application as follows:

```js
function App(): JSX.Element {

  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    setLoading(true)

    // We get a database instance by name. 
    const db = DB.get(/*database name*/"myApp.db")
    // Initialize the database schema.
    db.init(new Scheme(), /*database version*/ 1).then(() => {
      setLoading(false)
    })

  }, []);

  if (loading) {
    return (
      <ActivityIndicator 
        animating={true} 
        size='large' 
        style={{flex: 1}}
      />
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
Define your database schema by creating a class that extends ItScheme:

```js
import { ItScheme, table } from 'react-native-sqlite-manager';

export default class Scheme extends ItScheme {
    
  /**
   * When the database is created
   * @param db
   */
  async onCreate(db: DB) {
    console.debug("Scheme.onCreate")

    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS tb_animals (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 
        name TEXT NOT NULL, 
        color TEXT NOT NULL, 
        age INTEGER NOT NULL, 
        timestamp INTEGER NOT NULL
      );
    `)
  }

}
```

## Query Builder

Only available from version `0.3.0`

### Select
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

### Insert
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

### Update
```js
// UPDATE tb_animals SET name = "Bob" WHERE id = 7
const rowsAffected = await db.table('tb_animals')
  .where("id = ?", [7])
  .update({
    name: 'Bob',
  })
```

### Delete
```js
// DELETE FROM tb_animals WHERE id = 8
const rowsAffected = await db.table('tb_animals')
  .where("id = ?", [7])
  .delete()
```

## Model Definition
Create a model for your database table by extending the Model class:

```js
import { Model, Repository } from 'react-native-sqlite-manager';

export default class Animal extends Model {

  static get datebasaName(): string {
    return 'myApp.db'
  }

  static get tableName(): string {
    return 'tb_animal'
  }

  // Custom function
  static async getAnimals(): Promise<any[]> {
    // RAW Query
    const { rows } = await Animal.executeSql(`
      SELECT * FROM tb_animals WHERE age > ? AND age < ?
    `, [
      8, 12
    ])

    return rows
  }
}

```

### Select
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

### Insert
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

### Update
```js
// UPDATE tb_animals SET name = "Bob" WHERE id = 7
const updatedAnimal = await Animal.update({
  id: 7,
  name: 'Bob',
})
```

### Delete
```js
// DELETE FROM tb_animals WHERE id = 8
await Animal.destroy(8)
```

### Save
```js
const animalById = await Animal.find(1)
animalById.age = 12
await animalById.save()
```

## Raw Query

### Select

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

### Insert

```js
const { insertId } = await db.executeSql(`
  INSERT INTO tb_animals(name, color, age, timestamp) 
  VALUES("Bob", "Brown", 2, 1699018870505)
`)
```

### Update

```js
const { rowsAffected } = await db.executeSql(`
  UPDATE tb_animals SET name = "Bob" WHERE id = 7
`)
```

### Delete
```js
const { rowsAffected } = await db.executeSql(`
  DELETE FROM tb_animals WHERE id = 8
`)
```

## Update database version

```js
const db = DB.get(/*name*/ "myApp.db")
db.init(new Scheme(), /*version*/ 2).then(() => {
  setLoading(false)
})
```
In the code above, we use `DB.get("myApp.db")` to access the database instance, `new Scheme()` to create an updated database schema, and 2 to set the new database version.

## Updated Schema

In the updated schema class, you can define changes to the database structure for the new version. For example, you can add new columns to existing tables. Here's an example of an updated schema class:
```js
import { ItScheme, table } from 'react-native-sqlite-manager';

export default class Scheme extends ItScheme {
    
  /**
   * When the database is created
   * @param db
   */
  async onCreate(db: DB) {
    console.debug("Scheme.onCreate")

    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS tb_animals (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 
        name TEXT NOT NULL, 
        color TEXT NOT NULL, 
        age INTEGER NOT NULL, 
        timestamp INTEGER NOT NULL,
        description TEXT NOT NULL
      );
    `)
  }
  
  /**
   * When the database version is updated
   * @param {DB} db
   * @param {number} oldVersion
   * @param {number} newVersion
   */
  async onUpdate(db: DB, oldVersion: number, newVersion: number) {
    console.debug("Scheme.onUpdate", oldVersion, newVersion)

    if (oldVersion != newVersion) {
      // update version db

      await table(db, "tb_animals").addColumns([
        new Column("description", "TEXT").defaultVal("") 
      ])
    }
  }
}
```
In the `Scheme` class, you can add new database structure changes as needed for the updated version, such as adding new

## DB Class

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

### `executeSql(sql: string, params: any[] = []): Promise<ResultSet>`

- Executes an SQL statement and returns a promise resolving to the result.

  **Parameters:**
  
  - `sql` (string): SQL statement.
  - `params` (any[]): Parameters for the SQL statement. Default is an empty array.

  **Returns:**
  
  - `Promise<ResultSet>`: Promise resolving to the result of the query.

---

### `executeBulkSql(sqls: string[], params: any[][]): Promise<ResultSet[]>`

- Executes a series of SQL statements in bulk and returns a promise resolving to an array of results.

  **Parameters:**
  
  - `sqls` (string[]): Array of SQL statements.
  - `params` (any[][]): Array of arrays of parameters for the SQL statements.

  **Returns:**
  
  - `Promise<ResultSet[]>`: Promise resolving to an array of results of the queries.

---

### `getVersion(): Promise<number>`

- Retrieves the database version.

  **Returns:**
  
  - `Promise<number>`: Promise resolving to the current version number of the database.

---

### `setVersion(version: number): Promise<any>`

- Sets the database version.

  **Parameters:**
  
  - `version` (number): New version number for the database.

  **Returns:**
  
  - `Promise<any>`: Promise resolving to information about the operation.

---

### `init(scheme: ItScheme, version: number): void`

- Initializes the database schema.

  **Parameters:**
  
  - `scheme` (ItScheme): Database schema.
  - `version` (number): New version number for the database.

---

### `table(tableName: string): QueryBuilder`

- Gets a `QueryBuilder` for the specified table.

  **Parameters:**
  
  - `tableName` (string): Name of the table.

  **Returns:**
  
  - `QueryBuilder`: Instance of `QueryBuilder`.

---

## ResultSet Type

### `insertId?: number`

- **Type:** `number | undefined`
- **Description:** The ID of the last inserted row, if applicable.

---

### `rowsAffected: number`

- **Type:** `number`
- **Description:** The number of rows affected by the query.

---

### `rows: any[]`

- **Type:** `any[]`
- **Description:** An array containing the result rows of the query.

---

## QueryBuilder Class

### `constructor(database: DB, tableName: string)`

- Initializes the `QueryBuilder` instance.

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

### `get(): Promise<ResultSet>`

- Executes the SELECT query and returns a promise resolving to the result.

  **Returns:**
  
  - `Promise<ResultSet>`: Promise resolving to the result of the query.

---

### `insert(values: Record<string, any>): Promise<ResultSet>`

- Executes the INSERT query and returns a promise resolving to the result.

  **Parameters:**
  
  - `values` (Record<string, any>): Object containing column-value pairs to insert.

  **Returns:**
  
  - `Promise<ResultSet>`: Promise resolving to the result of the query.

---

### `update(values: Record<string, any>): Promise<ResultSet>`

- Executes the UPDATE query and returns a promise resolving to the result.

  **Parameters:**
  
  - `values` (Record<string, any>): Object containing column-value pairs to update.

  **Returns:**
  
  - `Promise<ResultSet>`: Promise resolving to the result of the query.

---

### `delete(): Promise<ResultSet>`

- Executes the DELETE query and returns a promise resolving to the result.

  **Returns:**
  
  - `Promise<ResultSet>`: Promise resolving to the result of the query.

---

## Model Class

### Static Properties

#### `datebasaName: string`

- **Type:** `string`
- **Description:** Name of the database. Throws an error if not defined.

---

#### `tableName: string`

- **Type:** `string`
- **Description:** Name of the table. Throws an error if not defined.

---

#### `primaryKey: string`

- **Type:** `string`
- **Default:** `"id"`
- **Description:** Primary key of the table. Defaults to `"id"`.

---

### Constructor

#### `constructor(props: any = {})`

- Initializes a new instance of the model.

  **Parameters:**
  
  - `props` (any): Object containing properties to set on the model instance.

---

### Instance Methods

#### `getProperties(): any`

- Gets all properties of the model instance.

  **Returns:**
  
  - `any`: Object containing all properties of the model instance.

---

#### `setProperties(props: any)`

- Sets properties on the model instance.

  **Parameters:**
  
  - `props` (any): Object containing properties to set on the model instance.

---

#### `save(): Promise<any | undefined>`

- Saves the model instance to the database. Creates a new record if the primary key is not set; otherwise, updates the existing record.

  **Returns:**
  
  - `Promise<any | undefined>`: Promise resolving to the saved or updated record.

---

#### `destroy(): Promise<number>`

- Deletes the model instance from the database.

  **Returns:**
  
  - `Promise<number>`: Promise resolving to the number of affected rows.

---

### Static Methods

#### `executeSql(sql: string, params: any[] = []): Promise<ResultSet>`

- Executes a raw SQL query on the database.

  **Parameters:**
  
  - `sql` (string): SQL query.
  - `params` (any[]): Parameters for the SQL query. Default is an empty array.

  **Returns:**
  
  - `Promise<ResultSet>`: Promise resolving to the result of the query.

---

#### `all(): Promise<any[]>`

- Retrieves all records from the table.

  **Returns:**
  
  - `Promise<any[]>`: Promise resolving to an array of records.

---

#### `findBy(column: string, op: string, value: string): Promise<any | undefined>`

- Finds a record by a specified column and value.

  **Parameters:**
  
  - `column` (string): Name of the column to search.
  - `op` (string): Comparison operator (e.g., "=", "<>", "LIKE").
  - `value` (string): Value to search for.

  **Returns:**
  
  - `Promise<any | undefined>`: Promise resolving to the found record.

---

#### `find(id: any): Promise<any | undefined>`

- Finds a record by its primary key.

  **Parameters:**
  
  - `id` (any): Value of the primary key.

  **Returns:**
  
  - `Promise<any | undefined>`: Promise resolving to the found record.

---

#### `first(): Promise<any | null>`

- Retrieves the first record from the table.

  **Returns:**
  
  - `Promise<any | null>`: Promise resolving to the first record.

---

#### `last(): Promise<any | null>`

- Retrieves the last record from the table.

  **Returns:**
  
  - `Promise<any | null>`: Promise resolving to the last record.

---

#### `count(): Promise<number>`

- Counts the number of records in the table.

  **Returns:**
  
  - `Promise<number>`: Promise resolving to the count of records.

---

#### `query(options: QueryOptions = {}): Promise<any[]>`

- Executes a query with specified options.

  **Parameters:**
  
  - `options` (QueryOptions): Options for the query.

  **Returns:**
  
  - `Promise<any[]>`: Promise resolving to an array of records.

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
  
  - `Promise<number>`:

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
