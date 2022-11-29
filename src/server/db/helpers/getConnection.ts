/**
 * Knex.js database client and query builder for PostgreSQL.
 *
 * @see https://knexjs.org/
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 */

import knex, { Knex } from "knex";
import { createConnection } from "../../configuration";
import { IDbConnection } from "../../types";

export const getConnection = (configName: string): Knex<any, unknown[]> => {
    const connection: IDbConnection = createConnection(configName);
    return knex({
        client: "pg",
        connection: connection,
        pool: { min: 0, max: 7 },
        debug: false
    });
};
