/**
 * returnBody.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { Parser } from "json2csv";
import { message } from "../logger";
import { IKeyValues, typeFormat } from "../types";
import util from "util";

/**
 *
 * @param input keyValue Input
 * @param format returnFormat
 * @returns keyValue formated
 */

export const returnBody = (input: string | IKeyValues | IKeyValues[], format: typeFormat): string | IKeyValues | IKeyValues[] => {
    switch (format) {
        case "CSV":
            const opts = { delimiter: ";", includeEmptyRows: true, escapedQuote: "",header: false};            
            if (input)
            try {
                const parser = new Parser(opts);
                    input[0].dataArray.unshift(input[0].component);
                    return parser.parse(input[0].dataArray);
                } catch (e) {
                    if (e instanceof Error) {
                        message(false, "ERROR", e.message);
                        return e.message;
                    }
                }
            return "No datas";
        case "TXT":
            return input.length > 0 ? util.inspect(input, { showHidden: true, depth: 4 }) : JSON.stringify(input);
        case "GRAPH":
            return input;
        default:
            return input;
    }
};
