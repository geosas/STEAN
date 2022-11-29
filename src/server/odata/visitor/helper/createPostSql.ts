/**
 * createPostSql.
 *
 * @copyright 2022-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { Knex } from "knex";
import { createQuerySelectPGQuery, queryAsJson } from ".";
import { _VOIDTABLE } from "../../../constants";
import { _DBDATAS } from "../../../db/constants";
import { getBigIntFromString, getEntityName } from "../../../helpers";
import { logDebug, message } from "../../../logger";
import { IEntity, IKeyValues } from "../../../types";
import { OperationType } from "../../../types/cte";
import { PgVisitor } from "../PgVisitor";



// const createPostQuery(datas: IKeyValues[] | IKeyValues, knexInstance: Knex | Knex.Transaction, main.id?: bigint | string): string {

export function createPostSql(datas: IKeyValues[] | IKeyValues, knexInstance: Knex | Knex.Transaction, main: PgVisitor): string {
    let sqlResult = "";
    const queryMaker: {
        [key: string]: {
            type: OperationType;
            table: string;
            datas: IKeyValues[] | IKeyValues;
            keyId: string;
        };
    } = {};
    const postEntity: IEntity = _DBDATAS[main.getEntity()];
    const postParentEntity: IEntity | undefined = main.parentEntity ? _DBDATAS[main.parentEntity ] : undefined;
    const names: { [key: string]: string } = {
        [postEntity.table]: postEntity.table
    };
    let level = 0;
    
    const allFields = "*";

    const getRelationNameFromEntity = (source: IEntity, from: IEntity): string | undefined => {
        return Object.keys(source.relations).includes(from.name)
        ? from.name
        : Object.keys(source.relations).includes(from.singular)
        ? from.singular
        : undefined;
    };
    
    /**
     *
     * @param query query for the query not in as
     * @returns
     */
    const queryMakerToString = (query: string): string => {
        const returnValue: string[] = [query];
        const links: { [key: string]: string[] } = {};
        const sorting: string[] = [];
        
        Object.keys(queryMaker).forEach((element: string) => {
            Object.keys(queryMaker).forEach((elem: string) => {
                if (JSON.stringify(queryMaker[elem].datas).includes(`select ${element}`)) {
                    if (links[elem]) links[elem].push(element);
                    else links[elem] = [element];
                }
            });
        });
        
        //  pre sorting for some case like multidatastreams
        Object.keys(links).forEach((elem: string) => {
            Object.keys(links).forEach((subElem: string) => {
                if (links[elem].includes(subElem) && !sorting.includes(subElem)) sorting.push(subElem);
            });
        });
        // sorting
        Object.keys(queryMaker).forEach((elem: string) => {
            if (Object.keys(links).includes(elem)) {
                if (!sorting.includes(elem)) sorting.push(elem);
            } else {
                sorting.unshift(elem);
            }
        });
        // LOOP on sorting
        sorting.forEach((element: string) => {
            if (queryMaker[element].datas.hasOwnProperty("@iot.id")) {
                const searchId = queryMaker[element].datas["@iot.id"];
                returnValue.push(
                    `, ${element} AS (select coalesce((select "id" from "${queryMaker[element].table}" where "id" = ${searchId}), ${searchId}) AS id)`
                    );
                } else {
                    const query = knexInstance(queryMaker[element].table);
                    returnValue.push(`, ${element} AS (`);
                    if (main.id) {
                        if (queryMaker[element].type == OperationType.Association)
                        returnValue.push(
                            query
                            .insert(queryMaker[element].datas)
                            .onConflict(Object.keys(queryMaker[element].datas))
                            .merge(queryMaker[element].datas)
                            .whereRaw(`${queryMaker[element].table}.${queryMaker[element].keyId} = ${BigInt(main.id).toString()}`)
                            .toString()
                            );
                            else
                            returnValue.push(
                                query
                                .update(queryMaker[element].datas)
                                .whereRaw(`${queryMaker[element].table}.${queryMaker[element].keyId} = ${BigInt(main.id).toString()}`)
                                .toString()
                                );
                            } else returnValue.push(query.insert(queryMaker[element].datas).toString());
                            
                            returnValue.push(`RETURNING ${postEntity.table == queryMaker[element].table ? allFields : queryMaker[element].keyId})`);
                        }
                    });



        //             const returnQueryMaker = QueryMaker(main);
        //             const myQuery = returnQueryMaker.createQuery({
        //                 mainEntity: postEntity,
        //                 subInput: undefined,
        //     main.id: undefined,
        //     propertyName: undefined,
        //     onlyReferences: false,
        //     oDatas: main
        // });
        // if (myQuery) returnQueryMaker.addToQuery("main", myQuery);
        
        // returnValue.push(returnQueryMaker.createGetQuery(false));
        
        // format object quotes
        return returnValue.join("\n").replace(/\'@/g, "").replace(/\@'/g, "");
    };
    
    /**
     *
     * @param datas datas
     * @param entity entity for the datas if not root entity
     * @param parentEntity parent entity for the datas if not root entity
     * @returns result
     */
    const start = (datas: IKeyValues | IKeyValues[], entity?: IEntity, parentEntity?: IEntity): IKeyValues[] | IKeyValues | undefined => {
        message(true, "HEAD", `start level ${level++}`);
        
        const returnValue = {};
        entity = entity ? entity : postEntity;
        parentEntity = parentEntity ? parentEntity : postParentEntity ? postParentEntity : postEntity;
        
        for (const key in datas) {
            if (entity && !Object.keys(entity.relations).includes(key)) {
                returnValue[key] = typeof datas[key] === "object" ? JSON.stringify(datas[key]) : datas[key];
                delete datas[key];
            }
        }
        /**
         *
         * @param inputNameEntity {string} name of the entity
         * @returns name of th next entity {inputNameEntity1}
         */
        const createName = (inputNameEntity: string): string => {
            let number = 0;
            if (names[inputNameEntity]) {
                const numbers = names[inputNameEntity].match(/[0-9]/g);
                number = numbers !== null ? Number(numbers.join("")) : 0;
            }
            return `${inputNameEntity}${(number + 1).toString()}`;
        };
        
        /**
         *  add or make query entry
         * @param name name
         * @param tableName table nae for insert
         * @param datas datas to insert string if key is send or object
         * @param key key of the value
         */
        const addToQueryMaker = (
            type: OperationType,
            name: string,
            tableName: string,
            datas: string | IKeyValues[] | IKeyValues,
            keyId: string,
            key: string | undefined
            ): void => {
                const isTypeString = typeof datas === "string";
                if (queryMaker.hasOwnProperty(name)) {
                    if (key && isTypeString) {
                        queryMaker[name].datas[key] = datas;
                        queryMaker[name].keyId = keyId;
                    } else if (!isTypeString) {
                        if (queryMaker[name].type == OperationType.Table || queryMaker[name].type == OperationType.Relation)
                        queryMaker[name].datas = Object.assign(queryMaker[name].datas, datas);
                        queryMaker[name].keyId = keyId;
                        
                        if (queryMaker[name].type == OperationType.Association)
                        queryMaker[createName(name)] = {
                            type: queryMaker[name].type,
                            table: queryMaker[name].table,
                            datas: datas,
                            keyId: queryMaker[name].keyId
                        };
                    }
                } else {
                    if (key && isTypeString)
                    queryMaker[name] = {
                        type: type,
                        table: tableName,
                        datas: { [key]: datas },
                        keyId: keyId
                    };
                    else if (!isTypeString)
                    queryMaker[name] = {
                        type: type,
                        table: tableName,
                        datas: datas,
                        keyId: keyId
                    };
                }
            };
            
            /**
             *
             * @param subEntity {IEntity} entity to use
             * @param subParentEntity {IEntity} entity parent
             */
        const addAssociation = (subEntity: IEntity, subParentEntity: IEntity) => {
            message(true, "DEBUG", `addAssociation in ${subEntity.name} for parent`, subParentEntity.name);

            const relationName = getRelationNameFromEntity(subEntity, subParentEntity);
            const parentRelationName = getRelationNameFromEntity(subParentEntity, subEntity);
            
            if (parentRelationName && relationName) {
                const relation = subEntity.relations[relationName];
                const parentRelation = subParentEntity.relations[parentRelationName];
                message(true, "DEBUG", `Found a parent relation in ${subEntity.name}`, subParentEntity.name);
                
                if (relation.tableName == parentRelation.tableName && relation.tableName == subEntity.table) {
                    message(true, "INFO", "Found a relation to do in sub query", subParentEntity.name);
                    const tableName = names[subEntity.table];
                    const parentTableName = names[subParentEntity.table];
                    
                    addToQueryMaker(
                        OperationType.Relation,
                        tableName,
                        subEntity.table,
                        `@(select ${parentTableName}.id from ${parentTableName})@`,
                        parentRelation.tableKey,
                        parentRelation.relationKey
                        );
                    } else if (relation.tableName == parentRelation.tableName) {
                        if (relation.tableName == subParentEntity.table) {
                            const tableName = names[subEntity.table];
                            const parentTableName = names[subParentEntity.table];
                            message(true, "INFO", `Add parent relation ${tableName} in`, parentTableName);
                            
                            addToQueryMaker(
                                OperationType.Relation,
                                parentTableName,
                                subParentEntity.table,
                                `@(select ${tableName}.id from ${tableName})@`,
                                parentRelation.tableKey,
                                relation.relationKey
                                );
                            } else if (relation.tableName != subParentEntity.table && relation.tableName != subEntity.table) {
                                const tableName = names[subEntity.table];
                                const parentTableName = names[subParentEntity.table];
                                message(true, "INFO", `Add Table association ${tableName} in`, parentTableName);
                                addToQueryMaker(
                                    OperationType.Association,
                                    relation.tableName,
                                    relation.tableName,
                                    {
                                        [`${subEntity.table}_id`]: `@(select ${tableName}.id from ${tableName})@`,
                                        [`${subParentEntity.table}_id`]: `@(select ${parentTableName}.id from ${parentTableName})@`
                                    },
                                    relation.tableKey,
                                    undefined
                                    );
                                }
                } else {
                    const tableName = names[subEntity.table];
                    const parentTableName = names[subParentEntity.table];
                    message(true, "INFO", `Add Relation ${tableName} in`, parentTableName);
                    addToQueryMaker(
                        OperationType.Table,
                        parentTableName,
                        subParentEntity.table,
                        {
                            [relation.relationKey]: `@(select ${tableName}.id from ${tableName})@`
                        },
                        relation.tableKey,
                        undefined
                        );
                    }
            }
        };

        /**
         *
         * @param key key Name
         * @param value Datas to process
         */
        const subBlock = (key: string, value: IKeyValues[] | IKeyValues) => {
            const entityNameSearch = getEntityName(key);
            if (entityNameSearch) {
                const newEntity = _DBDATAS[entityNameSearch];
                const name = createName(newEntity.table);
                names[newEntity.table] = name;
                const test = start(value, newEntity, entity);
                if (test) {
                    addToQueryMaker(OperationType.Table, name, newEntity.table, test, "id", undefined);
                    level--;
                }
                if (entity) addAssociation(newEntity, entity);
            }
        };

        // Main loop
        if (entity && parentEntity) {
            for (const key in datas) {
                if (Array.isArray(datas[key])) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    Object.entries(datas[key]).forEach(([_key, value]) => {
                        if (entity && parentEntity && Object.keys(entity.relations).includes(key)) {
                            message(true, "INFO", `Found a relation for ${entity.name}`, key);
                            subBlock(key, value as IKeyValues);
                        } else {
                            message(true, "INFO", `data ${key}`, datas[key]);
                            returnValue[key] = datas[key];
                        }
                    });
                } else if (typeof datas[key] === "object") {
                    if (Object.keys(entity.relations).includes(key)) {
                        message(true, "DEBUG", `Found a object relation for ${entity.name}`, key);
                        subBlock(key, datas[key]);
                    }
                } else returnValue[key] = datas[key];
            }
        }
        return returnValue;
    };


    if (main.parentEntity) {
        const entityName = getEntityName(main.parentEntity);
        message(true, "DEBUG", "Found entity : ", entityName);
        const callEntity = entityName ? _DBDATAS[entityName] : undefined;
        const id: bigint | undefined =
        typeof main.parentId== "string" ? getBigIntFromString(main.parentId) : main.parentId;
        if (entityName && callEntity && id && id > 0) {
            const relationName = getRelationNameFromEntity(postEntity, callEntity);
            if (relationName) datas[relationName] = { "@iot.id": id.toString() };
        }
    }
    const root = start(datas);
    
    if ((names[postEntity.table] && queryMaker[postEntity.table] && queryMaker[postEntity.table].datas) || root === undefined) {
        queryMaker[postEntity.table].datas = Object.assign(root as {}, queryMaker[postEntity.table].datas);
        queryMaker[postEntity.table].keyId = main.id ? "id" : "*";
        sqlResult = queryMakerToString(`WITH "log_request" as (select srid FROM "${_VOIDTABLE}" LIMIT 1)`);
    } else {
        sqlResult = queryMakerToString(
            main.id
            ? root && Object.entries(root).length > 0
            ? `WITH ${postEntity.table} as (${knexInstance(postEntity.table)
                .update(root)
                // TODO is good conversion ?
                .where({ id: main.id.toString() })
                .toString()} RETURNING ${allFields})`
                : `WITH ${postEntity.table} as (${knexInstance(postEntity.table).select().where({ id: main.id.toString() }).toString()})`
                : `WITH ${postEntity.table} as (${knexInstance(postEntity.table).insert(root).toString()} RETURNING ${allFields})`
                );


            }
    const temp = createQuerySelectPGQuery(main, main); 
    sqlResult += queryAsJson(` SELECT ${temp?.select} FROM ${names[postEntity.table]} ${temp && temp.groupBy ? `GROUP BY ${temp.groupBy}` : ''}`, false, false);

    //                 return createSql({select: select.join(","), 
//                                             from: _DBDATAS[realEntityName].table , 
//                                             where: element.where, 
//                                             groupBy: element.groupBy.join(","), 
//                                             orderby: element.orderby,
//                                             skip: element.skip,
//                                             limit: element.limit});

    logDebug(sqlResult);        
    return sqlResult;

}
