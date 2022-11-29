/**
 * getColumnsListType.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { getEntityName } from "../../helpers";
import { IEntityColumnForm } from "../../types";
import { _DBDATAS } from "../constants";

export const getColumnsListType = (tableName: string): {[key: string]: IEntityColumnForm} | undefined => {
    if (tableName.trim() == "") return;
    const name = getEntityName(tableName);
    if (!name) return;
    const returnValue: {[key: string]: IEntityColumnForm} = {};
    Object.keys(_DBDATAS[name].columns).forEach((elem: string) => {
        let temp = _DBDATAS[name].columns[elem].form;
        if(temp) {
            temp.readonly = (_DBDATAS[name].columns[elem].alias != undefined);
            returnValue[temp.alias ? temp.alias : elem] = temp;
        }
    });
    return returnValue;
}