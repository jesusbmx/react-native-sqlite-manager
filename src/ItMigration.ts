import type DB from "./DB";

/**
 * Esquema para la base de datos
 */
export default abstract class ItMigration {

  beforeMigration(_db: DB, _oldVersion: number, _newVersion: number) {
    // Implementsed in subclasses
  }

  abstract onCreate(db: DB): void;

  onPostCreate(_db: DB) {
    // Implementsed in subclasses
  }

  onUpdate(_db: DB, _oldVersion: number, _newVersion: number) {
    // Implementsed in subclasses
  }
  
  onPostUpdate(_db: DB, _oldVersion: number, _newVersion: number) {
    // Implementsed in subclasses
  }

  afterMigration(_db: DB, _oldVersion: number, _newVersion: number) {
    // Implementsed in subclasses
  }

}