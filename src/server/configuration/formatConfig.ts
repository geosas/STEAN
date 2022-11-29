/**
 * formatConfig.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { IConfigFile } from "../types";
import util from "util";
import { _APIVERSION } from "../constants";

export function formatConfig(input: JSON, name?: string): IConfigFile {
    const returnValue = {
        name: name ? name : input["pg_database"] || "ERROR",
        port: input["port"] ? +input["port"] : -1,
        pg_host: input["pg_host"] || "ERROR",
        pg_port: input["pg_port"] ? +input["pg_port"] : 5432,
        pg_user: input["pg_user"] || "ERROR",
        pg_password: input["pg_password"] || "ERROR",
        pg_database: name && name === "test" ? "test" : input["pg_database"] || "ERROR",
        apiVersion: input["apiVersion"] || _APIVERSION,
        date_format: input["date_format"] || "DD/MM/YYYY hh:mi:ss",
        webSiteDoc: input["webSiteDoc"] || "no web site",
        nb_page: input["nb_page"] ? +input["nb_page"] : 200,
        lineLimit: input["lineLimit"] ? +input["lineLimit"] : 2000,
        destroy: input["destroy"] || false,
        seed: name === "test" ? true : input["seed"] || false,
        forceHttps: input["forceHttps"] ? input["forceHttps"] : false,
        pg_migrate: input["pg_migrate"] ? Number(input["pg_migrate"]) : -1
    };
    if (Object.values(returnValue).includes("ERROR"))
        throw new TypeError(`Error in config file [${util.inspect(returnValue, { showHidden: false, depth: null })}]`);

    return returnValue;
}
