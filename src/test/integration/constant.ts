import fs from "fs";
import path from "path";
import { db } from "../../server/db";
import { IKeyString } from "../../server/types";
const apidocJson = require("../apidoc.json");

// Institut Agro Rennes-Angers 48.1140652783794, -1.7062956999598533 
export const geoPos: { [key: string]: number[] }  = {
    "Centre commercial Grand Quartier" : [48.13765198324515, -1.6956051932646596],
    "Polyclinic Saint Laurent" : [48.139101133693764, -1.6571222811169917],
    "Golf municipal de Cesson-Sévigné": [48.12552590922048, -1.5889906727727678],
    "Glaz Arena": [48.11472599868096, -1.594679622929148],
    "Brin Herbe": [48.08416909630583, -1.601486946802519],
    "E.Leclerc VERN SUR SEICHE": [48.06467042196109, -1.623116279666956],
    "Écomusée du pays de Rennes": [48.07908248444603, -1.6664475955447595],
    "Castorama": [48.089982264765595, -1.7050636226736864],
    "The Mem": [48.089982264765595, -1.7050636226736864],
    "Kenedy": [48.123242161802274, -1.7127016234011674],
    "Institut Agro Rennes-Angers": [48.1140652783794, -1.7062956999598533 ]
}
export const positions = Object.values(geoPos);

const reqLines: string[] = [""];

const createJSON = (data: any) => JSON.stringify(data, null, 4).replace(/[\n]+/g, "|\t");

export const keyTokenName = "jwt-session";
export interface IApiInput {
    api: string;
    apiName: string;
    apiDescription: string;
    apiReference?: string;
    apiPermission?: string;
    apiExample?: IKeyString;
    apiError?: string[];
    apiParam?: string[];
    apiSuccess?: string[];
    apiParamExample?: Record<string, unknown>;
    result: any;
}

export const defaultPostPatch = (lang: string, method: string, request: string, data: any): string => {
    switch (lang.toUpperCase()) {
        case "CURL":
            return `curl -X ${method.toUpperCase()} -H 'Content-Type: application/json' -d '${createJSON(data)}}' proxy${request}`;
        case "JAVASCRIPT":
            return `const response = await fetch("proxy${request}", {|\tmethod: "${method.toUpperCase()}",|\theaders: {|\t    "Content-Type": "application/json",|\t},|\tbody:${createJSON(
                data
            )}|});|const valueJson = await response.json();|const valueTxt = await response.text();`;
        case "PYTHON":
            return `import requests|import json|response_API = requests.${method}('proxy${request}', (headers = { "Content-Type": "application/json" }), (data = :${createJSON(
                data
            )}))|data = response_API.text|parse_json = json.loads(data)|print(parse_json)`;
    }
    return "";
};

export const defaultPost = (lang: string, request: string, data: any): string => {
    return defaultPostPatch(lang, "post", request, data);
};

export const defaultPatch = (lang: string, request: string, data: any): string => {
    return defaultPostPatch(lang, "patch", request, data);
};

export const defaultDelete = (lang: string, request: string): string => {
    switch (lang.toUpperCase()) {
        case "CURL":
            return `curl -DELETE "proxy${request}"`;
        case "JAVASCRIPT":
            return `const response = await fetch("proxy${request}", {|\tmethod: "DELETE"|});|const valueJson = await response.json();|const valueTxt = await response.text();`;
        case "PYTHON":
            return `import requests|import json|response_API = requests.delete('proxy${request}')|data = response_API.text|parse_json = json.loads(data)|print(parse_json)`;
    }
    return "";
};

export const defaultGet = (lang: string, request: string): string => {
    switch (lang.toUpperCase()) {
        case "CURL":
            return `curl -GET "proxy${request}"`;
        case "JAVASCRIPT":
            return `const response = await fetch("proxy${request}", {|\tmethod: "GET",|\theaders: {|\t    "Content-Type": "application/json",|\t},|});|const valueJson = await response.json();|const valueTxt = await response.text();`;
        case "PYTHON":
            return `import requests|import json|response_API = requests.get('proxy${request}')|data = response_API.text|parse_json = json.loads(data)|print(parse_json)`;
    }
    return "";
};

export interface IApiDoc {
    api: string;
    apiDescription: string;
    apiVersion: string;
    apiName: string;
    apiGroup: string;
    apiParam?: string[];
    apiError?: string[];
    apiSuccess?: string[];
    apiExample?: IKeyString;
    apiParamExample?: string;
    apiSuccessExample?: string;
    apiErrorExample?: string;
    apiUse?: string;
    apiPermission?: string;
    text?: string;
    apiSampleRequest?: string;
}

const _HEADERS: { [key: string]: string } = {
    apiParamExample: "{json} Request-Example:",
    apiSuccessExample: "{json} Success-Response:",
    apiErrorExample: "{json} Error-Response:"
};

