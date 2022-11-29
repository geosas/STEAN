/**
 * User dataAccess.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { IUserDataAccess } from "../interfaces";
import { IUser } from "../interfaces";
import { db } from "../../db";
import { _DBADMIN } from "../constants";
import { encrypt } from "../../helpers/";

export const userAccess: IUserDataAccess = {
    getAll: async () => {
        return await db["admin"]
            .table("user")
            .select(Object.keys(_DBADMIN.Users.columns).filter((word) => word.toLowerCase() != "password"))
            .orderBy("id");
    },

    getSingle: async (id: string) => {
        return await db["admin"]
            .table("user")
            .select("*")
            .first()
            .where({ id: +id });
    },

    add: async (data: IUser) => {
        return await db["admin"]
            .table("user")
            .insert({
                username: data.username,
                email: data.email,
                password: encrypt(data.password),
                database: data.database || "all",
                canPost: data.canPost || false,
                canDelete: data.canDelete || false,
                canCreateUser: data.canCreateUser || false,
                canCreateDb: data.canCreateDb || false,
                superAdmin: data.superAdmin || false,
                admin: data.admin || false
            })
            .returning("*");
    },

    update: async (data: IUser): Promise<IUser | any> => {
        return await db["admin"]
            .table("user")
            .update({
                username: data.username,
                email: data.email,
                database: data.database,
                canPost: data.canPost || false,
                canDelete: data.canDelete || false,
                canCreateUser: data.canCreateUser || false,
                canCreateDb: data.canCreateDb || false,
                superAdmin: data.superAdmin || false,
                admin: data.admin || false
            })
            .where({ id: data.id })
            .returning("*");
    }
};
