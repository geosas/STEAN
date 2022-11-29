/**
 * logConnection.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { _CONFIGFILE } from "../configuration";
import { message } from "./message";

export const logConnection = (key: string): void => {
    message(false, "ENV", "Host", _CONFIGFILE[key].pg_host);
    message(false, "ENV", "Database", _CONFIGFILE[key].pg_database);
    if (key != "admin") message(false, "ENV", "Api version", _CONFIGFILE[key].apiVersion);
    message(false, "ENV", "Port", _CONFIGFILE[key].pg_port);
    message(false, "ENV", "User", _CONFIGFILE[key].pg_user);
    if (key !== "admin") message(false, "ENV", "Listen port", _CONFIGFILE[key].port);
};
