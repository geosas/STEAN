/**
 * createQuery.
 *
 * @copyright 2022-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { createSql, getColumnsList, queryAsJson } from ".";
import { isSingular, _DBDATAS } from "../../../db/constants";
import { TimeSeries } from "../../../db/helpers";
import { getEntityName } from "../../../helpers";
import { message } from "../../../logger";
import { PGQuery, PgVisitor } from "../PgVisitor";


export function createQuerySelectString(main: PgVisitor, element: PgVisitor): string { 
    message(true, "HEAD", "createQuerySelectString");  
    const tempPgQuery = createQuerySelectPGQuery(main, element);
    if (!tempPgQuery) return "ERROR";
    const sql = createSql(tempPgQuery);
    if (main.timeSeries) {
        const series = new TimeSeries(sql);
        const tmpSql = series.createSql(main.timeSeries);
        return tmpSql ? tmpSql : "Error timeseries SQL";
    }
    return sql;
}

export function createQuerySelectPGQuery(main: PgVisitor, element: PgVisitor): PGQuery | undefined { 
    message(true, "HEAD", "createQuerySelectPGQuery");  
    // get the name of the entity
    const realEntity = element.relation ? element.relation : element.getEntity() ;
    if(realEntity) {
        // create select column
        if (element.select.trim() == "") element.select = "*";
        
        const select: string[] | undefined =  getColumnsList(realEntity, main, element);    
        if(select) {
            const realEntityName = getEntityName(realEntity);
            if (realEntityName) {
            const relations: string[] = Object.keys(_DBDATAS[realEntityName].relations);                      
                element.includes.forEach((item) => {                                
                    const name = item.navigationProperty;                                                
                    const index = relations.indexOf(name);
                    if (index >= 0) {
                        item.setEntity(name);
                        item.where += `${item.where.trim() == "" ? '' : " AND "}${_DBDATAS[realEntityName].relations[name].expand}`;                                                            
                        relations[index] = `(${queryAsJson(createQuerySelectString(main,item), isSingular(name), false)}) AS "${name}"`;
                        main.addToArrayNames(name);
                    }
                });
                relations.forEach((rel: string) => {
                    if (rel[0] == "(") select.push(rel);
                    else if (element.showRelations == true && main.ref == false && !main.timeSeries ) {
                        const temTable = getEntityName(rel);
                        if (temTable) {
                            select.push(`CONCAT('${main.options.rootBase}${_DBDATAS[realEntityName].name}(', "${_DBDATAS[realEntityName].table}"."id", ')/${rel}') AS "${rel}@iot.navigationLink"`);
                        }
                    }
                });

                return { 
                    select: select.join(",\n\t"), 
                    from: _DBDATAS[realEntityName].table , 
                    where: element.where, 
                    groupBy: element.groupBy.join(",\n\t"), 
                    orderby: element.orderby,
                    skip: element.skip,
                    limit: element.limit
                };
            }    
        }
    }
    return undefined;
}