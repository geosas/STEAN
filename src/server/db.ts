/**
 * Knex.js database connection for PostgreSQL.
 *
 * @see https://knexjs.org/
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 */

import { Knex } from "knex";
import { _CONFIGFILE } from "./configuration";
import { getConnection } from "./db/helpers/";

const createConnections = (): { [key: string]: Knex<any, unknown[]> } => {
    const returnValue: { [key: string]: Knex<any, unknown[]> } = {};
    Object.keys(_CONFIGFILE).forEach((key: string) => {
        const tempConnection = getConnection(key);
        if (tempConnection) returnValue[key] = tempConnection;
    });
    return returnValue;
};

export const db = createConnections();
