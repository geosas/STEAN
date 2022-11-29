/**
 * Helpers for user admin.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { _DBADMIN } from "../db/constants";
import { _CONFIGFILE } from "../configuration";

export const testRoutes = (input: string): string => {
    let result: string | undefined =
        input.trim() != "/"
            ? input
                  .split("/")
                  .reverse()
                  .filter((word) => word.trim() != "")[0]
                  .toUpperCase()
            : "";
    return result.includes("(") ? result.split("(")[0] : result;
};

export const emailIsValid = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const checkPassword = (str: string): boolean => {
    // at least one number, one lowercase and one uppercase letter
    // at least six characters that are letters, numbers or the underscore
    return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])\w{6,}$/.test(str);
};