export const prepareToApiDoc = (input: IApiInput, Entity: string): IApiDoc => {
    return {
        api: input.api,
        apiVersion: "1.0.0",
        apiName: input.apiName,
        apiPermission: input.apiPermission,
        apiGroup: Entity,
        apiDescription: `${input.apiDescription} ${input.apiReference ? ` <a href="${input.apiReference}" target="_blank">[OGC reference]</a>` : ""}`,
        apiExample: input.apiExample,
        apiError: input.apiError,
        apiParam: input.apiParam,
        apiSuccess: input.apiSuccess,
        apiParamExample: input.apiParamExample ? JSON.stringify(input.apiParamExample, null, 4) : undefined,
        apiSampleRequest: input.api.startsWith("{get}") && input.apiExample ? `proxy${input.apiExample.http}` : "",
        apiSuccessExample:
            input.result.type === "text/plain" || input.result.type === "text/csv"
                ? input.result.text
                : input.result && input.result.body
                ? JSON.stringify(input.result.body, null, 4)
                : undefined
    };
};

export const generateApiDoc = (input: IApiDoc[], filename: string): boolean => {
    const createExamplesLines = (input: string) => {
        const tempLines = input.split("|");
        tempLines.forEach((elemTemp: string) => {
            lines.push(`*          ${elemTemp.replace(/[\t]+/g, "   ")}`);
        });
    };
    const proxy = apidocJson.proxy;

    const lines: string[] = [];

    lines.push("/**");
    lines.push("* @apiDefine admin:computer User access only");
    lines.push("* This optional description belong to to the group admin.");
    lines.push("*/");
    lines.push("");

    input.forEach((element: IApiDoc) => {
        lines.push("/**");
        for (const [key, value] of Object.entries(element)) {
            if (key === "apiSuccess" && value) {
                value.forEach((tab: string) => {
                    lines.push(`*    @apiSuccess ${tab.replace("[", "").replace("]", "")}`);
                });
            } else if (key === "apiParam" && value) {
                value.forEach((tab: string) => {
                    lines.push(`*    @apiParam ${tab}`);
                });
            } else if (key === "apiPermission " && value) {
                lines.push(`*    @apiPermission value`);
            } else if (key === "apiExample" && value) {
                Object.keys(value).forEach((elem: string) => {
                    lines.push(`*    @${key} {${elem}} ${elem}`);
                    switch (elem) {
                        case "http":
                            createExamplesLines(`${proxy}${value[elem]}`);
                            break;
                        case "curl":
                        case "javascript":
                        case "python":
                            createExamplesLines(value[elem].replace("KEYHTTP", value.http).replace("proxy", proxy).replace("KEYDATA", element.apiParamExample));
                            break;
                        default:
                            createExamplesLines(`${proxy}${value[elem]}`);
                            break;
                    }
                });
            } else if (key === "apiError" && value) {
                value.forEach((tab: string) => {
                    lines.push(`*    @apiError ${tab}`);
                });
            } else if (Object.keys(_HEADERS).includes(key) && value) {
                lines.push(`*    @${key} ${_HEADERS[key]}`);
                const successLines: string[] = value.split("\n");
                successLines.forEach((successLine: string) => {
                    lines.push(`*    ${successLine}`);
                });
            } else if (value) {
                lines.push(`*    @${key} ${value}`);
            }
        }

        lines.push("*/\n");
    });
    lines.forEach((element, index) => {
        lines[index] = element.replace("proxy", proxy);
    });
    filename = "../apiDocs/" + filename;
    fs.writeFileSync(path.resolve(__dirname, filename), `${lines.join("\n")}`, {
        encoding: "utf-8"
    });

    return true;
};

export const createListColumns = async (table: string, fn: any): Promise<void> => {
    const returnSuccess: string[] = [];
    const returnParam: string[] = [];

    const columns = await db["admin"].raw(`
  select c.table_schema, st.relname as TableName, c.column_name, c.data_type, c.is_nullable, pgd.description
  from pg_catalog.pg_statio_all_tables as st
  inner join information_schema.columns c
  on c.table_schema = st.schemaname
  and c.table_name = st.relname
  left join pg_catalog.pg_description pgd
  on pgd.objoid=st.relid
  and pgd.objsubid=c.ordinal_position
  where st.relname = '${table}';`);

    columns["rows"].forEach((element: { [key: string]: string }) => {
        const type = ["integer", "bigint", "numeric", "decimal"].includes(element["data_type"])
            ? "number"
            : element["data_type"] === "boolean"
            ? "boolean"
            : element["data_type"] === "jsonb"
            ? "JSONObject"
            : element["data_type"] === "ARRAY" && element.udt === "_text"
            ? "string[]"
            : element["data_type"].startsWith("timestamp") || element["data_type"] === "date"
            ? "Date"
            : element["data_type"] === "USER-DEFINED"
            ? "Enum"
            : "string";

        if (element["column_name"] != "id" && !element["column_name"].trim().endsWith("_id")) {
            returnSuccess.push(`{${type}} ${element["column_name"]} ${element["description"]}`);
            returnParam.push(
                element["is_nullable"].toString() === "NO"
                    ? `{${type}} ${element["column_name"]} ${element["description"]}`
                    : `{${type}} [${element["column_name"]}] ${element["description"]}`
            );
        }
    });
    fn(null, returnSuccess, returnParam);
};
export const addToFile = (requette: string): string => {
    reqLines.push(requette);
    return requette;
}
export const writeAddToFile = (): void => {
    fs.writeFileSync(path.resolve(__dirname, "../fileRequettes"), `${reqLines.join("\n")}`, {
        encoding: "utf-8"
    });
};