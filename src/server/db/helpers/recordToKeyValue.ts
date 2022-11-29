/**
 * recordToKeyValue.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { IKeyValues } from "../../types";

export const recordToKeyValue = (input: string | Record<string, unknown>): IKeyValues[] => {
    const returnValue: IKeyValues[] = [];
    if (typeof input == "object") {
        for (const [key, value] of Object.entries(input)) returnValue[key] = value;
    }
    return returnValue;
};
