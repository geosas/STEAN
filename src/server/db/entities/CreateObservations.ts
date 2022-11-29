/**
 * Observations entity.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { Knex } from "knex";
import koa from "koa";
import { Common } from "./common";
import { _DBDATAS } from "../constants";
import { message } from "../../logger";
import { ICsvColumns, ICsvFile, IKeyValues, IReturnResult } from "../../types";
import { importCsv, renameProp, verifyId } from "../helpers";
import { stringToBool } from "../../helpers";
import { _CONFIGFILE } from "../../configuration";

interface convert {
    key: string;
    value: string;
}

export class CreateObservations extends Common {
    constructor(ctx: koa.Context, knexInstance?: Knex | Knex.Transaction) {
        super(ctx, knexInstance);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    testValue(inputValue: any): convert | undefined {
        if (inputValue != null && inputValue !== "" && !isNaN(Number(inputValue.toString()))) return { key: "resultnumber", value: inputValue.toString() };
        else if (typeof inputValue == "object") return { key: "resultnumbers", value: `{"${Object.values(inputValue).join('","')}"}` };
    }

    async add(dataInput: IKeyValues[]): Promise<IReturnResult | undefined> {
        message(true, "HEAD", `class ${this.constructor.name} override add`);
        const returnValue: string[] = [];
        let total = 0;
        if (this.ctx._datas) {
            const extras = this.ctx._datas;
            const datasJson = JSON.parse(extras["datas"]);

            if (!datasJson["columns"]) this.ctx.throw(404, { detail: "No columns parameters found" });
            if (!datasJson["duplicates"]) datasJson["duplicates"] = true;

            const myColumns: ICsvColumns[] = [];
            const testDatastreamID: bigint[] = [];
            const testFeatureOfInterestID: bigint[] = [];
            Object.keys(datasJson["columns"]).forEach((element: string) => {
                // the ID one is default created ID
                const tempFoiId = datasJson["columns"][element].featureOfInterest ? datasJson["columns"][element].featureOfInterest : "1";
                myColumns.push({
                    column: element,
                    datastream: datasJson["columns"][element].datastream,
                    featureOfInterest: tempFoiId
                });
                testDatastreamID.push(BigInt(datasJson["columns"][element].datastream));
                if (BigInt(tempFoiId) > 1) testFeatureOfInterestID.push(BigInt(tempFoiId));
            });

            const paramsFile: ICsvFile = {
                tempTable: `temp${Date.now().toString()}`,
                filename: extras["file"],
                columns: myColumns,
                header: datasJson["header"] && datasJson["header"] == true ? ", HEADER" : "",
                dataStreamId: BigInt(extras["nb"]),
                duplicates: stringToBool(datasJson["duplicates"])
            };

            const testDatastream = await verifyId(Common.dbContext, testDatastreamID, _DBDATAS.Datastreams.table);

            if (!testDatastream) {
                message(true, "INFO", "test Datastream ID", testDatastreamID);
                this.ctx.throw(404, {
                    detail: testDatastreamID.length > 0 ? `No id found for : ${testDatastreamID}` : `One of id not found for : ${testDatastreamID}`
                });
            }

            const testFeatureOfInterest = await verifyId(Common.dbContext, testFeatureOfInterestID, _DBDATAS.FeaturesOfInterest.table);

            if (!testFeatureOfInterest) {
                message(true, "INFO", "test FeatureOfInterest ID", testFeatureOfInterestID);
                this.ctx.throw(404, {
                    detail:
                        testFeatureOfInterestID.length > 0
                            ? `No id found for : ${testFeatureOfInterestID}`
                            : `One of id not found for : ${testFeatureOfInterestID}`
                });
            }

            await importCsv(this.ctx, Common.dbContext, paramsFile, {
                host: _CONFIGFILE[this.ctx._configName].pg_host,
                user: _CONFIGFILE[this.ctx._configName].pg_user,
                password: _CONFIGFILE[this.ctx._configName].pg_password,
                database: _CONFIGFILE[this.ctx._configName].pg_database,
                port: Number(_CONFIGFILE[this.ctx._configName].pg_port)
            }).then((res) => {
                total = res.length;
                res.forEach((element: string) => returnValue.push(this.linkBase.replace("CreateObservations", "Observations") + "(" + element + ")"));
            });

            message(true, "INFO", "importCsv", "OK");
        } else {
            const dataInsert: [Record<string, unknown>] = [{}];
            const dataStreamId: string = dataInput["Datastream"]["@iot.id"];

            const DatastreamIdExist = await verifyId(Common.dbContext, BigInt(dataStreamId), _DBDATAS.Datastreams.table);
            if (!DatastreamIdExist) {
                this.ctx.throw(404, { detail: `No id found for : ${dataStreamId}` });
            }

            dataInput["dataArray"].forEach((element: IKeyValues) => {
                const temp: IKeyValues = {
                    datastream_id: Number(dataStreamId)
                };
                
                dataInput["components"].forEach((title: string, index: number) => {
                    if (title == "result") {
                        const test = this.testValue(element[index]);
                        if (test) temp[test.key] = test.value;
                    } else temp[title] = element[index];
                });
                dataInsert.push(renameProp("FeatureOfInterest/id", "featureofinterest_id", temp));
            });
            try {
                const tempQuery = await Common.dbContext("observation")
                    .insert(dataInsert.filter((elem) => Object.keys(elem).length))
                    .returning("*");

                tempQuery
                    .map((elem: { [key: string]: number }) => elem["id"])
                    .forEach((element: number) => {
                        // only Observations keep in returnValue
                        returnValue.push(this.linkBase.replace("Create", "") + "(" + element + ")");
                    });
                return this.createReturnResult({
                    total: total,
                    body: returnValue
                });
            } catch (error) {
                this.returnError(error);
            }
        }
        if (returnValue) {
            return this.createReturnResult({
                total: total,
                body: returnValue
            });
        }
    }
}
