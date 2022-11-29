/**
 * getEntityName.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { _DBDATAS } from "../db/constants";

/**
 *
 * @param search search string
 * @returns name of the entity name or undefined if not found
 */

export function getEntityName(search: string): string | undefined {
    const testString: string | undefined = search
        .match(/[a-zA-Z_]/g)
        ?.join("")
        .trim();

    return testString
        ? _DBDATAS.hasOwnProperty(testString)
            ? testString
            : Object.keys(_DBDATAS).filter((elem: string) => _DBDATAS[elem].table == testString.toLowerCase() || _DBDATAS[elem].singular == testString)[0]
        : undefined;
}
