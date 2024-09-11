import type DB from "./DB";

/**
 * Esquema para la base de datos
 */
export default abstract class ItMigration {

  abstract onCreate(db: DB): void;

  onPostCreate(_db: DB) {

  }

  onUpdate(_db: DB, _oldVersion: number, _newVersion: number) {

  }
  
  onPostUpdate(_db: DB, _oldVersion: number, _newVersion: number) {
      
  }

}