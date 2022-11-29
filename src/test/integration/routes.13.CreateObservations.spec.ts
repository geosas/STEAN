/**
 * TDD for ultime tests API.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */
process.env.NODE_ENV = "test";

import chai from "chai";
import chaiHttp from "chai-http";
import { IApiDoc, IApiInput, prepareToApiDoc, generateApiDoc, identification, keyTokenName, defaultPost } from "./constant";

import { server } from "../../server/index";

chai.use(chaiHttp);

const should = chai.should();

const docs: IApiDoc[] = [];



const addToApiDoc = (input: IApiInput) => {
    docs.push(prepareToApiDoc(input, "CreateObservations"));
};

addToApiDoc({
    api: `{infos} /CreateObservations Infos.`,
    apiName: "InfosCreateObservations",
    apiDescription: "Create observations",
    apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#82",
    result: ""
});

describe("endpoint : Create Observations", () => {
    let token = "";

    before((done) => {
        
        chai.request(server)
            .post("/test/v1.0/login")
            .send(identification)
            .end((err: any, res: any) => {
                token = String(res.body["token"]);
                done();
            });
    });

    it("should return 3 observations links added that was added", (done) => {
        const datas = {
            "Datastream": { "@iot.id": 1 },
            "components": ["phenomenonTime", "result", "resultTime", "FeatureOfInterest/id"],
            "dataArray@iot.count": 3,
            "dataArray": [
                ["2017-01-13T10:20:00.000Z", 90, "2017-01-13T10:20:00.000Z", 1],
                ["2017-01-13T10:21:00.000Z", 91, "2017-01-13T10:21:00.000Z", 1],
                ["2017-02-13T10:22:00.000Z", 92, "2017-02-13T10:22:00.000Z", 1],
                ["2017-02-13T10:22:00.000Z", 93, "2017-02-13T10:22:00.000Z", 1]
            ]
        };
        const infos = {
            api: `{post} CreateObservations CreateObservations FOI.`,
            apiName: "PostObservationsCreateObservationsFoiCreateObservations",
            apiDescription: "Create Observations with CreateObservations",
            apiExample: {
                http: "/v1.0/CreateObservations",
                curl: defaultPost("curl", "KEYHTTP", datas),
                javascript: defaultPost("javascript", "KEYHTTP", datas),
                python: defaultPost("python", "KEYHTTP", datas)
            },
            apiParamExample: datas
        };

        chai.request(server)
            .post("/test/v1.0/CreateObservations")
            .send(infos.apiParamExample)
            .set("Cookie", `${keyTokenName}=${token}`)
            .end((err: any, res: any) => {
                should.not.exist(err);
                res.status.should.equal(201);
                res.type.should.equal("application/json");
                res.body[0].should.include("/v1.0/Observations(");
                res.body[1].should.include("/v1.0/Observations(");
                res.body[2].should.include("/v1.0/Observations(");
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    it("should throw an error if datastream does not exist", (done) => {
        chai.request(server)
            .post("/test/v1.0/CreateObservations")
            .send({
                "Datastream": { "@iot.id": `${BigInt(Number.MAX_SAFE_INTEGER)}` },
                "components": ["phenomenonTime", "result", "resultTime", "FeatureOfInterest/id"],
                "dataArray@iot.count": 3,
                "dataArray": [
                    ["2017-01-13T10:20:00.000Z", 90, "2017-01-13T10:20:00.000Z", 1],
                    ["2017-01-13T10:21:00.000Z", 91, "2017-01-13T10:21:00.000Z", 1],
                    ["2017-01-13T10:22:00.000Z", 92, "2017-01-13T10:22:00.000Z", 1]
                ]
            })
            .set("Cookie", `${keyTokenName}=${token}`)
            .end((err: Error, res: any) => {
                should.not.exist(err);
                res.status.should.equal(404);
                res.type.should.equal("application/json");
                docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4);
                generateApiDoc(docs, "CreateObservations.js");
                
                done();
            });
    });
});
