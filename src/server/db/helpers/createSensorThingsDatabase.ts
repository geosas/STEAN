/**
 * createSensorThingsDatabase.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import koa from "koa";
import { createTable, testConnection } from ".";
import { _CONFIGFILE } from "../../configuration";
import { db } from "../../db";
import { asyncForEach } from "../../helpers";
import { logDebug, message } from "../../logger";
import { _DBDATAS } from "../constants";
import { datasDemo } from "../createDBDatas/datasDemo";
import { triggers } from "../createDBDatas/triggers";
 
 export const createSensorThingsDatabase = async(configName: string, ctx?: koa.Context): Promise<{ [key: string]: string }> => {
     message(true, "HEAD", "createDatabase", "createDatabase");
     const configFile = _CONFIGFILE[configName];
     const connDb = db[configName];

     // init result
    const  returnValue: { [key: string]: string } = { "Start create Database": configFile.pg_database };

    // Test connection Admin
    if (!testConnection(db["admin"])) {
        returnValue["DROP Error"] = "No Admin connection";
        return returnValue;
    }

    // in case of test always destroy DB
    if (configFile.pg_database === "test" || (configFile.destroy && configFile.destroy == true)) {
        returnValue[`DROP Database`] = await db["admin"]
            .raw(`DROP Database IF EXISTS ${configFile.pg_database}`)
            .then(() => "✔")
            .catch((err: Error) => err.message);
    }

    // create blank DATABASE
    await db["admin"]
        .raw(`CREATE Database ${configFile.pg_database}`)
        .then(async () => {
            returnValue[`Create Database`] = `${configFile.pg_database} ✔`;
            // create USER if not exist
            await db["admin"].raw(`select count(*) FROM pg_user WHERE usename = '${configFile.pg_user}';`).then(async (res) => {
                if (res.rowCount < 1) {
                    returnValue[`Create ROLE ${configFile.pg_user}`] = await db["admin"]
                        .raw(`CREATE ROLE ${configFile.pg_user} WITH PASSWORD '${configFile.pg_password}' SUPERUSER;`)
                        .then(() => "✔")
                        .catch((err: Error) => err.message);
                } else {
                    await db["admin"]
                        .raw(`ALTER ROLE ${configFile.pg_user} WITH PASSWORD '${configFile.pg_password}' SUPERUSER;`)
                        .then(() => {
                            returnValue[`Create/Alter ROLE`] = `${configFile.pg_user} ✔`;
                            db["admin"]
                                .destroy()
                                .then(() => {
                                    returnValue[`Admin connection destroy`] = "✔";
                                })
                                .catch((err: Error) => {
                                    returnValue[`Admin connection destroy`] = "✖";
                                    message(false, "ERROR", err.message);
                                });

                        })
                        .catch((err: Error) => {
                            logDebug(err);
                            message(false, "ERROR", err.message);
                        });
                }
            });
        })
        .catch((err: Error) => {
            logDebug(err);
            message(false, "ERROR", err.message);
        });

    // create postgis
    returnValue[`Create postgis`] = await connDb
        .raw("CREATE EXTENSION IF NOT EXISTS postgis;")
        .then(() => "✔")
        .catch((err: Error) => err.message);

    returnValue[`Create tablefunc`] = await connDb
        .raw("CREATE EXTENSION IF NOT EXISTS tablefunc;")
        .then(() => "✔")
        .catch((err: Error) => err.message);

    // create tables
    // const _DATAS = configFile.createUser && configFile.createUser == true ? _DBADMIN : _DBDATAS;
    await asyncForEach(Object.keys(_DBDATAS), async (keyName: string) => {
        await createTable(connDb, _DBDATAS[keyName], undefined);
    });

    returnValue["Create functions & trigger"] = await connDb
        .raw(triggers)
        .then(() => "✔")
        .catch((e) => e);
    if  (configName.toUpperCase() === "TEST" ||  (ctx && ctx.request.body.seed && ctx.request.body.seed === true)){
        datasDemo().forEach(async (sql: string) => {
            returnValue["Seed"] = await connDb
                .raw(sql)
                .then(() => "✔")
                .catch((e) => {
                    console.log(e);
                    return e;
                });
        });
    }

    await connDb.raw(`select count(*) FROM pg_user WHERE usename = '${configFile.pg_user}';`).then(() => {
        returnValue["Create DB"] = "✔";
    });
    
    return returnValue;
}