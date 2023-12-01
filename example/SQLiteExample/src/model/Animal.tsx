import { Model, ColumnType } from 'react-native-sqlite-manager';

export default class Animal extends Model {

  static get datebasaName(): string {
    return 'example.db'
  }

  static get tableName(): string {
    return 'tb_animals'
  }
 
  static get columnMapping(): { [s: string]: ColumnType } {
    return {
      id: { type: 'INTEGER', primary_key: true },
      name: { type: 'TEXT', not_null: true },
      color: { type: 'TEXT', not_null: true },
      age: { type: 'TEXT', not_null: true },
      timestamp: { type: 'INTEGER', default: () => Date.now() },
    }
  }
}