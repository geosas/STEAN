/**
 * writeToLog.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import koa from "koa";
import { _DBADMIN } from "../db/constants";
import { getUserId } from "../helpers";
import { db } from "../db";
import { logDebug } from ".";

export const clearLog = async (ctx: koa.Context): Promise<void> => {
    await db["admin"].raw(`delete from ${_DBADMIN.Logs_request.table} where ("url" LIKE '%/Logs%') or (code = '200' and method = 'GET') or date < date_trunc('day', NOW() - interval '3 month') and method = 'GET'`);
}
export const writeToLog = async (ctx: koa.Context): Promise<void> => {
    // if (ctx["LOG"] && ctx._arg && ctx._arg.ENTITY_NAME && ctx._arg.ENTITY_NAME != "Logs") {
    if (ctx["LOG"]) {
        ctx["LOG"].method = ctx["LOG"].method || ctx.method;
        ctx["LOG"].return = ctx["LOG"].method === "GET" ? "" : ctx["LOG"].return || (ctx.body as string);
        ctx["LOG"].code = ctx["LOG"].code || ctx.status;
        ctx["LOG"].url = ctx["LOG"].url || ctx.url;
        ctx["LOG"].port = ctx["LOG"].port || ctx.port;
        ctx["LOG"].database = ctx["LOG"].database || ctx.database;
        ctx["LOG"].user_id = ctx["LOG"].user_id || getUserId(ctx).toString();
        try {
            await db["admin"].table(_DBADMIN.Logs_request.table).insert(ctx.LOG);
        } catch (error) {
            logDebug(error);
        }
    }
};
