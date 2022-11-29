/**
 * returnFormat interface.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */
export type typeFormat = "JSON" | "CSV" | "TXT" | "HTML" | "ICON" | "GRAPH" | "GRAPHDATAS" | "DATAARRAY" | "CSS" | "JS" | "PNG" | "JPG" | "JPEG" | "ICO";

export const enum returnFormatString {
    JSON = "application/json",
    GRAPHDATAS = "application/json",
    DATAARRAY = "application/json",
    CSV = "text/csv",
    TXT = "text/plain",
    HTML = "text/html;charset=utf8",
    GRAPH = "text/plain",
    CSS = "text/css;charset=utf8",
    JS = "application/javascript;charset=utf8",
    PNG = "image/png",
    JPEG = "image/jpeg",
    JPG = "image/jpeg",
    ICON = "image/x-icon",
    ICO = "image/x-icon"
}

export interface returnFormat {
    name: typeFormat;
    value: string; 
}
