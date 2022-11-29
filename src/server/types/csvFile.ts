/**
 * CsvFile interface.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

export interface ICsvColumns {
    column: string;
    datastream: string;
    featureOfInterest: string;
}

export interface ICsvFile {
    filename: string;
    tempTable: string;
    dataStreamId: bigint;
    columns: ICsvColumns[];
    header: string;
    duplicates: boolean;
}
