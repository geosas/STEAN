/**
 * createConnection.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { _CONFIGFILE } from ".";
import { IDbConnection } from "../types";

/**
 *
 * @param configName name of the config item
 * @returns IDbConnection
 */

export const createConnection = (configName: string): IDbConnection => {
    const returnValue = {
        host: _CONFIGFILE[configName]["pg_host"] || "ERROR",
        user: _CONFIGFILE[configName]["pg_user"] || "ERROR",
        password: _CONFIGFILE[configName]["pg_password"] || "ERROR",
        database: _CONFIGFILE[configName]["pg_database"] || "ERROR",
        port: _CONFIGFILE[configName]["pg_port"] ? +String(_CONFIGFILE[configName]["pg_port"]) : -1
    };
    if (Object.values(returnValue).includes("ERROR")) throw new TypeError(`Error in config file [${returnValue}]`);
    return returnValue;
};
