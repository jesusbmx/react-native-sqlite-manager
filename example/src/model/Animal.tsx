import { Model } from 'react-native-sqlite-manager';

export default class Animal extends Model {
  public id: number;
  public name: string;
  public color: string;
  public age: number;
  public timestamp: number;

  constructor(props: any = {}) {
    super(props)
  }

  static get databasaName(): string {
    return 'example.db'
  }

  static get tableName(): string {
    return 'tb_animals'
  }

  print() {
    console.debug("Animal.print", this.name)
  }
}