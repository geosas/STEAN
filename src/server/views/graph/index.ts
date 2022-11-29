/**
 * Chart Index HTML / JS maker.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

/* eslint-disable quotes */

import { _DBDATAS } from "../../db/constants";
import { message } from "../../logger";
import { IKeyValues } from "../../types";
import koa from "koa";
import {  jsFile } from "../js";
import { cssFile } from "../css";

export const graphHtml = (ctx: koa.Context, datas: IKeyValues[] | IKeyValues | undefined): string => {
    message(true, "HEAD", "graphHtml");

    const edit =
        "async function editDataClicked(id, params) { new Observation({ title: `${params.seriesName}`, date: params.name, value : params.data.toString(), id: id }); } ";

    return `<!DOCTYPE text/html>
                <html lang="fr">
                    <head>
                        <style>${cssFile("query.css")}</style>
                        <!-- htmlmin:ignore --><script>${jsFile("echarts.min.js")}</script><!-- htmlmin:ignore -->
                        <script>${jsFile("modal.js")}</script>
                    </head>

                    <body>
                        <div id="graphContainer" style="background-color: rgb(240, 242, 243);">
                            <div id="graph" style="width:100%; height:100%;"></div>
                        </div>
                        <script>
                            const linkBase = "${ctx._linkBase}/${ctx._version}";
                            const value = ${JSON.stringify(datas, null, 2)};
                            ${jsFile("graph.js")}
                            showGraph(value);
                            ${edit}                              
                        </script>
                    </body>
                </html>`;  
                    

};
