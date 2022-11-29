/**
 * Admin HTML / JS maker.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

/* eslint-disable quotes */

import fs from "fs";
import koa from "koa";
import { cssFile } from "../css";

export const adminHtml = (ctx: koa.Context): string => fs.readFileSync(__dirname + "/admin.html", "utf-8").replace("@css@", cssFile("query.css"));
