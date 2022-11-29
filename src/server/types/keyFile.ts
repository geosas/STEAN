/**
 * IKeyValues IKeyString interface.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

export interface IKeyString {
    [key: string]: string;
}

export type IKeyValue = string | number | number[] | bigint | IKeyValues | IKeyValues[];

export interface IKeyValues {
    [key: string]: IKeyValue;
}
