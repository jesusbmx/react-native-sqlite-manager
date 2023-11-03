import type DB from "./DB";

/**
 * Esquema para la base de datos
 */
export abstract class ItScheme {

  abstract onCreate(db: DB): void;

  onUpdate(_db: DB, _oldVersion: number, _newVersion: number) {

  }
  
  onLoad(_db: DB) {
      
  }

}