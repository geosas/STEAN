/**
 * removeKeyFromUrl.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { cleanUrl } from "../../helpers";


/**
 * 
 * @param input url string
 * @param keys array of keys to remove
 * @returns clean url string 
 * */

export const removeKeyFromUrl = (input: string, keys: string[]): string => {
    input = decodeURI(input);
    if (!input.includes("?")) return input;
    const firstSplit = input.split("?");
    const returnValue: string[] = [];
    firstSplit[1].split("&").forEach((element: string) => {
        if (element.includes("=")) {
            const temp = element.split("=");
            if (!(keys.includes(temp[0]) || keys.includes(`${temp[0].replace("$", "")}`))) returnValue.push(element);
        }
    });
    return cleanUrl(`${firstSplit[0]}?${returnValue[0] && returnValue[0].startsWith("$") ? "" : "$"}${returnValue.join("&")}`);
};
