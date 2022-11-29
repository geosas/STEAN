/**
 * Locations entity.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { Knex } from "knex";
import koa from "koa";
import { Common } from "./common";

export class Locations extends Common {
    constructor(ctx: koa.Context, knexInstance?: Knex | Knex.Transaction) {
        super(ctx, knexInstance);
    }
}
