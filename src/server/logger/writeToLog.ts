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
import { _CONFIGFILE } from "../configuration";
import { IKeyValue } from "../types";

export const writeToLog = async (ctx: koa.Context, error?: IKeyValue): Promise<void> => {
    if (ctx.method !== "GET" ) {  
        const req = {
            "method" : ctx.method,
            "return" : ctx.body as string,
            "code" : ctx.response.status,
            "url" : ctx.url,
            "database" : ctx._configName,
            "datas" : ctx.request.body as string,
            "user_id" : getUserId(ctx).toString(),
            "query" : ctx._query,
            "error": error && error["error"]
        }      
        try {
            await db["admin"].table(_DBADMIN.Logs_request.table).insert(req);
        } catch (error) {
            logDebug(error);
        }
    }
};
