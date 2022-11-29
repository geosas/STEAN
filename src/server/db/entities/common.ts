/**
 * Common class entity.
 *f
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import koa from "koa";
import { Knex } from "knex";
import { isGraph, _DBDATAS } from "../constants";
import { getEntityName, isModeDebug, removeQuotes } from "../../helpers/index";
import { addToLog, message } from "../../logger";
import { IReturnResult, IKeyValues } from "../../types";
import { createGraph, extractMessageError, knexQueryToSql, removeKeyFromUrl, verifyId } from "../helpers";
import { _VOIDTABLE } from "../../constants";
import { _CONFIGFILE } from "../../configuration";
import { db } from "../../db";
import { IGraphDatas } from "../helpers/createGraph";


export class Common {
    readonly ctx: koa.Context;
    static dbContext: Knex | Knex.Transaction;
    public nextLinkBase: string;
    public linkBase: string;

    constructor(ctx: koa.Context, knexInstance?: Knex | Knex.Transaction) {
        message(true, "CLASS", this.constructor.name, "Constructor");
        this.ctx = ctx;

        if (knexInstance) Common.dbContext = knexInstance;

        this.nextLinkBase = removeKeyFromUrl(`${this.ctx._odata.options.rootBase}${this.ctx.href.split(`${ctx._version}/`)[1]}`, ["top", "skip"]);
        this.linkBase = `${this.ctx._odata.options.rootBase}${this.constructor.name}`;        
        
    }

    // get Error and format it to return it in body koa
    returnError(error: any): void {
        if (error instanceof Error) {
            message(true, "ERROR", error.message);
            this.ctx.throw(400, { detail: extractMessageError(error.message) });
        }
    }

    // only for override
    formatDataInput(input: IKeyValues[] | undefined): IKeyValues[] | undefined {
        return input;
    }

    // Log full Query
    logDebugQuery(input: Knex.QueryBuilder | string): void {
        const queryString = typeof input === "string" ? input : knexQueryToSql(input);
        if (isModeDebug()) message(true, "RESULT", "query", queryString);
        addToLog(this.ctx, { "query": queryString });
    }

    // create a blank ReturnResult
    createReturnResult(args: Record<string, unknown>): IReturnResult {
        message(true, "CLASS", this.constructor.name, "createReturnResult");
        return {
            ...{
                id: undefined,
                entity: _DBDATAS[this.constructor.name],
                nextLink: args.nextLink ? (args.nextLink as string) : undefined,
                prevLink: args.prevLink ? (args.prevLink as string) : undefined,
                value: undefined,
                body: undefined,
                total: undefined
            },
            ...args
        };
    }

    

    // create the nextLink
    nextLink = (resLength: number): string | undefined => {
        if (this.ctx._odata.timeSeries) return;       
        const max: number = this.ctx._odata.limit > 0 ? +this.ctx._odata.limit :  +_CONFIGFILE[this.ctx._configName].nb_page;
        if (resLength >= max) return `${encodeURI(this.nextLinkBase)}${this.nextLinkBase.includes("?") ? "&" : "?"}$top=${this.ctx._odata.limit}&$skip=${this.ctx._odata.skip + this.ctx._odata.limit}`;
    };
    
    // create the prevLink
    prevLink = (resLength: number): string | undefined => {
        if (this.ctx._odata.timeSeries) return;
        const prev = this.ctx._odata.skip - this.ctx._odata.limit;
        if ((_CONFIGFILE[this.ctx._configName].nb_page && resLength >= +_CONFIGFILE[this.ctx._configName].nb_page  || this.ctx._odata.limit) && prev >= 0)
            return `${encodeURI(this.nextLinkBase)}${this.nextLinkBase.includes("?") ? "&" : "?"}$top=${this.ctx._odata.limit}&$skip=${prev}`;
    };

    // formatResult for graph and for observation request without Datastreams or MultiDatastreams
    formatResult = async (input: JSON): Promise<JSON | IGraphDatas> => {
        message(true, "INFO", "formatResult", this.ctx._odata.resultFormat.name);
        if (isGraph(this.ctx._odata)) {
            const entityName = getEntityName(this.ctx._odata.parentEntity ? this.ctx._odata.parentEntity : this.ctx._odata.entity);            
            let tempTitle  = "No Title"
            if(entityName && _DBDATAS[entityName].columns["name"])
            await Common.dbContext(_DBDATAS[entityName].table).select("name").where({id: this.ctx._odata.parentEntity ? this.ctx._odata.parentId: this.ctx._odata.id}).limit(1).then((res: any) => tempTitle = res[0].name);
            const temp =  createGraph(input, tempTitle);
            return temp ?  temp : JSON.parse('');
        } 
        else if (this.ctx._odata.entity == _DBDATAS.Observations.name && !this.ctx._odata.parentEntity) {     
            if (Object(input).forEach)
                Object(input).forEach((elem: object) => { 
                    if (elem.hasOwnProperty("result") ) {
                        elem["result"]  = elem["result"].hasOwnProperty("result") ? elem["result"]["result"] : elem["result"];
                    }
                }); else {
                    if (input["result"].hasOwnProperty("result")) {
                        input["result"] = input["result"]["result"];
                        delete Object(input)["result"]["result"];
                    }   
                }
        }
        return input;
    };

    async getAll(): Promise<IReturnResult | undefined> {
        message(true, "CLASS", this.constructor.name, `getAll in ${this.ctx._odata.resultFormat} format`);

        const sql = this.ctx._odata.asGetSql();

        if(!sql) return;
        
        this.logDebugQuery(sql);

        const conn = this.ctx._odata.entity === "Logs" ? db["admin"] : Common.dbContext;

        return await conn
            .raw(sql)
            .then(async (res: any) => {    
                const nb = Number(res.rows[0].count);      
                          
                if (nb > 0 && res.rows[0]) {                    
                    return this.createReturnResult({
                        id: isNaN(nb) ? undefined : nb,
                        nextLink: this.nextLink(nb),
                        prevLink: this.prevLink(nb),
                        value: await this.formatResult(res.rows[0].results)
                    });
                } else return this.createReturnResult({ 
                        value: res.rows[0].results || res.rows[0]
                    });
            })
            .catch((err: Error) => this.ctx.throw(400, { detail: err.message }));
    }

    
    onlyValue(input: string | object): string {
        return (typeof input === "object") ? JSON.stringify(input) : removeQuotes(input);
    }

    async getSingle(idInput: bigint | string): Promise<IReturnResult | undefined> {
        message(true, "CLASS", this.constructor.name, `getSingle [${idInput}]`);

        const sql = this.ctx._odata.asGetSql();

        if(!sql) return;

        this.logDebugQuery(sql);

        const conn = this.ctx._odata.entity === "Logs" ? db["admin"] : Common.dbContext;

        return conn
            .raw(sql)
            .then((res: any) => {
                const nb = Number(res.rows[0].count);
                if (nb > 0 && res.rows[0].results[0]) {
                    this.formatResult(res.rows[0].results[0]);

                    return this.createReturnResult({
                        id: nb,
                        nextLink: this.nextLink(nb),
                        prevLink: this.prevLink(nb),
                        body: this.ctx._odata.select && this.ctx._odata.value === true ? this.onlyValue(res.rows[0].results[0][this.ctx._odata.select]) : res.rows[0].results[0]
                    });
                }
            })
            .catch((err: Error) => this.ctx.throw(400, { detail: err.message }));
    }

    async add(dataInput: IKeyValues[] | undefined): Promise<IReturnResult | undefined> {
        message(true, "CLASS", this.constructor.name, "add");

        dataInput = this.formatDataInput(dataInput);

        if (!dataInput) return;

        const sql = this.ctx._odata.asPostSql(dataInput, Common.dbContext);

        this.logDebugQuery(sql);

        return Common.dbContext
            .raw(sql)
            .then((res: any) => {                
                if (res.rows) {
                    if (res.rows[0].results[0]) this.formatResult(res.rows[0].results[0]);
                    return this.createReturnResult({
                        body: res.rows[0].results[0],
                        query: sql
                    });
                }
            })
            .catch((err: any) => {
                this.ctx.throw(400, { detail: err.detail });
            });
    }

    async update(idInput: bigint | string, dataInput: IKeyValues[] | undefined): Promise<IReturnResult | undefined> {
        message(true, "CLASS", this.constructor.name, "update");

        if (!dataInput) this.ctx.throw(400, { detail: "No data send for update" });

        const testIfId = await verifyId(Common.dbContext, BigInt(idInput), _DBDATAS[this.constructor.name].table);

        if (testIfId === false) this.ctx.throw(404, { detail: `No id found for : ${idInput}` });

        dataInput = this.formatDataInput(dataInput);

        if (!dataInput) this.ctx.throw(400, { detail: "No data send for update" });

        const sql = this.ctx._odata.asPatchSql(dataInput, Common.dbContext);

        addToLog(this.ctx, { "query": sql });

        this.logDebugQuery(sql);

        return Common.dbContext
            .raw(sql)
            .then((res: any) => {
                if (res.rows) {
                    if (res.rows[0].results[0]) this.formatResult(res.rows[0].results[0]);
                    return this.createReturnResult({
                        body: res.rows[0].results[0],
                        query: sql
                    });
                }
            })
            .catch((err: any) => {
                this.ctx.throw(400, { detail: err.detail });
            });
    }

    async delete(idInput: bigint | string): Promise<IReturnResult | undefined> {
        message(true, "CLASS", this.constructor.name, "delete");

        const testIfId = await verifyId(Common.dbContext, BigInt(idInput), _DBDATAS[this.constructor.name].table);
        if (testIfId === false) this.ctx.throw(404, { detail: `No id found for : ${idInput}` });

        try {
            const query: Knex.QueryBuilder = Common.dbContext(_DBDATAS[this.constructor.name].table).del().where({ id: idInput });
            addToLog(this.ctx, { "query": knexQueryToSql(query) });
            const returnValue = await query;

            return this.createReturnResult({
                id: BigInt(returnValue)
            });
        } catch (error) {
            this.returnError(error);
        }
    }
}
