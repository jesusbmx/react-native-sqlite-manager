// Opciones para el QUERY
export type QueryOptions = {
  columns?: string
  page?: number
  limit?: number
  where?: Where,
  order?: string
}

// Clause Where
export type Where = {
  clause: string,
  args?: any[],
}

// Crea los querys
export module QueryBuilder {

  // SELECT
  export function query(
    tableName: string, 
    options: QueryOptions
  ): string {

    let sqlParts: any[] = [
      'SELECT',
      options.columns ?? "*",
      'FROM',
      tableName,
    ]

    if (options.where) {
      sqlParts.push("WHERE")
      sqlParts.push(options.where.clause)
    }
    
    if (options.order) {
      sqlParts.push("ORDER BY")
      sqlParts.push(options.order)
    }

    if (options.limit) {
      sqlParts.push("LIMIT")
      sqlParts.push(options.limit)

      if (options.page) {
        sqlParts.push("OFFSET")
        sqlParts.push(options.limit * (options.page - 1))
      }
    }

    return sqlParts.filter(p => p !== '').join(' ')
  }

  // Creates the "INSERT" sql statement
  export function create(tableName: string, object: any): string {
    const keys = Object.keys(object)
    const columns = keys.join(', ')
    const values = keys.map(() => '?').join(', ')

    return `INSERT INTO ${tableName} (${columns}) VALUES (${values});`
  }

  // Creates the "INSERT" sql statement
  export function createArray(tableName: string, array: any[]): string {
    if (array.length === 0) {
      throw new Error('array is empty')
    }
  
    const keys = Object.keys(array[0]);
    const columns = keys.join(', ');
  
    //const values = objects.map(() => `(${keys.map(() => '?').join(', ')})`).join(', ');
    const values = array.map(() => {
      const placeholders = keys.map(() => '?').join(', ');
      return `(${placeholders})`;
    }).join(', ');
  
    return `INSERT INTO ${tableName} (${columns}) VALUES ${values};`;
  }

  // Creates the "Update" sql statement
  export function update(tableName: string, object: any, whereClause: string): string {
    // Extrae el valor de "id" y crea un nuevo objeto sin ese dato
    //const { id, ...props } = object
    const values = Object.keys(object)
      .map(k => `${k} = ?`)
      .join(', ')

    return `UPDATE ${tableName} SET ${values} WHERE ${whereClause};`
  }

  // Creates the "DELETE" sql statement
  export function destroy(tableName: string, whereClause: string): string {
    return `DELETE FROM ${tableName} WHERE ${whereClause};`
  }
  
  // Creates the "DELETE ALL" sql statement
  export function destroyAll(tableName: string): string {
    return `DELETE FROM ${tableName};`
  }
  
  /**
   * Compila una clausula where
   * 
   * @param {any[]} array [1,3,4,2]
   * @returns (?, ?, ?, ?)
   */
  export function whereClausePlaceholders(array: any[]): string {
    var args: string[] = [];
    for (let i = 0; i < array.length; i++) {
      args.push("?");
    }
    return "(" + args.join(", ") + ")";
  }
  
  /**
   * @param sqlString "valor con 'comillas'"
   * @returns "'valor con \'comillas\''"
   */
  export function escapeSqlString(sqlString: string, escape = '\''): string {
    var sb: any[] = []
    sb.push(escape);

    if (sqlString.indexOf(escape) != -1) {
      var length: number = sqlString.length;
      for (var i = 0; i < length; i++) {
          var c: string = sqlString.charAt(i);
          if (c == escape) {
            sb.push(escape);
          }
          sb.push(c);
      }
    } else {
      sb.push(sqlString);
    }

    sb.push(escape);
    return sb.join("")
  }
}

export default QueryBuilder