/**
 * Loras entity.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { Knex } from "knex";
import koa from "koa";
import { Common } from "./common";
import { getBigIntFromString, removeQuotes } from "../../helpers/index";
import {  _DBADMIN, _DBDATAS } from "../constants";
import { _DOUBLEQUOTE, _QUOTEDCOMA, _VOIDTABLE } from "../../constants";
import { message } from "../../logger";
import { decodeLoraPayload } from "../../lora";
import { IKeyValues, IReturnResult } from "../../types";

export class Loras extends Common {
    constructor(ctx: koa.Context, knexInstance?: Knex | Knex.Transaction) {
        super(ctx, knexInstance);
    }

    createListQuery(input: string[], essai: string): string {
        const temp = essai.split("COLUMN");
        return temp[0].concat(_DOUBLEQUOTE, input.join(`"${temp[1]}${temp[0]}"`), _DOUBLEQUOTE, temp[1]);
    }

    async add(dataInput: IKeyValues[], silent?: boolean): Promise<IReturnResult | undefined> {
        message(true, "OVERRIDE", this.constructor.name, "add");
        if (dataInput["Sensor"]) {
            if (!dataInput["deveui"] || dataInput["deveui"] == null) {
                const temp = "deveui is missing or Null";
                if (silent) return this.createReturnResult({ body: temp });
                else this.ctx.throw(400, { detail: temp });
            }
            return await super.add(dataInput);
        }

        if (dataInput["payload_deciphered"] && dataInput["payload_deciphered"] != "") {
            const decodeRaw = decodeLoraPayload(Common.dbContext, dataInput["deveui"], dataInput["payload_deciphered"]);
            dataInput["data"] = { ...decodeRaw, ...dataInput["data"] };
        }

        if (!dataInput["deveui"] || dataInput["deveui"] == null) {
            const temp = "deveui is missing or Null";
            if (silent) return this.createReturnResult({ body: temp });
            else this.ctx.throw(400, { detail: temp });
        }

        if (!dataInput["data"] || dataInput["data"] == null) {
            const temp = "Data is missing or Null";
            if (silent) return this.createReturnResult({ body: temp });
            else this.ctx.throw(400, { detail: temp });
        }     

        const searchMulti = `(select jsonb_agg(tmp.units -> 'name') as keys from ( select jsonb_array_elements("unitOfMeasurements") as units ) as tmp) FROM "${
            _DBDATAS.MultiDatastreams.table
        }" 
            WHERE "${_DBDATAS.MultiDatastreams.table}".sensor_id = (SELECT sensor_id FROM "${_DBDATAS.Loras.table}" WHERE deveui = '${dataInput["deveui"]}' LIMIT 1)`;
        // // Get the multiDatastream
        const tempSql = await Common.dbContext.raw(`SELECT *, ${searchMulti}`);
        const multiDatastream = tempSql.rows[0];

        if (!multiDatastream) {
            const temp = `No multiDatastream found for deveui ${dataInput["deveui"]}`;
            if (silent) return this.createReturnResult({ body: temp });
            else this.ctx.throw(404, { detail: temp });
        }

        // convert all keys in lowercase
        dataInput["data"] = Object.keys(dataInput["data"]).reduce((destination, key) => {
            destination[key.toLowerCase()] = dataInput["data"][key];
            return destination;
        }, {});

        const listOfSortedValues: number | null[] = [];

        multiDatastream.keys.forEach((element: string) => {
            const searchStr = element
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
            listOfSortedValues.push(dataInput["data"][searchStr] ? dataInput["data"][searchStr] : null);
        });

        // If all datas null
        if (listOfSortedValues.filter((word) => word != null).length < 1) {
            const temp = `Data not corresponding [${multiDatastream.keys}]`;
            if (silent) return this.createReturnResult({ body: temp });
            else this.ctx.throw(400, { detail: temp });
        }

        if (listOfSortedValues.filter((word) => word != null).length < 1) {
            const temp = "No Data correspondence found";
            if (silent) return this.createReturnResult({ body: temp });
            else this.ctx.throw(400, { detail: temp });
        }

        const getFeatureOfInterest = getBigIntFromString(dataInput["FeatureOfInterest"]);

        const searchFOI = await Common.dbContext.raw(
            getFeatureOfInterest
                ? `select coalesce((select "id" from "featureofinterest" where "id" = ${getFeatureOfInterest}), ${getFeatureOfInterest}) AS id `
                : `SELECT id FROM ${_DBDATAS.FeaturesOfInterest.table} WHERE id = (SELECT _default_foi FROM "${_DBDATAS.Locations.table}" WHERE id = (SELECT location_id FROM ${_DBDATAS.ThingsLocations.table} WHERE thing_id = (SELECT thing_id FROM ${_DBDATAS.MultiDatastreams.table} WHERE id =${multiDatastream.id})))`
        );

        if (searchFOI["rows"].length < 1) {
            const temp = "No featureofinterest found";
            if (silent) return this.createReturnResult({ body: temp });
            else this.ctx.throw(400, { detail: temp });
        }

        const temp = listOfSortedValues;

        if (temp && typeof temp == "object") {
            const tempLength = Object.keys(temp).length;

            message(true, "DEBUG", "data : Keys", `${tempLength} : ${multiDatastream.keys.length}`);
            if (tempLength != multiDatastream.keys.length) {
                const temp = `Size of list of results (${tempLength}) is not equal to size of keys (${multiDatastream.keys.length})`;
                if (silent) return this.createReturnResult({ body: temp });
                else this.ctx.throw(400, { detail: temp });
            }
        }

        const insertObject = {
            "featureofinterest_id": "(select featureofinterest1.id from featureofinterest1)",
            "multidatastream_id": "(select multidatastream1.id from multidatastream1)",
            "phenomenonTime": `to_timestamp('${dataInput["timestamp"]}','YYYY-MM-DD HH24:MI:SS')::timestamp`,
            "resultTime": `to_timestamp('${dataInput["timestamp"]}','YYYY-MM-DD HH24:MI:SS')::timestamp`,
            "resultnumbers": `array ${removeQuotes(JSON.stringify(listOfSortedValues))}`
        };

        let searchDuplicate = "";
        Object.keys(insertObject)
            .slice(0, -1)
            .forEach((elem: string) => {
                searchDuplicate = searchDuplicate.concat(`"${elem}" = ${insertObject[elem]} AND `);
            });

        searchDuplicate = searchDuplicate.concat(
            `"resultnumbers" = '{${listOfSortedValues
                .map((elem) => {
                    const tmp = JSON.stringify(elem);
                    return tmp == "null" ? tmp : `${tmp}`;
                })
                .join(",")}}'::float8[]`
        );

        const sql = `WITH "${_VOIDTABLE}" as (select srid FROM "${_VOIDTABLE}" LIMIT 1)
            , featureofinterest1 AS (SELECT id FROM "${_DBDATAS.FeaturesOfInterest.table}"
                                     WHERE id = (SELECT _default_foi FROM "${_DBDATAS.Locations.table}" 
                                     WHERE id = (SELECT location_id FROM "${_DBDATAS.ThingsLocations.table}" 
                                     WHERE thing_id = (SELECT thing_id FROM "${_DBDATAS.MultiDatastreams.table}" 
                                     WHERE id =${multiDatastream.id}))))
            , multidatastream1 AS (SELECT id, thing_id, ${searchMulti} LIMIT 1)
            , myValues ( "${Object.keys(insertObject).join(_QUOTEDCOMA)}") AS (values (${Object.values(insertObject).join()}))
            , searchDuplicate as (SELECT * FROM "${_DBDATAS.Observations.table}" WHERE ${searchDuplicate})
            , observation1 AS (INSERT INTO  "${_DBDATAS.Observations.table}" ("${Object.keys(insertObject).join(_QUOTEDCOMA)}") SELECT * FROM myValues
                             WHERE NOT EXISTS (SELECT * FROM searchDuplicate)
                            AND (select id from multidatastream1) IS NOT NULL
                            RETURNING *, resultnumber AS result)
            , result1 as (select (select observation1.id from  observation1)
            , (select multidatastream1."keys" from multidatastream1)
            , (select searchDuplicate.id as duplicate from  searchDuplicate)
            , ${this.createListQuery(
                Object.keys(insertObject),
                "(select observation1.COLUMN from  observation1), "
            )} (select multidatastream1.id from  multidatastream1) as multidatastream, (select multidatastream1.thing_id from multidatastream1) as thing)
             SELECT coalesce(json_agg(t), '[]') AS result FROM result1 as t`;

        this.logDebugQuery(sql);

        return await Common.dbContext
            .raw(sql)
            .then((res: any) => {
                const tempResult = res.rows[0].result[0];

                if (tempResult.id != null) {
                    const resultnumbers = {};
                    tempResult.keys.forEach((elem: string, index: number) => {
                        resultnumbers[elem] = tempResult["resultnumbers"][index];
                    });
                    const result = {
                        "@iot.id": tempResult.id,
                        "@iot.selfLink": `${this.ctx._odata.options.rootBase}Observations(${tempResult.id})`,
                        "phenomenonTime": `"${tempResult.phenomenonTime}"`,
                        "resultTime": `"${tempResult.resultTime}"`,
                        result: resultnumbers
                    };

                    Object.keys(_DBDATAS["Observations"].relations).forEach((word) => {
                        result[`${word}@iot.navigationLink`] = `${this.ctx._odata.options.rootBase}Observations(${tempResult.id})/${word}`;
                    });

                    return this.createReturnResult({
                        body: result,
                        query: sql
                    });
                } else {
                    const temp = "Observation already exist";
                    if (silent) return this.createReturnResult({ body: temp });
                    else this.ctx.throw(400, { detail: temp, link: `${this.ctx._odata.options.rootBase}Observations(${[tempResult.duplicate]})` });
                }
            })
            .catch((err: any) => {
                this.ctx.throw(400, { detail: err.detail });
            });
    }



    async update(idInput: bigint | string, dataInput: IKeyValues[] | undefined): Promise<IReturnResult | undefined> {
        message(true, "OVERRIDE", this.constructor.name, "update");
        return undefined;
    }
}
