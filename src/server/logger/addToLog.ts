/**
 * addToLog.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import koa from "koa";
import { _DBADMIN } from "../db/constants";
import { IKeyValues } from "../types/keyFile";
import { ILogs } from "../types/logs";

/**
 *
 * @param ctx koa context
 * @param datas to show
 */

export const addToLog = (ctx: koa.Context, datas: IKeyValues): void => {
    if (!ctx["LOG"]) ctx["LOG"] = {} as ILogs;
    Object.keys(datas).forEach((key: string) => {
        ctx["LOG"][key] = datas[key];
    });
};
