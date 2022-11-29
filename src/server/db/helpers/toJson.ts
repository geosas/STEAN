/**
 * toJson.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

// stringify can't serialize bigInt
export const toJson = (data: any): string => {
    return JSON.stringify(data, (_, v) => (typeof v === "bigint" ? `${v}#bigint` : v)).replace(/"(-?\d+)#bigint"/g, (_, a) => a);
};
