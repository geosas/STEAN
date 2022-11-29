/**
 * ConfigFile interface.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */
export interface IConfigFile {
    name: string; // item of the config file
    key?: string; // key for crypto
    crypt?: string;
    pg_host: string;
    pg_port: number;
    port: number;
    pg_user: string;
    pg_database: string;
    pg_password: string;
    apiVersion: string;
    date_format: string;
    webSiteDoc: string;
    nb_page: number;
    lineLimit: number;
    destroy?: boolean;
    createUser?: boolean;
    pg_migrate?: number;
    forceHttps: boolean;
}
export interface IConfigFiles {
    [key: string]: IConfigFile;
}
