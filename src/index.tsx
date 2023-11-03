import DB, { type ResultSet } from './DB';
import { ItScheme } from './ItScheme';
import QueryBuilder, { type QueryOptions, type Where } from './QueryBuilder';
import Table, { Column } from './Table';
import Model, { type Repository } from './Model';

export function table(db: DB, tableName: string): Table {
  return new Table(db, tableName)
}

export type {
  ResultSet, QueryOptions, Where, Repository
}

export {
  DB, ItScheme, QueryBuilder, Model, Table, Column
}