/**
 * verifyId.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { Knex } from "knex";

/**
 *
 * @param dbContext koa db connection
 * @param idInput bigint or bigint[]
 * @param tableSearch name of the table to search ID(s)
 * @returns boolean
 */

export const verifyId = async (dbContext: Knex | Knex.Transaction, idInput: bigint | bigint[], tableSearch: string): Promise<boolean> => {
    try {
        const query: Knex.QueryBuilder = dbContext(tableSearch);
        if (typeof idInput == "bigint") {
            const returnValue = await query.select("id").where({ id: idInput }).first();
            return returnValue ? true : false;
        } else {
            const returnValue = await query.count().whereIn("id", idInput.map(String));
            return Object.values(idInput).length == returnValue[0].count;
        }
    } catch (error) {
        return false;
    }
};
