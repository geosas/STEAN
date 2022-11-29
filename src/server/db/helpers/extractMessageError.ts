/**
 * extractMessageError.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

/**
 *
 * @param input string of knex sql error
 * @returns string error without other information
 */

export const extractMessageError = (input: string): string => {
    const temp = input.split("-");
    return input.length === 0 ? input : temp[temp.length - 1].trim();
};
