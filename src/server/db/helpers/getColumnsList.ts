/**
 * getColumnsList.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { getEntityName } from "../../helpers";
import { _DBDATAS } from "../constants";

export const getColumnsList = (tableName: string): string[] | undefined => {
    if (tableName.trim() == "") return;
    const name = getEntityName(tableName);
    if (!name) return;
    const returnValue: string[] = [];
    Object.keys(_DBDATAS[name].columns).forEach((elem: string) => {
        returnValue.push(`"${elem}"${_DBDATAS[name].columns[elem].create.includes("jsonb") ? "::text" : ""}`);
    });
    return returnValue;
}