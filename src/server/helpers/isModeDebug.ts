/**
 * returnBody.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

export const isModeDebug = (change?: boolean): boolean => {
    if (change) process.env.DEBUG = change ? "true" : "false";
    // return true;
    return process.env.DEBUG?.trim() === "true" || false;
};
