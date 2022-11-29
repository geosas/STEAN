/**
 * upload.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 *
 */

import Busboy from "busboy";
import path from "path";
import util from "util";
import fs from "fs";
import koa from "koa";
import { message } from "../logger";
import { IKeyString } from "../types";

/**
 *
 * @param ctx Koa context
 * @returns KeyString
 */

export const upload = (ctx: koa.Context): Promise<IKeyString> => {
    const data: IKeyString = {};
    return new Promise(async (resolve, reject) => {
        const uploadPath = "./upload";
        const allowedExtName = ["csv", "txt", "json"];
        if (!fs.existsSync(uploadPath)) {
            const mkdir = util.promisify(fs.mkdir);
            await mkdir(uploadPath).catch((error) => {
                data.state = "ERROR";
                reject(error);
            });
        }

        const busboy = new Busboy({ headers: ctx.req.headers });

        busboy.on("file", (fieldname, file, filename) => {
            const extname = path.extname(filename).substring(1);
            if (!allowedExtName.includes(extname)) {
                data.state = "UPLOAD UNALLOWED FILE";
                file.resume();
                reject(data);
            } else {
                file.pipe(fs.createWriteStream(uploadPath + "/" + filename));
                data["file"] = uploadPath + "/" + filename;
                file.on("data", (chunk) => {
                    data.state = `GET ${chunk.length} bytes`;
                });
                file.on("error", (error: Error) => {
                    message(false, "ERROR", error.message);
                });
                file.on("end", () => {
                    data.state = "UPLOAD FINISHED";
                    data[fieldname] = uploadPath + "/" + filename;
                });
            }
        });
        busboy.on("field", (fieldname, value) => {
            data[fieldname] = value;
        });
        busboy.on("error", (error: Error) => {
            message(false, "ERROR", error.message);
            data.state = "ERROR";
            reject(error);
        });
        busboy.on("finish", () => {
            data.state = "DONE";
            resolve(data);
        });
        ctx.req.pipe(busboy);
    });
};
