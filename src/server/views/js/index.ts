/**
 * Index Css.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import fs from "fs";
import path from "path";

export const jsFile = (name: string):string =>  fs.readFileSync(__dirname + `/${name}`, "utf-8");

export const listJsFiles = ():string[] => {
    let result: string[] = [];
    fs.readdirSync(path.join(__dirname)).filter((e: string) => e.endsWith(".js")).forEach(file => {
        result.push(file);
      });
    return result;
}
