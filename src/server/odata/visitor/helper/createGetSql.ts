/**
 * createGetSql.
 *
 * @copyright 2022-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { createQuerySelectString, queryAsDataArray, queryAsGraphData, queryAsJson } from ".";
import { isGraph, _DBDATAS } from "../../../db/constants";
import { PgVisitor } from "../PgVisitor";

 export function createGetSql(main: PgVisitor): string {   
    const count = main.timeSeries ? false : true;
    main.includes.forEach((includesItem) => {
        if (includesItem.navigationProperty.includes("/")) {                
            const names = includesItem.navigationProperty.split("/");
            includesItem.navigationProperty = names[0];
            const visitor = new PgVisitor({...main.options});
            if (visitor) {
                visitor.entity =names[0];
                visitor.select = "*";
                visitor.where = "1 = 1";
                visitor.orderby = "id, ";
                visitor.navigationProperty = names[1];
                includesItem.includes.push(visitor);
            }
        };
    });  
        
    main.includes.forEach((item) => item.asGetSql());

    let fields:string[] = [];

    if (isGraph(main)) {    
        const table = _DBDATAS[main.parentEntity ? main.parentEntity: main.getEntity()].table;
        fields =  [`(select ${table}."description" from ${table} where ${table}."id" = ${main.parentId ? main.parentId: main.id}) AS title, `];
    } 
    
    const temp = createQuerySelectString(main, main)
    switch (main.resultFormat.name.toUpperCase()) {        
        case "DATAARRAY" : return queryAsDataArray(main.ArrayNames, temp, false, count, fields);
        case "CSV" : return queryAsDataArray(main.ArrayNames, temp, false, false, fields);
        case "GRAPHDATAS" : return queryAsGraphData(main, temp);
        default : return queryAsJson(temp, false, count, fields);
    }
}