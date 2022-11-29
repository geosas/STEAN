/**
 * ReturnResult interface.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { IEntity, IKeyValues } from ".";

export interface IReturnResult {
    // result: string[] | string | number | bigint | IKeyValues[] | IKeyValues | undefined;
    id: bigint | undefined;
    nextLink: string | undefined;
    prevLink: string | undefined;
    entity: IEntity | undefined;
    value: IKeyValues[] | IKeyValues | undefined;
    body: IKeyValues[] | IKeyValues | string | undefined;
    total: bigint | undefined;
}
