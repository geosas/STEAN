/**
 * getConfigCtx.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import koa from "koa";
import { getConfigName } from ".";
import { _CONFIGFILE } from "../configuration";
import querystring from "querystring";
import cookieModule from "cookie";
import cookieParser from "cookie-parser";
import { keyApp, _APIVERSION } from "../constants";

/**
 *
 * @param ctx Koa context
 * @returns string or undefined
 */

const getCookie = (serializedCookies: string, key: string) => cookieModule.parse(serializedCookies)[key] ?? false;

const bearerToken = (ctx: koa.Context) => {
    const queryKey = "access_token";
    const bodyKey = "access_token";
    const headerKey = "Bearer";
    const cookie = true;

    if (cookie && !keyApp) {
        throw new Error("[koa-bearer-token]: You must provide a secret token to cookie attribute, or disable signed property");
    }

    const { body, header, query } = ctx.request;

    let count = 0;
    let token;

    if (query && query[queryKey]) {
        token = query[queryKey];
        count += 1;
    }

    if (body && body[bodyKey]) {
        token = body[bodyKey];
        count += 1;
    }

    if (header) {
        if (header.authorization) {
            const parts = header.authorization.split(" ");
            if (parts.length === 2 && parts[0] === headerKey) {
                [, token] = parts;
                count += 1;
            }
        }

        // cookie
        if (cookie && header.cookie) {
            const plainCookie = getCookie(header.cookie, "jwt-session"); // seeks the key
            if (plainCookie) {
                const cookieToken = cookieParser.signedCookie(plainCookie, keyApp);

                if (cookieToken) {
                    token = cookieToken;
                    count += 1;
                }
            }
        }
    }

    // RFC6750 states the access_token MUST NOT be provided
    // in more than one place in a single request.
    if (count > 1) {
        ctx.throw(400, "token_invalid", {
            message: `token MUST NOT be provided in more than one place`
        });
    }

    ctx.request["token"] = token;
};

export const setConfigToCtx = (ctx: koa.Context): void => {
    bearerToken(ctx);

    ctx._version =
        ctx.originalUrl
            .replace(/[//]+/g, "/")
            .split("/")
            .filter((value: string) => value.match(/v{1}\d\.\d/g))[0] || _APIVERSION;

    const temp = getConfigName(ctx);

    if (!temp || temp?.trim() === "" || !Object.keys(_CONFIGFILE).includes(temp.trim().toLowerCase())) throw new Error(`${temp} Not present in config File`);    

    ctx._configName = temp.trim().toLowerCase();

    ctx.querystring = decodeURI(querystring.unescape(ctx.querystring));

    const protocol = ctx.request.headers["x-forwarded-proto"]
        ? ctx.request.headers["x-forwarded-proto"]
        : _CONFIGFILE[ctx._configName].forceHttps && _CONFIGFILE[ctx._configName].forceHttps == true
        ? "https"
        : ctx.protocol;

    ctx._linkBase = ctx.request.headers["x-forwarded-host"]
        ? `${protocol}://${ctx.request.headers["x-forwarded-host"].toString()}`
        : ctx.request.header.host
        ? `${protocol}://${ctx.request.header.host}`
        : "";

    if (!ctx._linkBase.includes(ctx._configName)) ctx._linkBase = ctx._linkBase + "/" + ctx._configName;
    ctx._rootName =  `${ctx._linkBase}/${ctx._version}`;
};
