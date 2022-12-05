/**
 * Entity interface.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { IKeyString } from ".";

export interface IEntityColumnForm {
        readonly type: string;
        readonly alias?: string;
        readonly entity?: string;
        readonly?: boolean;
}

interface IEntityColumn {
    [key: string]: {
        readonly comment: string;
        readonly create: string;
        readonly alias?: string;
        readonly test?: string;
        readonly dataList?: { [key: string]: string };
        readonly form?: IEntityColumnForm;
    };
}

export enum RELATIONS {
    belongsTo,
    belongsToMany,
    hasMany
}

interface IEntityRelation {
    type: RELATIONS; // relation Type
    expand: string; // table name
    link: string; // table name
    entityName: string; // table name
    tableName: string; // table reference
    relationKey: string; // column name
    entityColumn: string; // column name
    tableKey: string; // index key column name
}

export interface IEntity {
    readonly name: string;
    readonly clone?: string;
    readonly singular: string;
    readonly table: string;
    readonly order: number;
    readonly columns: IEntityColumn;
    readonly migrationTest: boolean;
    readonly relations: { [key: string]: IEntityRelation };
    readonly constraints?: IKeyString;
    readonly indexes?: IKeyString;
    readonly after?: string;
}
