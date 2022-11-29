/**
 * Protected Routes for API.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import Router from "koa-router";
import { apiAccess, userAccess } from "../db/dataAccess";
import { _DBADMIN, _DBDATAS } from "../db/constants";
import { upload } from "../helpers";
import fs from "fs";
import koa from "koa";
import { checkPassword, emailIsValid, testRoutes } from "./helpers";
import { message } from "../logger";
import { IConfigFile, IKeyString, IReturnResult, returnFormatString } from "../types";
import { DefaultState, Context } from "koa";

import { db } from "../db";
import { CreateHtmlView } from "../views/helpers/CreateHtmlView";
import { formatConfig } from "../configuration";
import { decodeToken, loginUser, Rights } from "../types/user";
import { createIqueryFromContext } from "../views/helpers/";
import { queryHtmlPage } from "../views/query";
import { createDatabase } from "../db/helpers";
import { createOdata } from "../odata";
import { makeRootName } from ".";

export const protectedRoutes = new Router<DefaultState, Context>();

protectedRoutes.post("/(.*)", async (ctx: koa.Context, next) => {
    const token = decodeToken(ctx);
    // ROOT
    const root = makeRootName(ctx);    
    
    switch (testRoutes(ctx.path).toUpperCase()) {
        case "LOGIN":
            if (token) ctx.redirect(`${root}/status`);
            await loginUser(ctx).then((user: any) => {
                if (user) {
                    ctx.status = 200;
                    if (ctx.request.header.accept && ctx.request.header.accept.includes("text/html")) ctx.redirect(`${root}/Status`);
                    else
                        ctx.body = {
                            message: "login succeeded",
                            user: user.username,
                            token: user.token
                        };
                } else {
                    ctx.throw(401);
                }
            });
            return;

        case "REGISTER":
            if (token && token.PDCUAS[Rights.UserCreate] === true) {
            }
            const body = ctx.request.body;
            const isObject = typeof body != "string";
            const why: IKeyString = {};
            // Username
            if (isObject && body["username"].trim() === "") {
                why["username"] = "Empty username";
            } else {
                const user = await db["admin"].table("user").select("username").where({ username: ctx.request.body["username"] }).first();
                if (user) why["username"] = "Already present";
            }
            // Email
            if (isObject && body["email"].trim() === "") {
                why["email"] = "Empty email";
            } else {
                if (emailIsValid(body["email"]) === false) why["email"] = "Invalid email";
            }
            // Password
            if (isObject && body["password"].trim() === "") {
                why["password"] = "Empty password";
            }
            // Repeat password
            if (isObject && (body["repeat"] as string).trim() === "") {
                why["repeat"] = "Empty repeat password";
            } else {
                if (body["password"] != body.repeat) {
                    why["repeat"] = "Password are different";
                } else {
                    if (checkPassword(body["password"]) === false) why["password"] = "Invalid password";
                }
            }

            if (Object.keys(why).length === 0) {
                try {
                    await userAccess.add(ctx.request.body);
                } catch (error) {
                    ctx.redirect(`${root}/error`);
                }
            } else {
                const createHtml = new CreateHtmlView(ctx);
                ctx.type = returnFormatString.HTML;
                ctx.body = createHtml.login({ login: false, body: ctx.request.body, why: why });
            }
            return;

        case "USER":
            const user = await userAccess.update(ctx.request.body);
            if (user) {
                ctx.login(user);
                ctx.redirect(`${root}/admin`);
            } else {
                ctx.status = 400;
                ctx.redirect(`${root}/error`);
            }
            return;

        case "CREATEDB":
            message(true, "HEAD", "POST createDB");
            const conParams: IConfigFile = formatConfig(ctx.request.body);
            if (Object.values(conParams).includes("ERROR")) throw new TypeError(`Error in config file [${conParams}]`);
            // ?? TODO
            message(true, "DEBUG", "Params", conParams);
            const returnValue = await createDatabase(conParams.name, ctx);

            if (returnValue) {
                ctx.status = 201;
                ctx.body = returnValue;
            } else {
                ctx.status = 400;
                ctx.redirect(`${root}/error`);
            }
            return;
    }

    if ((token && token.id > 0) || ctx.request.url.includes("/Lora")) {
        if (ctx.request.type.startsWith("application/json") && Object.keys(ctx.request.body).length > 0) {
            const odataVisitor = await createOdata(ctx); 
            if (odataVisitor)  ctx._odata = odataVisitor;
            if (ctx._odata) {
                message(true, "HEAD", "POST JSON");
                const objectAccess = new apiAccess(ctx);
                const returnValue: IReturnResult | undefined | void = await objectAccess.add();
                if (returnValue) {
                    returnFormatString.JSON;
                    ctx.status = 201;
                    ctx.body = returnValue.body ? returnValue.body : returnValue.body;
                }
            } else ctx.throw(400);
        } else if (ctx.request.type.startsWith("multipart/form-data")) {
            // If upload datas
            const getDatas = async (): Promise<IKeyString> => {
                message(true, "HEAD", "getDatas ...");
                return new Promise(async (resolve, reject) => {
                    await upload(ctx)
                        .then((data) => {
                            resolve(data);
                        })
                        .catch((data: any) => {
                            reject(data);
                        });
                });
            };

            ctx._datas = await getDatas();
            const odataVisitor = await createOdata(ctx); 
            if (odataVisitor)  ctx._odata = odataVisitor;
            if (ctx._odata) {
                message(true, "HEAD", "POST FORM");
                const objectAccess = new apiAccess(ctx);
                const returnValue: IReturnResult | undefined | void = await objectAccess.add();
                if (ctx._datas) fs.unlinkSync(ctx._datas.file);
                if (returnValue) {
                    if (ctx._datas["source"] == "query") {
                        const temp = await createIqueryFromContext(ctx);
                        ctx.type = "html";
                        ctx.body = queryHtmlPage({
                            ...temp,
                            results: JSON.stringify({ added: returnValue.total, value: returnValue.body })
                        });
                    } else {
                        returnFormatString.JSON;
                        ctx.status = 201;
                        ctx.body = returnValue.body ? returnValue.body : returnValue.body;
                    }
                } else {
                    ctx.throw(400);
                }
            }
        } else {
            // payload is malformed
            ctx.throw(400, { details: "Payload is malformed" });
        }
    } else {
        ctx.throw(401);
    }
});

protectedRoutes.patch("/(.*)", async (ctx) => {
    const token = decodeToken(ctx);
    if (token && token.PDCUAS[Rights.Post] === true && Object.keys(ctx.request.body).length > 0) {
        const odataVisitor = await createOdata(ctx); 
        if (odataVisitor)  ctx._odata = odataVisitor;
        if (ctx._odata) {
            message(true, "HEAD", "PATCH");
            const objectAccess = new apiAccess(ctx);
            if (ctx._odata.id) {
                const returnValue: IReturnResult | undefined | void = await objectAccess.update(ctx._odata.id);
                if (returnValue) {
                    returnFormatString.JSON;
                    ctx.status = 200;
                    ctx.body = returnValue.body;
                }
            } else {
                ctx.throw(400, { detail: "Id is required" });
            }
        } else {
            ctx.throw(404);
        }
    } else {
        ctx.throw(401);
    }
});

protectedRoutes.delete("/(.*)", async (ctx) => {
    const token = decodeToken(ctx);
    if (token && token.PDCUAS[Rights.Delete] === true) {
        const odataVisitor = await createOdata(ctx); 
        if (odataVisitor)  ctx._odata = odataVisitor;
        if (ctx._odata) {
            message(true, "HEAD", "DELETE");
            const objectAccess = new apiAccess(ctx);
            if (ctx._odata.id) {
                const returnValue: IReturnResult | undefined | void = await objectAccess.delete(ctx._odata.id);
                if (returnValue && returnValue.id && returnValue.id > 0) {
                    returnFormatString.JSON;
                    ctx.status = 204;
                }
            } else {
                ctx.throw(400, { detail: "Id is required" });
            }
        } else {
            ctx.throw(404);
        }
    } else {
        ctx.throw(401);
    }
});
