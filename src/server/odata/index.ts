import { query, resourcePath } from "./parser/parser";
import { Token } from "./parser/lexer";
import koa from "koa";
import { cleanUrl } from "../helpers";
import { _CONFIGFILE } from "../configuration";
import { rootBase, _DBDATAS } from "../db/constants";
import { PgVisitor } from "./visitor/PgVisitor";
import { db } from "../db";
import { SqlOptions } from "./parser/sqlOptions";
export { PgVisitor } from "./visitor/PgVisitor";

const doSomeWarkAfterAst = async (input: PgVisitor, ctx: koa.Context) => {    
    if ( input.splitResult && input.splitResult[0].toUpperCase() == "ALL" && input.parentId && <bigint>input.parentId > 0) {
        const temp = await db[ctx._configName].raw(`select jsonb_agg(tmp.units -> 'name') as keys from ( select jsonb_array_elements("unitOfMeasurements") as units from ${_DBDATAS.MultiDatastreams.table} where id = ${input.parentId} ) as tmp`);
        input.splitResult = temp.rows[0]["keys"];
    }   
}

export const createOdata = async (ctx: koa.Context):Promise<PgVisitor | undefined> => {
    const blankUrl = `$top=${_CONFIGFILE[ctx._configName].nb_page ? +_CONFIGFILE[ctx._configName].nb_page : 200}`;
    const options: SqlOptions = {loraId: undefined, rootBase: rootBase(ctx), value: false, ref: false, method: ctx.method};

    let urlSrc = ctx.href.normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(ctx._version)[1];

    const removeElement = (input: string) => {
        urlSrc = urlSrc.replace(`&${input}`, "");
        urlSrc = urlSrc.replace(input, "");
    };    

    if (urlSrc.includes("/Loras(")) {
        const idLora =  urlSrc.split("/Loras(").join("").split(")")[0];      
        if(isNaN(+idLora)) {
            options.loraId = idLora;
            urlSrc = urlSrc.replace(idLora, "0");
        }        
    };

    urlSrc = cleanUrl(urlSrc.replace(/\@iot.id\b/, "id").split(/(r)esult(?![a-zA-Z])/).filter((e: string) => e != "r").join('resultnumber'));

    if (urlSrc === "/") return;

    if (urlSrc.includes("$"))
        urlSrc.split("$").forEach((element: string) => {
            switch (element) {            
                case "value&":                        
                case "value":                        
                options.value = true;
                    removeElement(`/$${element}`);
                    break;
                case "ref":                        
                options.ref = true;
                    removeElement(`/$${element}`);
                    break;
            }
        });

        const urlSrcSplit = urlSrc.split("?");
        
        if(!urlSrcSplit[1]) urlSrcSplit.push(blankUrl);  
        
        if (urlSrcSplit[0].split("(").length != urlSrcSplit[0].split(")").length) urlSrcSplit[0] += ")";        

        const astRessources:Token = <Token>(resourcePath(<string>urlSrcSplit[0]));        
        
        const astQuery: Token = <Token>query(urlSrcSplit[1]);

        const temp = new PgVisitor(options).init(ctx, astRessources).start(ctx, astQuery);

        await doSomeWarkAfterAst(temp, ctx);
        
        return temp;

}

