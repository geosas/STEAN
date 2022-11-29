/**
 * isDbExist.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { message } from "../../logger";
import { _DBADMIN } from "../constants";
import { _CONFIGFILE } from "../../configuration";
import { getConnection } from "./getConnection";
import { createDatabase } from ".";

/**
 * 
 * @param connectName name of the connection
 * @param create If not exist create or Not the DATABASE
 * @returns 
 */

export const isDbExist = async (connectName: string, create: boolean): Promise<boolean> => {
    const tempConnection = getConnection(connectName);
    message(false, "DEBUG", "connectName", `--- ${connectName} ---`);
    if (!tempConnection) return false;
    return await tempConnection
        .raw("select 1+1 as result")
        .then(async () => {
            message(false, "INFO", "Database Found", _CONFIGFILE[connectName].pg_database);
            tempConnection.destroy();
            return true;
        })
        .catch(async (err: any) => {
            let returnResult = false;
            if (err.code == "3D000" && create == true) {
                message(false, "DEBUG", "Try create DATABASE", _CONFIGFILE[connectName].pg_database);
                returnResult = await createDatabase(connectName)
                    .then(async () => {
                        message(false, "INFO", "create DATABASE", "OK");
                        return true;
                    })
                    .catch((err: Error) => {
                        message(false, "ERROR", "create DATABASE", err.message);
                        return false;
                    });
            }
            tempConnection.destroy();
            return returnResult;
        });
};
