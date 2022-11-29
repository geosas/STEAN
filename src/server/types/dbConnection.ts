/**
 * DbConnection interface.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

export interface IDbConnection {
    host: string | undefined;
    user: string | undefined;
    password: string | undefined;
    database: string | undefined;
    port: number | undefined;
}
