/**
 * Odatas Helpers.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { _DBDATAS } from "../../../db/constants";
import { cleanStringComma, removeQuotes } from "../../../helpers";
import { PGQuery, PgVisitor } from "../PgVisitor";

export const createSql = (input: PGQuery): string => `SELECT ${input.select} \n FROM "${input.from}" \n ${input.where ? `WHERE ${input.where}\n` : ''}${input.groupBy ? `GROUP BY ${cleanStringComma(input.groupBy)}\n` : ''}${input.orderby ? `ORDER BY ${cleanStringComma(input.orderby)}\n` : ''}${input.skip && input.skip > 0 ? `OFFSET ${input.skip}\n` : ''} ${input.limit && input.limit > 0 ? `LIMIT ${input.limit}\n` : ''}`;

const key = (searchId: string):string =>  `select jsonb_agg(tmp.elements -> 'name') as keys from ( select jsonb_array_elements("unitOfMeasurements") as elements from multidatastream where id = ${searchId}) as tmp`;
export const  queryAsGraphData = (input: PgVisitor, query: string): string => {  
    switch (input.parentEntity) {
        case _DBDATAS.MultiDatastreams.name:
            let sql:string[] = [];
            return `with source as (${query}) ,\n results as (select ${sql.join(",\n")} from source),\n key as (${key(<string>input.parentId)})
            select (select multidatastream."name" from multidatastream where multidatastream."id" = 1) AS title, 'result' as "keys", array_agg(id) as "ids", json_object_agg('result', results.mario) as "values", array_agg(date) as "dates"  from source, results;
            `;
        case _DBDATAS.Datastreams.name:
            return `with source as (\n${query}\n),\nresults as (select array_agg(("result" #>> '{result}')::float) as mario from source)\nselect \n\t(select datastream."description" from datastream where datastream."id" = 1) AS title,\n\t'result' as "keys",\n\tarray_agg(id) as "ids",\n\tjson_object_agg('result', results.mario) as "values",\n\tarray_agg(date) as "dates"\n\tfrom source, results;`
        default:
            return "";
    }    
}
export const  queryAsDataArray = (zobi: { [key: string]: string } , query: string, singular: boolean, count: boolean, fields?: string[]): string => {  
    const sqlString = `SELECT (ARRAY['${Object.keys(zobi).map((e:string) => removeQuotes(e)).join("','")}']) as "component", array_agg(pipo) as "dataArray" FROM (SELECT  json_build_array(${Object.values(zobi).join()}) as pipo FROM (${query}) as p) as l`;
    return queryAsJson(sqlString, singular, false, fields);

}

export const  queryAsJson = (query: string, singular: boolean, count: boolean, fields?: string[]): string => {  
    const returnJson: string = singular === true ? "ROW_TO_JSON" : "json_agg";
    const returnNull: string = singular === true ? "{}" : "[]";
    return `SELECT \n${count == true ? "count(t),\n" : ""} ${fields ? fields.join(",\n") : ""}coalesce(${returnJson}(t),\n '${returnNull}') AS results FROM (${query}) as t`;
};

export { createGetSql } from "./createGetSql";
export { createPostSql } from "./createPostSql";
export { createQuerySelectString, createQuerySelectPGQuery } from "./createQuery";
export { getColumnsList } from "./getColumnsList";
export { oDatatoDate } from "./oDatatoDate";
