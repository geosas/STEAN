/**
 * User interface.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import koa from "koa";
import jsonwebtoken from "jsonwebtoken";
import { userAccess } from "../db/dataAccess";
import { db } from "../db";
import { _DBADMIN } from "../db/constants";
import { decrypt } from "../helpers/crypto";
import { isTest } from "../helpers";
import { keyApp } from "../constants";
import { _CONFIGFILE } from "../configuration";
import { getConnection } from "../db/helpers";

export interface IUser {
    id?: number; // integer
    username: string; // character varying
    password: string; // character varying
    email: string; // character varying
    database: string; // character varying
    canPost: boolean; // boolean
    canDelete: boolean; // boolean
    canCreateUser: boolean; // boolean
    canCreateDb: boolean; // boolean
    admin: boolean; // boolean
    superAdmin: boolean; // boolean
    token?: string; // integer
}

export enum Rights {
    Post = 0,
    Delete = 1,
    Create = 2,
    UserCreate = 3,
    Admin = 4,
    SuperAdmin = 5
}

interface userToken {
    id: number;
    username: string;
    password: string;
    PDCUAS: [boolean, boolean, boolean, boolean, boolean, boolean];
}

 const createToken = (input: IUser, password: string) => {
    return jsonwebtoken.sign(
        {
            data: {
                id: input.id,
                username: input.username,
                password: password,
                PDCUAS: [input.canPost, input.canDelete, input.canCreateDb, input.canCreateUser, input.admin, input.superAdmin]
            },
            exp: Math.floor(Date.now() / 1000) + 60 * 60 // 60 seconds * 60 minutes = 1 hour
        },
        keyApp
    );
};
export const decodeToken = (ctx: koa.Context): userToken | undefined => {
    if (ctx.request["token"]) {
        const token = jsonwebtoken.decode(ctx.request["token"]);

        if (token && token["data"].id > 0)
            return Object.freeze({
                id: token["data"].id,
                username: token["data"].username,
                password: token["data"].password,
                PDCUAS: token["data"].PDCUAS
            });
    }
};

// export const ensureAdmin = (ctx: koa.Context): boolean => {
//     const token = decodeToken(ctx);
//     if (token) return token.PDCUAS[Rights.Admin] === true;
//     return false;
// };

// export const ensureSuperAdmin = (ctx: koa.Context): boolean => {
//     const token = decodeToken(ctx);
//     if (token) return token.PDCUAS[Rights.SuperAdmin] === true;
//     return false;
// };

export const ensureAuthenticated = (context: koa.Context): boolean => (isTest() ? true : userAuthenticated(context));

const userAuthenticated = (ctx: koa.Context): boolean => {
    const token = decodeToken(ctx);
    if (token && +token.id > 0) return true;
    return false;
};

export const getAuthenticatedUser = async (ctx: koa.Context): Promise<IUser | undefined> => {
    const token = decodeToken(ctx);
    if (token && token.id > 0) {
        const user = await userAccess.getSingle(String(token.id));
        if (token.password.match(decrypt(user.password)) !== null) {
            return Object.freeze(user);
        }
    }
    return undefined;
};

export const loginUser = async (ctx: koa.Context): Promise<IUser | undefined> => {
    if (ctx.request.body["username"] && ctx.request.body["password"]) {
        try {
            if (isTest()) {
                const tempConnection = getConnection("admin");
                if (tempConnection) db["admin"] = tempConnection;
            }
            return await db["admin"]
                .table(_DBADMIN.Users.table)
                .where("username", ctx.request.body["username"])
                .first()
                .then((user: IUser) => {
                    if (user && ctx.request.body && ctx.request.body["password"].match(decrypt(user.password)) !== null) {
                        const token = createToken(user, ctx.request.body["password"]);
                        ctx.cookies.set("jwt-session", token);
                        user.token = token;
                        return Object.freeze(user);
                    }
                });
        } catch (error) {
            console.log(error);
            return;
        }
    } else {
        console.log("c'est ici que ca se passe");
    }
};
