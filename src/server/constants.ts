/**
 * Constants of API.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import fs from "fs";
import util from "util";

let fileConfigJson: object | undefined = undefined;

try {
    const fileConfig = fs.readFileSync(__dirname + "/package.json", "utf8");
    fileConfigJson = JSON.parse(fileConfig);
} catch (error) {
    fileConfigJson = undefined;
}


export const keyApp = fs.readFileSync(__dirname + "/configuration/.key", "utf8");
export const _VOIDTABLE = "spatial_ref_sys";
export const _DOUBLEQUOTE = '"';
export const _QUOTEDCOMA = '","';
export const _APIVERSION = "v1.0";
export const _ENV_VERSION = process.env.npm_package_version ? process.env.npm_package_version : fileConfigJson ? fileConfigJson["version"] : "";
export const _NODE_ENV = process.env.NODE_ENV ? process.env.NODE_ENV : "production";
export const logAll = (input: any) => { console.log(util.inspect(input, { showHidden: false, depth: null, colors: true })); }

export const minifierConfig = Object.freeze({
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true
});

export const helmetConfig = Object.freeze({
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "fonts.googleapis.com"]
});
