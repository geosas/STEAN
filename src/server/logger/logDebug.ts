/**
 * logDebug.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { logAll } from "../constants";
import { isModeDebug } from "../helpers";

export const logDebug = (input: any, full?: boolean): void => {
    if (isModeDebug()) {
        if (full && full == true) logAll(input);
        else console.log(input);
    }
};
