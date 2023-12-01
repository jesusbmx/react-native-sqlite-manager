import type { Type } from "./Field";

// TODO: add JSON BLOB support
export const customTypes: Record<string, string> = { JSON: 'TEXT' };

// Defining a type for column configurations
export type ColumnType = {
  type: Type;
  not_null?: boolean;
  primary_key?: boolean;
  unique?: boolean;
  default?: () => any;
};

/**
 *  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name TEXT, age INTEGER
 */
export function createTableColumns(columnMapping: { [s: string]: ColumnType }): string {
  return Object.entries(columnMapping)
    .map(([columnName, column]) => {
      const { type, not_null, primary_key, unique, default: defaultValue } = column;
      const typeString = customTypes[type] || type;
      const constraints = [];

      if (not_null) constraints.push('NOT NULL');
      if (primary_key) constraints.push('PRIMARY KEY AUTOINCREMENT');
      if (unique) constraints.push('UNIQUE');

      const defaultValueString = defaultValue ? `DEFAULT ${defaultValue()}` : '';

      return `${columnName} ${typeString} ${constraints.join(' ')} ${defaultValueString}`.trim();
    })
    .join(', ');
}
  