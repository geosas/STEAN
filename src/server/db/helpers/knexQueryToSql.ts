/**
 * knexQueryToSql.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

/**
 *
 * @param query: Knex.QueryBuilder
 * @returns a string with bindings datas
 */

import { Knex } from "knex";

export const knexQueryToSql = (query: Knex.QueryBuilder): string => {
    const tempSqlNative = query.toSQL().toNative();
    let sql = tempSqlNative.sql;

    tempSqlNative.bindings.forEach((Element: any, index: number) => {
        sql = sql.split(`$${index + 1}`).join(Element);
    });

    return sql;
};
