/**
 * getExpandList.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { message } from "../logger";
import { PgVisitor } from "../odata";

 export const getExpandList = (input: PgVisitor | undefined): string[] => {
    message(true, "DEBUG", "getExpandList", "getExpandList");
    const returnValue: string[] = [];
    if (input)
        input.includes.forEach((element: PgVisitor) => {
            if (element.ast.type === "ExpandItem") returnValue.push(element.ast.raw.split("(")[0]);
        });
    return returnValue;
}