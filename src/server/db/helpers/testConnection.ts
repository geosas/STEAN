/**
 * testConnection.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { Knex } from "knex";
import { message } from "../../logger";

export const testConnection = async (instance: Knex<any, unknown[]>): Promise<boolean> => {
    message(true, "INFO", "testConnection", instance.toString());

    await instance.raw("select 1+1 as result").catch((err) => {
        message(true, "ERROR", "testConnection", err);
        return false;
    });
    message(true, "INFO", "testConnection", "OK");

    return true;
};
