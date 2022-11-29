/**
 * Api dataAccess.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { DataAccessInterface } from "../interfaces";

import * as entities from "../entities/index";
import { Common } from "../entities/common";
import koa from "koa";
import { db } from "../../db";
import { message } from "../../logger";
import { IKeyValues, IReturnResult } from "../../types";
import { recordToKeyValue } from "../helpers";
import { getEntityName } from "../../helpers";

export class apiAccess implements DataAccessInterface {
    readonly myEntity: Common | undefined;
    readonly ctx: koa.Context;

    constructor(ctx: koa.Context) {
        this.ctx = ctx;        
        const temp = this.ctx._odata.entity;
        const entityName = getEntityName(temp);
        if (entityName && entityName in entities) {
            this.myEntity = new entities[(this.ctx, entityName)](ctx, db[this.ctx._configName]);
            if (this.myEntity === undefined) message(true, "ERROR", `Entity Error : ${entityName}`);
            else message(true, "CLASS", "constructor apiAccess", "Ok");
        } else message(true, "ERROR", `Entity Error : ${entityName}`);
    }

    formatDataInput(input: IKeyValues[] | undefined): IKeyValues[] | undefined {
        message(true, "CLASS", this.constructor.name, "formatDataInput");
        return this.myEntity ? this.myEntity.formatDataInput(input) : input;
    }

    async getAll(): Promise<IReturnResult | undefined> {
        message(true, "CLASS", this.constructor.name, "getAll");
        if (this.myEntity) return await this.myEntity.getAll();
    }

    async getSingle(idInput: bigint | string, propertyName?: string, onlyValue?: boolean): Promise<IReturnResult | undefined> {
        message(true, "CLASS", this.constructor.name, "getSingle");
        if (this.myEntity) return await this.myEntity.getSingle(idInput);
    }

    async add(): Promise<IReturnResult | undefined> {
        message(true, "CLASS", this.constructor.name, "add");
        if (this.myEntity) return await this.myEntity.add(recordToKeyValue(this.ctx.request.body));
    }

    async update(idInput: bigint | string): Promise<IReturnResult | undefined> {
        message(true, "CLASS", this.constructor.name, "update");
        if (this.myEntity) return await this.myEntity.update(idInput, recordToKeyValue(this.ctx.request.body));
    }

    async delete(idInput: bigint | string): Promise<IReturnResult | undefined> {
        message(true, "CLASS", this.constructor.name, "delete");
        if (this.myEntity) return await this.myEntity.delete(idInput);
    }
}
