/**
 * message.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { _DBADMIN } from "../db/constants";
import util from "util";
import { stringToBool } from "../helpers";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const message = (
    testDebug: boolean,
    mode: "HEAD" | "DEBUG" | "RESULT" | "INFO" | "ERROR" | "ENV" | "CLASS" | "OVERRIDE",
    cle: string,
    info?: any
): void => {
    if (process.env.NODE_ENV == "test" && mode == "RESULT" && !info) {
        console.log(`\x1b[32m     >>\x1b[31m ${cle} \x1b[39m : \x1b[36m ${info}\x1b[0m`);
        return;
    }

    if (testDebug && !stringToBool(process.env.DEBUG)) return;

    if (info && typeof info === "object") info = util.inspect(info, { showHidden: false, depth: null, colors: true });
    switch (mode) {
        case "HEAD": {
            if (info) console.log(`\x1b[32m ==== \x1b[36m ${cle} \x1b[37m ${info} \x1b[32m ====\x1b[0m`);
            else console.log(`\x1b[32m ==== \x1b[33m ${cle} \x1b[32m ====\x1b[0m`);
            break;
        }
        case "DEBUG": {
            console.log(`\x1b[32m ${cle} \x1b[37m : \x1b[36m ${info}\x1b[0m`);
            break;
        }
        case "RESULT": {
            console.log(`\x1b[32m     >>\x1b[31m ${cle} \x1b[39m : \x1b[36m ${info}\x1b[0m`);
            break;
        }
        case "INFO": {
            console.log(`\x1b[36m ${cle} \x1b[34m : \x1b[37m ${info}\x1b[0m`);
            break;
        }
        case "ERROR": {
            console.log(`\x1b[31m ${cle} \x1b[34m : \x1b[33m ${info}\x1b[0m`);
            break;
        }
        case "ENV": {
            console.log(`\x1b[36m ${cle} \x1b[34m : \x1b[33m ${info}\x1b[0m`);
            break;
        }

        case "CLASS": {
            if (info) console.log(`\x1b[31m ==== \x1b[36m ${cle} \x1b[33m ${info} \x1b[31m ====\x1b[0m`);
            else console.log(`\x1b[31m ==== \x1b[36m ${cle} \x1b[31m ====\x1b[0m`);
            break;
        }
        case "OVERRIDE": {
            if (info) console.log(`\x1b[31m ==== \x1b[32m ${cle} \x1b[33m ${info} \x1b[31m ====\x1b[0m`);
            else console.log(`\x1b[31m ==== \x1b[36m ${cle} \x1b[31m ====\x1b[0m`);
            break;
        }
        default: {
            console.log("\x1b[31m" + cle + info);

            break;
        }
    }
};
