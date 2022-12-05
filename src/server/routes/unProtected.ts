/**
 * Unprotected Routes for API.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import Router from "koa-router";
import { apiAccess, userAccess } from "../db/dataAccess";
import { _DBDATAS } from "../db/constants";
import { ConfigCtx, returnBody } from "../helpers";
import { adminHtml } from "../views/admin";
import fs from "fs";
import { message } from "../logger";
import { IKeyValues, IReturnResult, returnFormatString } from "../types";
import { _APIVERSION } from "../constants";
import { queryHtmlPage } from "../views/query";
import { CreateHtmlView, createIqueryFromContext,  } from "../views/helpers/";
import { testRoutes } from "./helpers";
import { DefaultState, Context } from "koa";
import { graphHtml } from "../views/graph";
import { decodeToken, ensureAuthenticated, getAuthenticatedUser, Rights } from "../types/user";
import { createDatabase } from "../db/helpers";
import { createOdata } from "../odata";

export const unProtectedRoutes = new Router<DefaultState, Context>();

// ALl others
unProtectedRoutes.get("/(.*)", async (ctx) => {
    const token = decodeToken(ctx);  

    switch (testRoutes(ctx.path).toUpperCase()) {
        case ctx._version.toUpperCase():
            let expectedResponse: Record<string, unknown>[] = [{}];
            // in _DBDATAS use order to order list entities
            const entities = Object.keys(_DBDATAS)
                .filter((elem: string) => _DBDATAS[elem].order > 0)
                .sort((a, b) => (_DBDATAS[a].order > _DBDATAS[b].order ? 1 : -1));

            entities.forEach((value: string) => {
                expectedResponse.push({
                    name: _DBDATAS[value].name,
                    url: `${ctx._linkBase}/${ctx._version}/${value}`
                });
            });
            ctx.type = returnFormatString.JSON;
            ctx.body = {
                value: expectedResponse.filter((elem) => Object.keys(elem).length)
            };
            break;

        case "FAVICON.ICO":
            try {
                const icon = fs.readFileSync(__dirname + "/favicon.ico");
                const cacheControl = `public, max-age=${8640}`;
                ctx.set("Cache-Control", cacheControl);
                ctx.type = returnFormatString.ICON;
                ctx.body = icon;
            } catch (e) {
                if (e instanceof Error) message(false, "ERROR", e.message);
            }
            return;

        case "ERROR":
            const createHtmlError = new CreateHtmlView(ctx);
            ctx.type = returnFormatString.HTML;
            ctx.body = createHtmlError.error("what ?");
            return;

        case "REGISTER":
            const createHtmlRegister = new CreateHtmlView(ctx);
            ctx.type = returnFormatString.HTML;
            ctx.body = createHtmlRegister.login({ login: false });
            return;

        case "LOGOUT":
            ctx.cookies.set("jwt-session");
            if (ctx.request.header.accept && ctx.request.header.accept.includes("text/html")) ctx.redirect(`${ctx._rootName}/login`);
            else ctx.status = 200;
            ctx.body = {
                message: "Logout succeeded"
            };
            return;

        case "ADMIN":
            if (token?.PDCUAS[Rights.SuperAdmin] === true) {
                ctx.type = returnFormatString.HTML;
                ctx.body = adminHtml(ctx);
            } else ctx.redirect(`${ctx._rootName}/login`);
            return;

        case "LOGIN":
            if (ensureAuthenticated(ctx)) ctx.redirect(`${ctx._rootName}/status`);
            else {
                const createHtml = new CreateHtmlView(ctx);
                ctx.type = returnFormatString.HTML;
                ctx.body = createHtml.login({ login: true });
            }
            return;

        case "ALL":
            if (token?.PDCUAS[Rights.SuperAdmin] === true) {
                ctx.type = returnFormatString.JSON;
                ctx.body = await userAccess.getAll();
            }
            return;

        case "INFOS":
            ctx.type = returnFormatString.JSON;
            ctx.body = ConfigCtx(ctx);
            return;

        case "STATUS":
            if (ensureAuthenticated(ctx)) {
                const user = await getAuthenticatedUser(ctx);
                if (user) {
                    const createHtml = new CreateHtmlView(ctx);
                    ctx.type = returnFormatString.HTML;
                    ctx.body = createHtml.status(user);
                    return;
                }
            }
            ctx.redirect(`${ctx._rootName}/login`);
            return;

        case "QUERY":
            const temp = await createIqueryFromContext(ctx);
            ctx.set("script-src", "self");
            ctx.set("Content-Security-Policy", "self");
            ctx.type = returnFormatString.HTML;
            ctx.body = queryHtmlPage(temp);
            return;

        case "USER":
            // Only to get user Infos
            const id = ctx.url.toUpperCase().match(/[0-9]/g)?.join("");

            if (id && token?.PDCUAS[Rights.SuperAdmin] === true) {
                const user = await userAccess.getSingle(id);
                const createHtml = new CreateHtmlView(ctx);
                ctx.type = returnFormatString.HTML;
                ctx.body = createHtml.edit({ body: user });
            }
            return;

        case "CREATEDB":
            message(true, "HEAD", "GET createDB");
            const returnValue = await createDatabase("test", ctx);

            if (returnValue) {
                ctx.status = 201;
                ctx.body = returnValue;
            } else {
                ctx.status = 400;
                ctx.redirect(`${ctx._rootName}/error`);
            }
            return;
    }
    // API REQUEST
    if (ctx.path.includes(`/${_APIVERSION}`)) {
        const odataVisitor = await createOdata(ctx); 
        if (odataVisitor)  ctx._odata = odataVisitor;
        if (ctx._odata) {
            message(true, "HEAD", `GET ${_APIVERSION}`);
            const objectAccess = new apiAccess(ctx);
            if (objectAccess) {
                if (ctx._odata.entity && Number(ctx._odata.id) === 0) {
                    const returnValue = await objectAccess.getAll();
                    if (returnValue) {
                        if (returnValue.body) {
                            ctx.type = ctx._odata.resultFormat.value;
                            ctx.body = returnBody(returnValue.body, ctx._odata.resultFormat.name);
                        } else {
                            ctx.type = ctx._odata.resultFormat.value;
                            switch (ctx._odata.resultFormat.name) {
                                case "JSON":
                                    ctx.body = returnBody(
                                        {
                                            "@iot.count": returnValue.id?.toString(),
                                            "@iot.nextLink": returnValue.nextLink,
                                            "@iot.prevLink": returnValue.prevLink,
                                            value: returnValue["value"]
                                        } as IKeyValues,
                                        ctx._odata.resultFormat.name
                                    );
                                    break;
                                case "GRAPH":
                                    ctx.type = returnFormatString.HTML;
                                    ctx.body = graphHtml(ctx, returnValue.value);
                                    break;
                                case "GRAPHDATAS":                                    
                                    ctx.body = returnBody(returnValue["value"] as IKeyValues, ctx._odata.resultFormat.name);
                                    break;

                                default:
                                    ctx.body = returnBody(returnValue["value"] as IKeyValues, ctx._odata.resultFormat.name);
                                    break;
                            }
                        }
                    } else ctx.throw(404);
                } else if (
                    (ctx._odata.id && typeof ctx._odata.id == "bigint" && ctx._odata.id > 0) ||
                    (typeof ctx._odata.id == "string" && ctx._odata.id != "")
                ) {
                    
                    const returnValue: IReturnResult | undefined = await objectAccess.getSingle(
                        ctx._odata.id
                    );

                    if (returnValue && returnValue.body) {
                        ctx.type = ctx._odata.resultFormat.value;
                        ctx.body = returnBody(returnValue.body, ctx._odata.resultFormat.name);
                    } else
                        ctx.throw(404, {
                            detail: `id : ${ctx._odata.id} not found`
                        });
                } else ctx.throw(400);
            }
        } 
    } else {
        const createHtml = new CreateHtmlView(ctx);
        ctx.body = await createHtml.infos();
    }
});
