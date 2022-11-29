/**
 * getReturnFormat.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { returnFormat, returnFormatString } from "../types";

/**
 *
 * @param string koa context
 * @returns returnFormat
 */

export const getReturnFormat = (input: string): returnFormat => {
    switch (input.trim().toUpperCase()) {
        case "TXT":
            return { name: "TXT", value: returnFormatString.TXT };
        case "CSV":
            return { name: "CSV", value: returnFormatString.CSV };
        case "HTML":
            return { name: "HTML", value: returnFormatString.HTML };
        case "JSON":
            return { name: "JSON", value: returnFormatString.JSON };
        case "DATAARRAY":
            return { name: "DATAARRAY", value: returnFormatString.DATAARRAY };
        case "GRAPH":
            return { name: "GRAPH", value: returnFormatString.GRAPH };
        case "GRAPHDATAS":
            return { name: "GRAPHDATAS", value: returnFormatString.GRAPHDATAS };
        case "JS":
            return { name: "JS", value: returnFormatString.JS };
        case "CSS":
            return { name: "CSS", value: returnFormatString.CSS };
        default:
            return { name: "JSON", value: returnFormatString.JSON };
    }
};
