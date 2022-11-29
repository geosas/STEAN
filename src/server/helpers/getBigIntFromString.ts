/**
 * getBigIntFromString.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { logDebug } from "../logger";

/**
 *
 * @param input string or number search
 * @returns the bigint extract number
 */

export const getBigIntFromString = (input: string | bigint | number): bigint | undefined => {
    if (input) {
        try {
            if (typeof input == "string") {
                const testString = input.match(/\([^\d]*(\d+)[^\d]*\)/);
                return testString ? BigInt(testString[1]) : BigInt(input.match(/[0-9]/g)?.join("") as string);
            }
            return BigInt(input);
        } catch (error) {
            logDebug(error);
        }
    }
};
