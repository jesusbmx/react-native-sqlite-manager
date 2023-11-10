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

Only available from version `0.2.7`

### Select
```js
// SELECT id, name, color FROM tb_animals 
// WHERE age > 8 AND age < 12
// ORDER BY name ASC 
// LIMIT 30 OFFSET 60
const rows = db.table('tb_animals')
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
const insertId = db.table('tb_animals')
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
const rowsAffected = db.table('tb_animals')
  .where("id = ?", [7])
  .update({
    name: 'Bob',
  })
```

### Delete
```js
// DELETE FROM tb_animals WHERE id = 8
const rowsAffected = db.table('tb_animals')
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


## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
