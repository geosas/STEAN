/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * TDD for Format API.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */
process.env.NODE_ENV = "test";

import chai from "chai";
import chaiHttp from "chai-http";
import { IApiDoc, generateApiDoc, IApiInput, prepareToApiDoc } from "./constant";
import { server } from "../../server/index";

chai.use(chaiHttp);

const should = chai.should();

const docs: IApiDoc[] = [];

const addToApiDoc = (input: IApiInput) => {
    docs.push(prepareToApiDoc(input, "Format"));
};

addToApiDoc({
    api: `{infos} /Format Infos.`,
    apiName: "FormatInfos",
    apiDescription: `Format result JSON as default, DATAARRAY or CSV with comma separator, note that $value return result as text.`,
    result: ""
});

describe("Output formats", () => {
    describe("{get} resultFormat CSV", () => {
        it("Return result in CSV format.", (done) => {
            const infos = {
                api: `{get} ResultFormat as CSV`,
                apiName: "FormatCsv",
                apiDescription: 'Use $resultFormat=csv to get datas as csv format.<br><img src="./assets/csv.jpg" alt="csv result">',
                apiExample: { http: "/v1.0/Datastreams(1)/Observations?$top=20&$resultFormat=CSV" }
            };
            chai.request(server)
                .get(`/test${infos.apiExample.http}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("text/csv");
                    res.text.startsWith(`"@iot.${"id"}";`);
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });
    });

    describe("{get} resultFormat DATAARRAY", () => {
        it("Return Things in DATAARRAY format.", (done) => {
            const infos = {
                api: `{get} Things Things as DATAARRAY`,
                apiName: "FormatThingDATAARRAY",
                apiDescription: 'Use $resultFormat=DATAARRAY to get datas as DATAARRAY format.',
                apiExample: { http: "/v1.0/Things?$resultFormat=DATAARRAY" }
            };
            chai.request(server)
                .get(`/test${infos.apiExample.http}`)
                .end((err: any, res: any) => {                    
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body[0].component.length.should.eql(4);
                    res.body[0].component[0].should.eql("id");  
                    res.body[0].dataArray = [res.body[0].dataArray[0], res.body[0].dataArray[1]];
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });
        
        it("Return Datastream/Observations in DATAARRAY format.", (done) => {
            const infos = {
                api: `{get} Datastream Observations as DATAARRAY`,
                apiName: "FormatDataStreamDATAARRAY",
                apiDescription: 'Use $resultFormat=DATAARRAY to get datas as DATAARRAY format.',
                apiExample: { http: "/v1.0/Datastreams(1)/Observations?$resultFormat=DATAARRAY&$select=id,result" }
            };
            chai.request(server)
                .get(`/test${infos.apiExample.http}`)
                .end((err: any, res: any) => {    
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body[0].component.length.should.eql(2);
                    res.body[0].dataArray[0][1].should.eql(11.6666666666667);  
                    res.body[0].dataArray = [res.body[0].dataArray[0], res.body[0].dataArray[1]];
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });
    });


    describe("{get} resultFormat GRAPH", () => {
        it("Return result in GRAPH format.", (done) => {
            const infos = {
                api: `{get} ResultFormat as GRAPH`,
                apiName: "FormatGraph",
                apiDescription: 'Use $resultFormat=GRAPH to get datas into graphical representation.<br><img src="./assets/graph.jpg" alt="graph result">',
                apiExample: { http: "/v1.0/Datastreams(1)/Observations?$resultFormat=GRAPH" }
            };
            chai.request(server)
                .get(`/test${infos.apiExample.http}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("text/html");
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });
    });
    
    describe("{get} resultFormat GRAPHDATAS", () => {
        it("Return result in GRAPHDATAS format.", (done) => {
            const infos = {
                api: `{get} ResultFormat as GRAPHDATAS`,
                apiName: "FormatGraphDatas",
                apiDescription: "Use $resultFormat=GRAPHDATAS to get datas into echarts compatible format.",
                apiExample: { http: "/v1.0/Datastreams(1)/Observations?$resultFormat=GRAPHDATAS" }
            };
            chai.request(server)
                .get(`/test${infos.apiExample.http}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.should.include.keys(["ids", "values", "dates"]);

                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });
    });

    describe("Save apiDocFormat.", () => {
        it("Do not test only for save apiDoc", (done) => {
            generateApiDoc(docs, "apiDocFormat.js");
            done();
        });
    });
});
