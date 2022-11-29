/**
 * getColumnsList.
 *
 * @copyright 2022-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { isGraph, observationResulAlias, _DBDATAS } from "../../../db/constants";
import { getEntityName, goodName, removeQuotes } from "../../../helpers";
import { PgVisitor } from "../PgVisitor";

export function getColumnsList(tableName: string, main: PgVisitor, element: PgVisitor): string[] | undefined  {
    tableName = tableName.trim();
    if (tableName == "") return;  
    const name = getEntityName(tableName);
    if (!name) return; 
    const graph = isGraph(main);

    const returnValue: string[] = graph == true ? ["id", `to_char("resultTime", 'YYYY-MM-DD HH:mi') as "date"`] : [];
    const isSelect =  (element.select && element.select != "*") || false;
    const cols =  isSelect ?  element.select.split(",").filter((word: string) => word.trim() != "") : Object.keys(_DBDATAS[name].columns).filter((word) => !_DBDATAS[name].excludeColumn.includes(word) && !word.startsWith("_") && !word.endsWith("_id") );
    if (graph == false ) { 
        cols.forEach((elem: string) => {                    
            elem = removeQuotes(elem);
            if(element.ref == true ) {
                returnValue.push(`CONCAT('${main.options.rootBase}${_DBDATAS[name].name}(', "${_DBDATAS[name].table}"."id", ')') AS "@iot.selfLink"`);                 
            } else if (elem.startsWith("result") && !main.splitResult && main.resultFormat.name === 'DATAARRAY') {
                main.addToArrayNames("result", main.parentEntity === _DBDATAS.MultiDatastreams.name ? `"result"` : `("result" #>> '{result}')::float`);  
            } else {   
                if (element.getEntity() === _DBDATAS.Logs.name) {
                    returnValue.push(`CONCAT('${main.options.rootBase}${_DBDATAS.Logs.name}(', "${_DBDATAS.Logs.table}"."id", ')') AS "@iot.selfLink"`);                 
                }                
                if (_DBDATAS[name].columns.hasOwnProperty(elem)) {
                    let alias = _DBDATAS[name].columns[elem].alias;
                    if (main.id && alias) alias = alias.replace(/[$ID]+/g, <string>main.id) ;
                    returnValue.push(`${alias ? alias : `"${elem}"`}`);
                    
                    if (elem === "id" && (element.showRelations == true || ["DATAARRAY", "CSV"].includes(main.resultFormat.name))) {
                        if (["DATAARRAY", "CSV"].includes(main.resultFormat.name)) {
                            returnValue.push(`"${_DBDATAS[name].table}"."id" AS "id"`); 
                            main.addToArrayNames("id");            
                        } else returnValue.push(`CONCAT('${main.options.rootBase}${_DBDATAS[name].name}(', "${_DBDATAS[name].table}"."id", ')') AS "@iot.selfLink"`);    
                    }  else  main.addToArrayNames(elem); 
                } else if (_DBDATAS[name].relations[elem]) {
                    const tempTable = getEntityName(elem);
                    returnValue.push(`CONCAT('${main.options.rootBase}${_DBDATAS[name].name}(', "${_DBDATAS[name].table}"."id", ')/${tempTable}') AS "${tempTable}@iot.navigationLink"`);                 
                } 
            }
        });   
    }
    if (tableName === _DBDATAS.Observations.name && element.ref == false ) {
        if (element.splitResult) element.splitResult.forEach((elem: string) => {
            const alias: string = goodName(element.splitResult && element.splitResult.length === 1 ? "result" : elem);
            returnValue.push(
                `"resultnumbers"[(select position from  multidatastream, jsonb_array_elements("multidatastream"."unitOfMeasurements") with ordinality arr(elem, position) where id = "multidatastream_id" and elem->>'name' = '${elem}')] as "${alias}"`
                );  
                main.addToArrayNames(alias);
                             
            }); else {           
            
            returnValue.push(observationResulAlias(_DBDATAS[name].table));
            if (isSelect === false) {
                element.groupBy = cols.map(e => `"${_DBDATAS[name].table}"."${e}"`);
                element.groupBy.push(`"${_DBDATAS[name].table}"."resultnumber"`,`"${_DBDATAS[name].table}"."datastream_id"`, `"${_DBDATAS[name].table}"."resultnumbers"`,`"${_DBDATAS[name].table}"."multidatastream_id"`);
                    // main.addToArrayNames("result", main.parentEntity === _DBDATAS.MultiDatastreams.name ? `"result"` : `("result" #>> '{result}')::float`);  

            } else  if (![_DBDATAS.MultiDatastreams.name, _DBDATAS.Datastreams.name].includes(tableName)) {                
                    element.groupBy = cols.map(e => `"${_DBDATAS[name].table}".${e}`);                            
                    element.groupBy.push(`"${_DBDATAS[name].table}"."id"`);
                    element.groupBy.push(`"${_DBDATAS[name].table}"."resultnumber"`,`"${_DBDATAS[name].table}"."datastream_id"`, `"${_DBDATAS[name].table}"."resultnumbers"`,`"${_DBDATAS[name].table}"."multidatastream_id"`);
                    // if(element.select.includes('result')) main.addToArrayNames("result",`"result"->>'result'`);
            }
        }
    }
    return returnValue;
}