/**
 * Maker Index HTML / JS maker.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

/* eslint-disable quotes */

import fs from "fs";
import { _DBDATAS } from "../../db/constants";
import { message } from "../../logger";
import { IQuery } from "../constant";
import { commonHtml } from "../helpers";

export const makerHtmlPage = (params: IQuery): string => {
    message(true, "HEAD", "queryHtmlPage");
    return commonHtml(fs.readFileSync(__dirname + "/maker.html").toString(), params);
};
