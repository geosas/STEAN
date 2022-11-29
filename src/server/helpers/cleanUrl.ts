/**
 * cleanUrl.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

/**
 *
 * @param input: string
 * @returns clean string with ["$", "&", "?"] undesired removed
 */

export const cleanUrl = (input: string): string => {
    while (["$", "&", "?"].includes(input[input.length - 1])) {
        input = input.slice(0, -1);
    }

    while (["&", "?"].includes(input[0])) {
        input = input.slice(1);
    }
    return input;
};
