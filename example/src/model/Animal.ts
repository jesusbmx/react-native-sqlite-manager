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

  print() {
    console.debug("Animal.print", this.name)
  }

  // Sobreescribimos este método sin el genérico T de la clase base
  /*static databaseToModel(databaseValues: any): Animal {
    console.debug("Animal.databaseToModel", databaseValues)
    return new Animal({
      id: databaseValues.id,
      name: databaseValues.name,
      color: databaseValues.color,
      age: databaseValues.age,
      timestamp: databaseValues.timestamp,
    });
  }

  static modelToDatabase(props: any): any {
    console.debug("Animal.modelToDatabase", props)
    return {
      id: props.id,
      name: props.name,
      color: props.color,
      age: props.age,
      timestamp: props.timestamp,
    };
  }*/

}