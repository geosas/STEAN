/**
 * Logs ILogs interface.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

export interface ILogs {
    method?: string;
    url?: string;
    datas?: JSON;
    query?: string;
    result?: string;
    error?: string;
}
