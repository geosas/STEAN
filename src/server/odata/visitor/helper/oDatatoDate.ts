/**
 * oDatatoDate.
 *
 * @copyright 2022-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

export function oDatatoDate(input: string): string | undefined {
    input = input.replace(/\//g, "-").replace(/'/g, "").replace(/%27/g, "");
    const regexDateStartDay = /^[0-9]{2}[-][0-9]{2}[-][0-9]{4}$/g;
    const regexDateStartYear = /^[0-9]{4}[-][0-9]{2}[-][0-9]{2}$/g;
    const regexHour = /^[0-9]{2}[:][0-9]{2}[:][0-9]{2}$/g;
    const regexDateHourStartDay = /^[0-9]{2}[-][0-9]{2}[-][0-9]{4} [0-9]{2}[:][0-9]{2}$/g;
    const regexDateHourStartYear = /^[0-9]{4}[-][0-9]{2}[-][0-9]{2} [0-9]{2}[:][0-9]{2}$/g;
    if (regexDateStartDay.test(input) == true) return `'${input}','DD-MM-YYYY'`;
    if (regexDateStartYear.test(input) == true) return `'${input}','YYYY-MM-DD'`;
    if (regexHour.test(input) == true) return `'${input}','HH24:MI:SS'`;
    if (regexDateHourStartDay.test(input) == true) return `'${input}','DD-MM-YYYY HH24:MI:SS'`;
    if (regexDateHourStartYear.test(input) == true) return `'${input}','YYYY-MM-DDHH24:MI:SS'`;
}