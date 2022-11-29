/**
 * createIqueryFromContext Index HTML / JS maker.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

/* eslint-disable quotes */

import koa from "koa";
import { _DBDATAS } from "../../db/constants";
import { getAuthenticatedUser } from "../../types/user";
import { IQuery } from "../constant";

export const createIqueryFromContext = async (ctx: koa.Context): Promise<IQuery> => {
    const user = await getAuthenticatedUser(ctx);
    
    return {
        id: "",
        methods: ["GET"],
        host: ctx._linkBase,
        entity: ctx.originalUrl.endsWith("/Assist") ? ctx.originalUrl.split("/Assist")[0].split("/").reverse()[0] : "undefined",
        version: ctx._version,
        options: ctx.querystring ? ctx.querystring : "",
        user: user
            ? user
            : {
                  id: 0,
                  username: "query",
                  password: "",
                  email: "",
                  database: "",
                  canPost: false,
                  canDelete: false,
                  canCreateUser: false,
                  canCreateDb: false,
                  admin: false,
                  superAdmin: false
              },
              // TODO universal return
        graph: ctx.url.includes("$resultFormat=GRAPH")
    };
};
