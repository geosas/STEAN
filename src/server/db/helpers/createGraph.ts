/**
 * createGraph.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { logDebug, message } from "../../logger";

// Create object compatible with Apache Echarts
// https://echarts.apache.org/examples/en/index.html
export interface IGraphDatas {
    title: string;
    keys: string[];
    ids: string[];
    values: { [key: string]: number[] };
    dates: string[];
}

export const createGraph = (input: JSON, mainTitle: string): IGraphDatas | undefined => {
    message(true, "CLASS", "createGraph");

    if (input)
        try {
            const multi = typeof input[0]["result"] === "object" && input[0]["result"] != null;
            const keys = multi ? Object.keys(input[0]["result"]) : ["result"];
            const values: { [key: string]: number[] } = {};

            // create blank value to avoid undefined error
            keys.forEach((elem: string) => (values[elem] = []));

            const returnResult: IGraphDatas = {
                title: mainTitle,
                keys: keys,
                ids: [],
                values: values,
                dates: []
            };

            Object(input).forEach((inputElement: JSON) => {
                returnResult.ids.push(inputElement["id"]);
                returnResult.dates.push(inputElement["date"]);
                if (multi) {
                    Object.keys(inputElement["result"]).forEach((subElement: string) => {
                        returnResult.values[subElement].push(inputElement["result"][subElement]);
                    });
                } else if (returnResult.values["result"]) returnResult.values["result"].push(inputElement["result"]);
            });

            return returnResult;
        } catch (error) {
            logDebug(error);
            return;
        }
};
