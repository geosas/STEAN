/**
 * cte interface.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

interface IQuery {
    select: string[];
    from: string[];
    where: string[];
    groupBy: string[];
    order: string[];
    limit: number;
    offset: number;
    singular: boolean;
}

export interface ICte {
    [key: string]: IQuery;
}

export enum OperationType {
    Table,
    Relation,
    Association
}
