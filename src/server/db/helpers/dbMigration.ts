/**
 * dbMigration.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { createTable } from ".";
import { _ENV_VERSION } from "../../constants";
import { db } from "../../db";
import { asyncForEach } from "../../helpers";
import {  message } from "../../logger";
import { IColList } from "../../types";
import { _DBDATAS, _POSGRESTOJS } from "../constants";
import { dbSchemaList } from ".";

export let _DBMIGRATION: { [key: string]: Object } | undefined = {
    "1.1.0": {
        "1.0.0": {
            Decoders : {
                datas: `insert into "decoder" ("name", "code") values ('RHF1S001', '{const input = "DATAINPUT"; const nomenclature = NOMENCLATURE; const decoded = { valid: true, err: 0, payload: input, messages: [] }; const temp = input.match(/.{1,2}/g); if (temp != null) { if (temp[0] == "01" || temp[0] == "81") { decoded.messages.push({ type: "report_telemetry", measurementName: nomenclature["0610"], measurementValue: (parseInt(String(temp[2]) + String(temp[1]), 16) * 175.72) / 65536 - 46.85 }); decoded.messages.push({ type: "report_telemetry", measurementName: nomenclature["0710"], measurementValue: (parseInt(temp[3], 16) * 125) / 256 - 6 }); decoded.messages.push({ type: "upload_battery", measurementName: nomenclature["period"], measurementValue: parseInt(String(temp[5]) + String(temp[4]), 16) * 2 }); decoded.messages.push({ type: "upload_battery", measurementName: nomenclature["voltage"], measurementValue: (parseInt(temp[8], 16) + 150) * 0.01 }); return decoded; } } decoded["valid"] = false; decoded["err"] = -1; return decoded;}')`
            },
            Loras : {
                datas: `INSERT INTO public.lora ("name", "description", "deveui", "decoder_id", multidatastream_id) SELECT name, description, properties->>'deveui' as deveui, 1 as decoder_id ,(select multidatastream.id from multidatastream where thing_id = thing.id limit 1) as multidatastream_id from thing` },
            all: {
                datas: [
                    `ALTER TABLE "multidatastream" DROP COLUMN IF EXISTS "phenomenonTimeStart", DROP COLUMN IF EXISTS "phenomenonTimeEnd", DROP COLUMN IF EXISTS "resultTimeStart", DROP COLUMN IF EXISTS "resultTimeEnd";`,
                    `ALTER TABLE "datastream" DROP COLUMN IF EXISTS "phenomenonTimeStart", DROP COLUMN IF EXISTS "phenomenonTimeEnd", DROP COLUMN IF EXISTS "resultTimeStart", DROP COLUMN IF EXISTS "resultTimeEnd";`
                ],
            }
        }
    }
};

const getDataType = (input: string): string => _POSGRESTOJS[input.split(" ")[0].trim().toLowerCase()];

 
 export const dbMigration = async(connectName: string):Promise<boolean> => {    
    const dbSchema = await dbSchemaList(connectName);
    const version = await db[connectName]
    .table("config")
    .select("version")
    .limit(1)     
    .then((res: any) => res[0].version)  
    .catch((err: any) =>  err.code == "42P01" ? "1.0.0" : "0");
    const newVersion = _ENV_VERSION;    
    const isSameVersion = (version === newVersion);

    if (!isSameVersion) message(false, "HEAD", `migration from ${version} TO`, newVersion);

    if (!["ADMIN"].includes(connectName.toUpperCase())) {     
        await asyncForEach(Object.keys(_DBDATAS).filter((e: string) => _DBDATAS[e].migrationTest === true), async (entity: string) => {
            if (_DBDATAS[entity].table.trim() != "") {
                const dbSchemaItem = Object(dbSchema).filter((e: IColList) => e.tablename === _DBDATAS[entity].table);                
                const cols = Object(dbSchemaItem).map((e: IColList) => e.column_name);                
                if (cols.length > 0 ) {
                    Object.keys(_DBDATAS[entity].columns).forEach(async (col: string) => {
                        const typeCol: IColList = Object(dbSchemaItem).filter((e: IColList) => e.column_name === col)[0];                        
                        if (_DBDATAS[entity].columns[col].create != "" && !cols.includes(col)) {
                            message(false, "ENV", "not found column", `${col} in ${entity}`);
                            if (newVersion && _DBMIGRATION) {
                                    const myObject = _DBMIGRATION[newVersion] && _DBMIGRATION[newVersion][version] ? _DBMIGRATION[newVersion][version][entity].columns[col] : _DBMIGRATION[newVersion][Object.keys(_DBMIGRATION[newVersion])[0]];
                                    if (myObject && myObject.create) message(false, "ENV", `Create column ${col}  for ${entity}`, 
                                        await db[connectName].raw(myObject.create)  
                                        .then(() =>  "✔")
                                        .catch((err: any) => err)); 
                                }  
                            } else if (typeCol && getDataType(_DBDATAS[entity].columns[col].create) != typeCol.data_type.split(" ")[0].toLowerCase()) {
                                // TODO
                                console.log(`column : ${col} => ${_DBDATAS[entity].columns[col].create} in ${entity} Has different type [${typeCol.data_type.split(" ")[0].toLowerCase()}]`);
                            }
                   });
                } else {
                    message(false, "ENV", "not found table", `for ${entity}`);                    
                    if (newVersion && _DBMIGRATION) {
                        const datas =  _DBMIGRATION[newVersion] && _DBMIGRATION[newVersion][version] && _DBMIGRATION[newVersion][version][entity] && _DBMIGRATION[newVersion][version][entity].datas ? _DBMIGRATION[newVersion][version][entity].datas : undefined;                      
                        message(false, "ENV", `Create table for ${entity}`,
                            await createTable(db[connectName], _DBDATAS[entity], datas)
                            .then(() => "✔")
                            .catch((err: any) => err)); 
                    } 
                }
            }
        });
        if (newVersion && _DBMIGRATION) {
            const myObject = _DBMIGRATION[newVersion] && _DBMIGRATION[newVersion][version] && _DBMIGRATION[newVersion][version]["all"] ? _DBMIGRATION[newVersion][version]["all"].datas: undefined;
            if(myObject)
                await asyncForEach(myObject, async (entity: string) => {
                    if(entity) {
                        message(false, "ENV", `Execute script`,
                        await await db[connectName].raw(entity)
                        .then(() => "✔")
                        .catch((err: any) => err)); 
                    }
                });
        }
    }

    // Update version config
    if (!isSameVersion) {
        db[connectName].table("config")
        .truncate()                                     
        .then(async (res:any) => {
             message(false, "ENV", "Update config",await db[connectName].table("config")
            .insert({version: newVersion})                                     
            .then(() => "✔")
            .catch((err: any) => err)); 
        })
        .catch((err: any) => { console.log(err); });
    }
    return true
 }

 export const clearDbMigration = () => _DBMIGRATION = undefined;    

