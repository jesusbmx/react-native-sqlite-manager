import ColumnInfo from "./ColumnInfo";
import DB, { type ResultSet } from "./DB";
import ItScheme from "./ItScheme";
import Model from "./Model";
import QueryBuilder, { type QueryOptions, type Where} from "./QueryBuilder";
import TableInfo from "./TableInfo";

export type {
  QueryOptions,
  Where,
  ResultSet
}

export {
  ColumnInfo,
  DB,
  ItScheme,
  Model,
  QueryBuilder,
  TableInfo
}

export function table(db: DB, tableName: string): TableInfo {
  return new TableInfo(db, tableName)
}
