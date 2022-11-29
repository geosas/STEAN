/**
 * exportCsv.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { message } from "../../logger";
import { _DBDATAS } from "../constants";
import { Knex } from "knex";
import koa from "koa";
const copyTo = require("pg-copy-streams").to;
import fs from "fs";
import { returnFormatString } from "../../types";
// import { stringify } from "csv-stringify";

export const exportCsv = async (ctx: koa.Context, knex: Knex | Knex.Transaction, query: string): Promise<fs.ReadStream | undefined> => {
    const fileName = `temp${Date.now().toString()}.csv`;
    message(true, "INFO", "exportCsv", fileName);

    return await new Promise<fs.ReadStream | undefined>((resolve, reject) => {
        try {
            var writer = fs.createWriteStream(fileName);
            knex.transaction(async (tx: any) => {
                const client = await tx.client.acquireConnection().catch((err: Error) => reject(err));
                const stream = client.query(copyTo(`COPY (${query})  TO STDOUT  WITH (FORMAT csv, DELIMITER ';')`));
                const pipe = stream.pipe(writer);
                pipe.on("finish", () => {
                    message(true, "INFO", "finish stream", fileName);
                    var stream = fs.createReadStream(fileName);
                    stream.on("end", () => {
                        fs.unlink(fileName, () => message(true, "INFO", "Delete file", fileName));
                    });
                    ctx.response.set("content-type", returnFormatString.CSV);
                    ctx.attachment(fileName);
                    stream.pipe(ctx.res);
                    ctx.body = stream;
                    resolve;
                });
                pipe.on("error", (err: Error) => {
                    message(true, "ERROR", "fileStream error", err);
                    reject(err);
                });
            });
        } catch (err) {
            message(true, "ERROR", "fileStream error", err);
            reject(err);
        }
    });
};
