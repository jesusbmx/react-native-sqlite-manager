import { Model } from 'react-native-sqlite-manager';

export default class Animal extends Model {

  static get datebasaName(): string {
    return 'example.db'
  }

  static get tableName(): string {
    return 'tb_animals'
  }
}