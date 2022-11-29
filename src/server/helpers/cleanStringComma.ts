/**
 * cleanList.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

/**
 *
 * @param input: string
 * @returns clean string without undesired comma(s)
 */
export const cleanStringComma = (input: string): string => {
    const temp = input.split(",");
    return temp.filter((word: string) => word.trim() != "").join(", ");
}