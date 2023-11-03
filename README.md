# react-native-sqlite-manager

Tool that simplifies management and access to SQLite databases in React Native applications

#### Dependencies
```sh
react-native-sqlite-storage
```

## Installation

```sh
npm install react-native-sqlite-manager
```

## Getting Started
Initialize the database in your React Native application as follows:

```js
import { DB } from 'react-native-sqlite-manager';

function App(): JSX.Element {

  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    setLoading(true)

    const db = DB.get(/*name*/ "myApp.db")
    db.init(new Scheme(), /*version*/ 1).then(() => {
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

## Defining the Schema
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
      SELECT id, name, color FROM tb_animals 
      WHERE age > ? AND age < ?
    `, [
      8, 12
    ])
    return row
  }
  
}

```

## Select
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

## Insert, Update, Delete
```js
// INSERT INTO tb_animals(name, color, age, timestamp) 
// VALUES("Bob", "Brown", 2, 1699018870505)
const createdAnimal = await Animal.create({
  name: 'Bob',
  color: 'Brown',
  age: 2,
  timestamp: Date.now(),
})

// UPDATE tb_animals SET name = "Bob" WHERE id = 7
const updatedAnimal = await Animal.update({
  id: 7,
  name: 'Bob',
})

// DELETE FROM tb_animals WHERE id = 8
await Animal.destroy(8)

const animalById = await Animal.find(1)
animalById.age = 12
await animalById.save()
```

## Database Select
```js
const db = DB.get('myApp.db')

await db.open()

// SELECT id, name, color FROM tb_animals 
// WHERE age > 8 AND age < 12
// ORDER BY name ASC 
// LIMIT 30 OFFSET 60
const animalsByQuery = await db.select('tb_animals', {
  columns: 'id, name, color',
  where: {
    clause: 'age > ? AND age < ?',
    args: [ 8, 12 ],
  },
  page: 3,
  limit: 30,
  order: 'name ASC'
})

// RAW Query
const { rows } = await db.executeSql(`
  SELECT id, name, color FROM tb_animals 
  WHERE age > ? AND age < ?
  ORDER BY name ASC 
  LIMIT 30 OFFSET 60
`, [
  8, 12
])
```

## Database Insert, Update, Delete
```js

// INSERT INTO tb_animals(name, color, age, timestamp) 
// VALUES("Bob", "Brown", 2, 1699018870505)
const insertId = await db.insert('tb_animals', {
  name: 'Bob',
  color: 'Brown',
  age: 2,
  timestamp: Date.now(),
})

// UPDATE tb_animals SET name = "Bob" WHERE id = 7
const rowsAffected = await db.update('tb_animals', {
  name: 'Bob',
}, {
  clause: 'id = ?',
  args: [7]
})

// DELETE FROM tb_animals WHERE id = 8
const rowsAffected = await db.delete('tb_animals', {
  clause: 'id = ?',
  args: [8]
})
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
