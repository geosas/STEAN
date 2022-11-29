/**
 * createDatabase.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

 import koa from "koa";
import { createAdminDatabase } from "./createAdminDatabase";
import { createSensorThingsDatabase } from "./createSensorThingsDatabase";
  
  export const createDatabase = async(configName: string, ctx?: koa.Context): Promise<{ [key: string]: string }> => {
    return configName.toUpperCase() === "ADMIN" ? createAdminDatabase(configName, ctx) : createSensorThingsDatabase(configName, ctx); 
 }