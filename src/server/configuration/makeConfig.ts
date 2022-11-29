/**
 * makeConfig.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

 import fs from "fs";
 import { _NODE_ENV } from "../constants";
 import { IConfigFiles } from "../types";
 import { formatConfig } from "./formatConfig";
 
 /**
  *
  * @returns valid Config File
  */
 
 export const makeConfig = (): IConfigFiles => {
     const returnValue: IConfigFiles = {};
     const file = fs.readFileSync(__dirname + "/config.json", "utf8");
 
     let input = JSON.parse(file);
     // different config in different environment
     if(input.hasOwnProperty(_NODE_ENV)) input = input[_NODE_ENV];
 
     Object.keys(input).forEach((element: string) => (returnValue[element] = formatConfig(input[element], element)));
 
     return returnValue;
 };
 