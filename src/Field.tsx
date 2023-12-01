import type { ColumnType } from "./ColumnType";
import type Model from "./Model";

// Defining a union type for supported column types
export type Type = 
  'INTEGER' |
  'FLOAT' |
  'TEXT' |
  'NUMERIC' |
  'DATE' |
  'DATETIME' |
  'BOOLEAN' |
  'JSON';

module Field {

  export function setProperties(obj: Model, props: any): any {
    const model = obj.constructor as typeof Model;
    const cm = model.columnMapping;

    Object.keys(cm).forEach((k) => {
      const columnType = cm[k] as ColumnType

      if (props[k] !== undefined) {
        const val = Field.propertyToModelValue(columnType.type, props[k]);
        Field.setProperty(obj, k, val);
        
      } else if (columnType.default && Field.isFunction(columnType.default)) {
        const val = columnType.default()
        Field.setProperty(obj, k, val);

      } else {
        Field.setProperty(obj, k, null);
      }
    });

    return obj;
  }

  // Helper function to set a property on an object
  export function setProperty(obj: any, key: string, value: any): void {
    obj[key] = value;
  }

  // Function to convert resource values to a database-friendly format
  export function toDatabaseValue(
    columnMapping: { [s: string]: ColumnType },
    resource: any
  ): any {
    resource = sanitize(columnMapping, resource)
    
    return Object.entries(resource).reduce((o, [key, value]) => {
      // Check if the column is defined in the mapping
      if (columnMapping[key]) {
        // Access the column type and convert the value
        const columnType = columnMapping[key] as ColumnType;
        const databaseValue = propertyToDatabaseValue(columnType.type, value);
        // Set the converted value on the output object
        setProperty(o, key, databaseValue);
      }
      return o;
    }, {});
  }

  // Function to convert property values to a database-friendly format based on type
  export function propertyToDatabaseValue(
    type: Type, 
    value: any
  ): any {
    switch (type) {
      case 'JSON':
        return JSON.stringify(value);
      case 'BOOLEAN':
        return value ? 1 : 0;
      // If the type is not specified, return the value as is
      default:
        return value;
    }
  }

  // Function to convert resource values back to a model-friendly format
  export function toModelValue(
    columnMapping: { [s: string]: ColumnType },
    obj: any
  ): any {
    return Object.entries(columnMapping).reduce((o, [key, value]) => {
      // Check if the property exists in the input object and if the type is defined
      if (obj.hasOwnProperty(key) && value.type) {
        // Access the column type and convert the value
        const modelValue = propertyToModelValue(value.type, obj[key]);
        // Set the converted value on the output object
        setProperty(o, key, modelValue);
      }
      return o;
    }, {});
  }

  // Function to convert property values to a model-friendly format based on type
  export function propertyToModelValue(type: Type, value: any) {
    switch (type) {
      case 'JSON':
        // Parse JSON if it's a string, otherwise return the value as is
        return (typeof value === 'string') && JSON.parse(value ?? null) || value;
      case 'BOOLEAN':
        // Convert the value to a boolean
        return Boolean(value);
      case 'INTEGER':
      case 'FLOAT':
      case 'NUMERIC':
        // Convert numeric values to numbers, handling null or undefined cases
        return (value?.toString()?.length) ? Number(value) : null;
      // If the type is not specified, return the value as is
      default:
        return value;
    }
  }

  export const isFunction = (p: any) =>
    Object.prototype.toString.call(p) === '[object Function]'

  export function sanitize(
    columnMapping: { [s: string]: ColumnType },
    obj: any
  ) {
    const allowedKeys = Object.keys(columnMapping)
    return Object.keys(obj).reduce((ret, key) => {
      return allowedKeys.includes(key) ? { ...ret, [key]: obj[key] } : ret
    }, {})
  }
}

// Exporting the functions as a module
export default Field