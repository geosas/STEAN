/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * IUserDataAccess interface.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { IUser } from "../../types/user";

export interface IUserDataAccess {
    getAll(): Promise<IUser[] | any[]>;
    getSingle(id: string): Promise<IUser | any>;
    add(datas: any): Promise<IUser | any>;
    update(data: IUser): Promise<IUser | any>;
}
