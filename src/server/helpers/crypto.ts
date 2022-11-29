/**
 * crypto.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import crypto from "crypto";
import { _CONFIGFILE } from "../configuration";
import { keyApp } from "../constants";

export const encrypt = (text: string): string => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-ctr", keyApp, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return `${iv.toString("hex")}.${encrypted.toString("hex")}`;
};

export const decrypt = (input: string): string => {
    const temp = input.split(".");
    const decipher = crypto.createDecipheriv("aes-256-ctr", keyApp, Buffer.from(temp[0], "hex").slice(0, 16));
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(temp[1], "hex").slice(0, 16)), decipher.final()]);
    return decrpyted.toString();
};
