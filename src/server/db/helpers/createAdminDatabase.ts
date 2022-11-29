/**
 * createAdminDatabase.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import knex from "knex";
import koa from "koa";
import { createTable } from ".";
import { _CONFIGFILE } from "../../configuration";
import { db } from "../../db";
import { asyncForEach } from "../../helpers";
import { encrypt } from "../../helpers/";
import { message } from "../../logger";
import { _DBADMIN, _DBDATAS } from "../constants";
import { IUser } from "../interfaces";

 
 export const createAdminDatabase = async(configName: string, ctx?: koa.Context): Promise<{ [key: string]: string }> => {
    message(true, "HEAD", "createAdminDatabase", "createDatabase");

    // init result
    const configFile = _CONFIGFILE[configName];
    const returnValue = { "Start create Database": configFile.pg_database };

    // create blank DATABASE
    const myAdminConnection = knex({
        client: "pg",
        connection: {
            host: _CONFIGFILE["admin"]["pg_host"],
            user: _CONFIGFILE["admin"]["pg_user"],
            password: _CONFIGFILE["admin"]["pg_password"],
            database: "postgres",
            port: _CONFIGFILE["admin"]["pg_port"] ? +String(_CONFIGFILE["admin"]["pg_port"]) : -1
        },
        pool: { min: 0, max: 7 },
        debug: false
    });

    if (myAdminConnection)
        await myAdminConnection
            .raw(`CREATE Database ${configFile.pg_database}`)
            .then(async () => {
                returnValue["create Admin DB"] = "✔";
                returnValue["User"] = await myAdminConnection
                    .raw(`select count(*) FROM pg_user WHERE usename = '${configFile.pg_user}';`)
                    .then(async (res) => {
                        if (res.rowCount < 1) {
                            message(false, "INFO", "Create User", configFile.pg_user);
                            return myAdminConnection
                                .raw(`CREATE ROLE ${configFile.pg_user} WITH PASSWORD '${configFile.pg_password}' SUPERUSER;`)
                                .then(() => {
                                    myAdminConnection.destroy();
                                    return "Create User ✔";
                                })
                                .catch((err: Error) => err.message);
                        } else {
                            message(false, "INFO", "Update User", configFile.pg_user);
                            return await myAdminConnection
                                .raw(`ALTER ROLE ${configFile.pg_user} WITH PASSWORD '${configFile.pg_password}' SUPERUSER;`)
                                .then(() => {
                                    myAdminConnection.destroy().catch((err: Error) => err.message);
                                    myAdminConnection.destroy();
                                    return "Update User ✔";
                                })
                                .catch((err: Error) => err.message);
                        }
                    });
            })
            .catch((err: Error) => err.message);

    // create tables
    await asyncForEach(Object.keys(_DBADMIN), async (keyName: string) => {
        await createTable(db["admin"], _DBADMIN[keyName], undefined);
    });

    // CREATE USER
    const user: IUser = {
        username: configFile.pg_user,
        email: "default@email.com",
        password: configFile.pg_password,
        database: "all",
        canPost: true,
        canDelete: true,
        canCreateUser: true,
        canCreateDb: true,
        superAdmin: false,
        admin: false
    };

    await db["admin"].table("user").insert({
        username: user.username,
        email: user.email,
        password: encrypt(user.password),
        database: user.database || "all",
        canPost: user.canPost || false,
        canDelete: user.canDelete || false,
        canCreateUser: user.canCreateUser || false,
        canCreateDb: user.canCreateDb || false,
        superAdmin: user.superAdmin || false,
        admin: user.admin || false
    });
    return returnValue;
}
