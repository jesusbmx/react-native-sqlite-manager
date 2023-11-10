import DB, { type ResultSet } from './DB';
import { ItScheme } from './ItScheme';
import QueryBuilder, { type QueryOptions, type Where } from './QueryBuilder';
import TableInfo from './TableInfo';
import Column from './Column';
import Model from './Model';

export function table(db: DB, tableName: string): TableInfo {
  return new TableInfo(db, tableName)
}

export type {
  ResultSet, QueryOptions, Where
}

export {
  DB, ItScheme, QueryBuilder, Model, TableInfo, Column
}