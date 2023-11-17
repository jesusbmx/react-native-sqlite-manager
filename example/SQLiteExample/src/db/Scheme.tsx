import { DB, ItScheme } from 'react-native-sqlite-manager';
import Animal from '../model/Animal';

export default class Scheme extends ItScheme {
    
  /**
   * When the database is created
   * @param db
   */
  async onCreate(db: DB) {
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

  /**
   * When the database is created
   * @param db
   */
  async onPostCreate(db: DB) {
    await Animal.create({
      name: 'Bob',
      color: 'Brown',
      age: 2,
      timestamp: Date.now(),
    })

    await Animal.create({
      name: 'Dog',
      color: 'black',
      age: 3,
      timestamp: Date.now(),
    })

    await Animal.create({
      name: 'Tiger',
      color: 'orange',
      age: 5,
      timestamp: Date.now(),
    })

    await Animal.create({
      name: 'Panda',
      color: 'black and white',
      age: 8,
      timestamp: Date.now(),
    })

    await Animal.create({
      name: 'Elephant',
      color: 'gray',
      age: 10,
      timestamp: Date.now(),
    })
  }
}