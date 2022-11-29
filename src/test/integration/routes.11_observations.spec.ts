/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * TDD for things API.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */
process.env.NODE_ENV = "test";

import chai from "chai";
import chaiHttp from "chai-http";
import {
    IApiDoc,
    generateApiDoc,
    IApiInput,
    prepareToApiDoc,
    createListColumns,
    identification,
    keyTokenName,
    defaultDelete,
    defaultPatch,
    defaultPost,
    defaultGet
} from "./constant";
import { server } from "../../server/index";
import { dbTest } from "../dbTest";
import { _DBDATAS } from "../../server/db/constants";
import { IEntity } from "../../server/types";
import { testsKeys as Datastreams_testsKeys } from "./routes.07_datastreams.spec";
export const testsKeys = [
    "@iot.id",
    "@iot.selfLink",
    "Datastream@iot.navigationLink",
    "FeatureOfInterest@iot.navigationLink",
    "MultiDatastream@iot.navigationLink",
    "result",
    "phenomenonTime",
    "resultTime",
    "resultQuality",
    "validTime",
    "parameters"
];

chai.use(chaiHttp);

const should = chai.should();

const docs: IApiDoc[] = [];
const entity: IEntity = _DBDATAS.Observations;



const addToApiDoc = (input: IApiInput) => {
    docs.push(prepareToApiDoc(input, entity.name));
};

addToApiDoc({
    api: `{infos} ${entity.name} Infos`,
    apiName: `Infos${entity.name}`,
    apiDescription: `An Observation is the act of measuring or otherwise determining the value of a property.<br>
    An Observation in SensorThings represents a single Sensor reading of an ObservedProperty.<br>A physical device, a Sensor, sends Observations to a specified Datastream.<br>An Observation requires a FeatureOfInterest entity, if none is provided in the request, the Location of the Thing associated with the Datastream, will be assigned to the new Observation as the FeatureOfInterest`,
    apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#31",
    result: ""
});

let firstID = 0;

describe("endpoint : Observations", () => {
    let myId = "";
    let success: string[] = [];
    let params: string[] = [];
    let token = "";

    before((done) => {
        
        createListColumns(entity.table, (err: any, valueSuccess: any, valueParam: any) => {
            success = valueSuccess;
            params = valueParam;
            Object.keys(entity.relations).forEach((elem: string) => {
                success.push(`{relation} [${elem}] ${elem}@iot.navigationLink`);
                if (entity.relations[elem].tableName == entity.table) {
                    params.push(`{relation} ${elem} ${elem}@iot.navigationLink`);
                } else {
                    params.push(`{relation} [${elem}] ${elem}@iot.navigationLink`);
                }
            });
            chai.request(server)
                .post("/test/v1.0/login")
                .send(identification)
                .end((err: any, res: any) => {
                    token = String(res.body["token"]);
                    done();
                });
        });
    });

    describe(`{get} ${entity.name}`, () => {
        it("Return all Observations", (done) => {
            const infos = {
                api: `{get} ${entity.name} Get all`,
                apiName: `GetAll${entity.name}`,
                apiDescription: `Retrieve all ${entity.name}.`,
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#37",
                apiExample: {
                    http: `/v1.0/${entity.name}`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                },
                apiSuccess: ["{number} id @iot.id", "{relation} selfLink @iot.selfLink", ...success]
            };
            dbTest(entity.table)
                .count()
                .then((result) => {
                    const nb = Number(result[0]["count"]);
                    chai.request(server)
                        .get(`/test/v1.0/${entity.name}`)
                        .end((err, res) => {
                            should.not.exist(err);
                            res.status.should.equal(200);
                            res.type.should.equal("application/json");
                            res.body.value.length.should.eql(nb);
                            res.body.should.include.keys("@iot.count", "value");
                            res.body.value[0].should.include.keys(testsKeys);
                            res.body.value = [res.body.value[0], res.body.value[1], "..."];
                            addToApiDoc({ ...infos, result: res });
                            firstID = res.body.value[0]["@iot.id"];
                            docs[docs.length - 1].apiErrorExample = JSON.stringify({ "code": 404, "message": "Not Found" }, null, 4);
                            done();
                        });
                });
        });

        it(`Return Observation id: ${firstID}`, (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get one`,
                apiName: `GetOne${entity.name}`,
                apiDescription: "Get a specific Observations.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#38",
                apiExample: {
                    http: `/v1.0/${entity.name}(${firstID})`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                }
            };
            chai.request(server)
                .get(`/test${infos.apiExample.http}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.should.include.keys(testsKeys);
                    res.body["@iot.selfLink"].should.contain(`/Observations(${firstID})`);
                    res.body["@iot.id"].should.eql(firstID);
                    res.body["Datastream@iot.navigationLink"].should.contain(`/Observations(${firstID})/Datastream`);
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return error if Observation does not exist", (done) => {
            chai.request(server)
                .get(`/test/v1.0/${entity.name}(${BigInt(Number.MAX_SAFE_INTEGER)})`)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.equal(404);
                    res.type.should.equal("application/json");
                    docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4).replace(Number.MAX_SAFE_INTEGER.toString(), firstID.toString());
                    done();
                });
        });

        it(`Return all Observations in the Datastream that holds the id 10`, (done) => {
            const infos = {
                api: `{get} Datastreams(10)/${entity.name} Get all from Datastream`,
                apiName: `GetDatastreams${entity.name}`,
                apiDescription: "Get Observations from Datastream.",
                apiExample: {
                    http: `/v1.0/Datastreams(10)/${entity.name}`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                }
            };
            chai.request(server)
                .get(`/test${infos.apiExample.http}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.should.include.keys("value");

                    res.body.value = [res.body.value[0], res.body.value[1], "..."];
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        // it(`Return all Observations references in the Datastream that holds the id ${firstID}`, (done) => {
        //     const infos = {
        //         api: `{get} Datastreams(10)/${entity.name}/$ref get references from Datastream`,
        //         apiName: `GetDatastreams${entity.name}/$ref`,
        //         apiDescription: `Get ${entity.name}s refs from Datastreams`,
        //         apiExample: {
        //             http: `/v1.0/Datastreams(10)/${entity.name}/$ref`,
        //             curl: defaultGet("curl", "KEYHTTP"),
        //             javascript: defaultGet("javascript", "KEYHTTP"),
        //             python: defaultGet("python", "KEYHTTP")
        //         }
        //     };
        //     chai.request(server)
        //         .get(`/test${infos.apiExample.http}`)
        //         .end((err: any, res: any) => {
        //             should.not.exist(err);
        //             res.status.should.equal(200);
        //             res.type.should.equal("application/json");
        //             res.body.should.include.keys("value");
        //             res.body.value.length.should.eql(3);
        //             res.body.value[0]["@iot.selfLink"].should.contain("/Observations(8)");
        //             addToApiDoc({ ...infos, result: res });
        //             done();
        //         });
        // });

        it(`Return all Observations and $expand query option`, (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get and expands Datastreams`,
                apiName: `GetExpandDatastreams${entity.name}`,
                apiDescription: "Get a specific Observation and expand Datastream.",
                apiExample: {
                    http: `/v1.0/${entity.name}(1)?$expand=Datastream`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                }
            };
            chai.request(server)
                .get(`/test${infos.apiExample.http}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.should.include.keys(testsKeys.filter((elem) => elem !== "Datastream@iot.navigationLink"));
                    res.body.should.include.keys("Datastream");
                    res.body.Datastream.should.include.keys(Datastreams_testsKeys);
                    res.body["@iot.id"].should.eql(1);
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return Observations with multiple select odata", (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get with Multi Select`,
                apiName: `GetSelectPhenomenonTime${entity.name}`,
                apiDescription: "Retrieve specified phenomenonTime, result for a specific Observations.",
                apiExample: {
                    http: `/v1.0/${entity.name}(1)?$select=phenomenonTime,result`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                }
            };
            chai.request(server)
                .get(`/test${infos.apiExample.http}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    Object.keys(res.body).length.should.eql(2);
                    res.body.should.include.keys("phenomenonTime");
                    res.body.should.include.keys("result");
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return Observations with multiple result from multiDatastreams", (done) => {
            const infos = {
                api: `{get} Observations with Multi Results`,
                apiName: `GetSelectObservationsMultiResult`,
                apiDescription: "Retrieve observations with multi result.",
                apiExample: {
                    http: `/v1.0/${entity.name}(14)`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                }
            };
            chai.request(server)
                .get(`/test${infos.apiExample.http}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.result.should.include.keys("Humidity");
                    res.body.result.should.include.keys("Temperature");
                    res.body.result.should.include.keys("Battery");
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });
        it("Return errors with spliResult on Observation entity Only", (done) => {
            chai.request(server)
                .get(`/test/v1.0/${entity.name}?$splitResult=ALL`)
                .end((err: any, res: any) => {
                    res.status.should.equal(400);
                    res.type.should.equal("application/json");
                    res.body.detail.should.contain("Split result not allowed");
                    done();
                });
        });
        let temp = 0;
        it("Return Observations with multiple result and split results", (done) => {
            const infos = {
                api: `{get} Get with Split Results`,
                apiName: `GetSelectObservationsSplitResultAll`,
                apiDescription: "Retrieve observations with splitted multi result.",
                apiExample: {
                    http: `/v1.0/MultiDatastreams(1)/${entity.name}?$splitResult=all`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                }
            };
            chai.request(server)
                .get(`/test${infos.apiExample.http}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    Object.keys(res.body).length.should.eql(2);
                    res.body.value[0].should.include.keys("humidity");
                    res.body.value[0].should.include.keys("temperature");
                    temp = res.body.value[0]["temperature"];
                    res.body.value[0].should.include.keys("battery");
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return Observations with multiple result and split result Temperature", (done) => {
            const infos = {
                api: `{get} Get with Split Result Property`,
                apiName: `GetSelectObservationsSplitResultTemp`,
                apiDescription: "Retrieve observations with splitted Temperature result.",
                apiExample: {
                    http: `/v1.0/MultiDatastreams(1)/${entity.name}?$splitResult=Temperature`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                }
            };
            chai.request(server)
                .get(`/test${infos.apiExample.http}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    Object.keys(res.body).length.should.eql(2);
                    Object.keys(res.body).length.should.eql(2);
                    res.body.value[0].should.include.keys("result");
                    res.body.value[0]["result"].should.eql(temp);
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });
    });

    describe(`{post} ${entity.name} Create`, () => {
        let myError = "";
        it("Return added Observation", (done) => {
            const datas = {
                "phenomenonTime": "2017-02-07T18:02:00.000Z",
                "resultTime": "2017-02-07T18:02:05.000Z",
                "result": 21.6,
                "Datastream": { "@iot.id": 10 }
            };
            const infos = {
                api: `{post} ${entity.name} Post with existing FOI`,
                apiName: `Post${entity.name}`,
                apiDescription: "Post a new Observation.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#62",
                apiExample: {
                    http: `/v1.0/${entity.name}`,
                    curl: defaultPost("curl", "KEYHTTP", datas),
                    javascript: defaultPost("javascript", "KEYHTTP", datas),
                    python: defaultPost("python", "KEYHTTP", datas)
                },
                apiParam: params,
                apiParamExample: datas
            };
            chai.request(server)
                .post(`/test${infos.apiExample.http}`)
                .send(infos.apiParamExample)
                .set("Cookie", `${keyTokenName}=${token}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(201);
                    res.type.should.equal("application/json");
                    res.body.should.include.keys(testsKeys);
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return Error if the payload is malformed", (done) => {
            chai.request(server)
                .post(`/test/v1.0/${entity.name}`)
                .send({})
                .set("Cookie", `${keyTokenName}=${token}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(400);
                    res.type.should.equal("application/json");
                    myError = JSON.stringify(res.body, null, 4);
                    docs[docs.length - 1].apiErrorExample = myError;
                    done();
                });
        });

        it("Return updated Observation with FeatureOfInterest", (done) => {
            const datas = {
                "phenomenonTime": "2017-02-07T18:02:00.000Z",
                "resultTime": "2017-02-07T18:02:05.000Z",
                "result": 21.6,
                "FeatureOfInterest": {
                    "name": "Au Comptoir Vénitien (Created new location)",
                    "description": "Au Comptoir Vénitien",
                    "encodingType": "application/vnd.geo+json",
                    "feature": {
                        "type": "Point",
                        "coordinates": [48.11829243294942, -1.717928984533772]
                    }
                },
                "Datastream": { "@iot.id": 6 }
            };
            const infos = {
                api: `{post} ${entity.name} Post with FOI`,
                apiName: `PostNewFoi${entity.name}`,
                apiDescription: "Post a new Observation.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#63",
                apiExample: {
                    http: `/v1.0/${entity.name}`,
                    curl: defaultPost("curl", "KEYHTTP", datas),
                    javascript: defaultPost("javascript", "KEYHTTP", datas),
                    python: defaultPost("python", "KEYHTTP", datas)
                },
                apiParamExample: datas
            };
            chai.request(server)
                .post(`/test${infos.apiExample.http}`)
                .send(infos.apiParamExample)
                .set("Cookie", `${keyTokenName}=${token}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(201);
                    res.type.should.equal("application/json");
                    res.body.should.include.keys(testsKeys);
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return updated from Datastream", (done) => {
            const datas = {
                "phenomenonTime": "2017-02-07T18:02:00.000Z",
                "resultTime": "2017-02-07T18:02:05.000Z",
                "result": 21.6
            };
            const infos = {
                api: `{post} ${entity.name} Post from Datastream`,
                apiName: `PostDatastreams${entity.name}`,
                apiDescription: "POST Observation with existing Datastream.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#62",
                apiExample: {
                    http: `/v1.0/Datastreams(10)/${entity.name}`,
                    curl: defaultPost("curl", "KEYHTTP", datas),
                    javascript: defaultPost("javascript", "KEYHTTP", datas),
                    python: defaultPost("python", "KEYHTTP", datas)
                },
                apiParamExample: datas
            };
            chai.request(server)
                .post(`/test${infos.apiExample.http}`)
                .send(infos.apiParamExample)
                .set("Cookie", `${keyTokenName}=${token}`)
                .end(async (err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(201);
                    res.type.should.equal("application/json");
                    res.body.should.include.keys(testsKeys);
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return updated Observation from Datastream with FeatureOfInterest", (done) => {
            const datas = {
                "phenomenonTime": "2017-02-07T18:02:00.000Z",
                "resultTime": "2017-02-07T18:02:05.000Z",
                "result": 21.6,
                "FeatureOfInterest": {
                    "name": "Au Comptoir Vénitien (Created new location)",
                    "description": "Au Comptoir Vénitien",
                    "encodingType": "application/vnd.geo+json",
                    "feature": {
                        "type": "Point",
                        "coordinates": [48.11829243294942, -1.717928984533772]
                    }
                }
            };
            const infos = {
                api: `{post} ${entity.name} Post from Datastream and FOI`,
                apiName: `PostObservationsDatastreamsFOI${entity.name}`,
                apiDescription: "POST Observation with existing Datastream.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#62",
                apiExample: {
                    http: `/v1.0/Datastreams(10)/${entity.name}`,
                    curl: defaultPost("curl", "KEYHTTP", datas),
                    javascript: defaultPost("javascript", "KEYHTTP", datas),
                    python: defaultPost("python", "KEYHTTP", datas)
                },
                apiParamExample: datas
            };
            chai.request(server)
                .post(`/test${infos.apiExample.http}`)
                .send(infos.apiParamExample)
                .set("Cookie", `${keyTokenName}=${token}`)
                .end(async (err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(201);
                    res.type.should.equal("application/json");
                    res.body.should.include.keys(testsKeys);
                    const observationId = res.body["@iot.id"];
                    dbTest
                        .raw("select id from observation where featureofinterest_id = (select id from featureofinterest order by id desc limit 1);")
                        .then((testRes) => {
                            testRes.rows[0].id.should.eql(String(observationId));
                            addToApiDoc({ ...infos, result: res });
                            done();
                        })
                        .catch((e) => console.log(e));
                });
        });

        it("Return updated Observation from MultiDatastream", (done) => {
            const datas = {
                "phenomenonTime": "2017-02-07T18:02:00.000Z",
                "resultTime": "2017-02-07T18:02:05.000Z",
                "result": {
                    "temperature": 10.1,
                    "humidity": 10.2,
                    "battery": 10.3
                },
                "FeatureOfInterest": {
                    "name": "Au Comptoir Vénitien (Created new location)",
                    "description": "Au Comptoir Vénitien",
                    "encodingType": "application/vnd.geo+json",
                    "feature": {
                        "type": "Point",
                        "coordinates": [48.11829243294942, -1.717928984533772]
                    }
                }
            };
            const infos = {
                api: `{post} ${entity.name} Post from MultiDatastream`,
                apiName: `PostFromMultiDatastreams${entity.name}`,
                apiDescription: "POST Observation with existing MultiDatastream.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#62",
                apiExample: {
                    http: `/v1.0/MultiDatastreams(10)/${entity.name}`,
                    curl: defaultPost("curl", "KEYHTTP", datas),
                    javascript: defaultPost("javascript", "KEYHTTP", datas),
                    python: defaultPost("python", "KEYHTTP", datas)
                },
                apiParamExample: datas
            };
            chai.request(server)
                .post(`/test${infos.apiExample.http}`)
                .send(infos.apiParamExample)
                .set("Cookie", `${keyTokenName}=${token}`)
                .end(async (err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(201);
                    res.type.should.equal("application/json");
                    res.body.should.include.keys(testsKeys);
                    res.body.result["Humidity"].should.eql(10.2);
                    res.body.result["Temperature"].should.eql(10.1);
                    res.body.result["Battery"].should.eql(10.3);
                    done();
                });
        });

        it("Return error results are different of multiObservationDataTypes", (done) => {
            const datas = {
                "phenomenonTime": "2017-02-07T18:02:00.000Z",
                "resultTime": "2017-02-07T18:02:05.000Z",
                "result": {
                    "temperature": 10.1,
                    "humidity": 10.2
                },
                "FeatureOfInterest": {
                    "name": "Au Comptoir Vénitien (Created new location)",
                    "description": "Au Comptoir Vénitien",
                    "encodingType": "application/vnd.geo+json",
                    "feature": {
                        "type": "Point",
                        "coordinates": [48.11829243294942, -1.717928984533772]
                    }
                }
            };
            const infos = {
                api: `{post} ${entity.name} Post from MultiDatastream`,
                apiName: `PostObservationsMultiDatastreams${entity.name}`,
                apiDescription: "POST Observation with existing MultiDatastream.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#62",
                apiExample: {
                    http: `/v1.0/MultiDatastreams(10)/${entity.name}`,
                    curl: defaultPost("curl", "KEYHTTP", datas),
                    javascript: defaultPost("javascript", "KEYHTTP", datas),
                    python: defaultPost("python", "KEYHTTP", datas)
                },
                apiParamExample: datas
            };
            chai.request(server)
                .post(`/test${infos.apiExample.http}`)
                .send(infos.apiParamExample)
                .set("Cookie", `${keyTokenName}=${token}`)
                .end(async (err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(400);
                    res.type.should.equal("application/json");
                    res.body.detail.should.eql("Size of list of results (2) is not equal to size of unitOfMeasurements (3)");
                    done();
                });
        });
    });

    describe(`{patch} ${entity.name} Patch`, () => {
        it("Return updated Observation", (done) => {
            dbTest("observation")
                .select("*")
                .orderBy("id")
                .then((items) => {
                    const itemObject = items[0];
                    myId = itemObject.id;
                    const datas = {
                        "phenomenonTime": "2016-11-18T11:04:15.790Z",
                        "resultTime": "2016-11-18T11:04:15.790Z"
                    };
                    const infos = {
                        api: `{patch} ${entity.name} Patch one`,
                        apiName: `Patch${entity.name}`,
                        apiDescription: "Patch an Observation.",
                        apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#65",
                        apiExample: {
                            http: `/v1.0/${entity.name}(${myId})`,
                            curl: defaultPatch("curl", "KEYHTTP", datas),
                            javascript: defaultPatch("javascript", "KEYHTTP", datas),
                            python: defaultPatch("python", "KEYHTTP", datas)
                        },
                        apiParamExample: datas
                    };
                    chai.request(server)
                        .patch(`/test${infos.apiExample.http}`)
                        .send(infos.apiParamExample)
                        .set("Cookie", `${keyTokenName}=${token}`)
                        .end((err: any, res: any) => {
                            should.not.exist(err);
                            res.status.should.equal(200);
                            res.type.should.equal("application/json");
                            res.body.should.include.keys(testsKeys);
                            const newItems = res.body;
                            newItems.resultTime.should.not.eql(itemObject.resultTime);
                            addToApiDoc({ ...infos, result: res });
                            done();
                        });
                });
        });

        it("Return Error if the Observation does not exist", (done) => {
            chai.request(server)
                .patch(`/test/v1.0/${entity.name}(${BigInt(Number.MAX_SAFE_INTEGER)})`)
                .send({
                    phenomenonTime: "2016-11-18T11:04:15.790Z",
                    resultTime: "2016-11-18T11:04:15.790Z",
                    result: 20.4,
                    Datastream: { "@iot.id": 1 }
                })
                .set("Cookie", `${keyTokenName}=${token}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(404);
                    res.type.should.equal("application/json");
                    docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4).replace(Number.MAX_SAFE_INTEGER.toString(), myId);
                    done();
                });
        });

        it("Return updated Observation and Datastream", (done) => {
            dbTest("observation")
                .select("*")
                .orderBy("id")
                .then((items) => {
                    const itemObject = items[0];
                    const datas = {
                        "phenomenonTime": "2016-11-18T11:04:15.790Z",
                        "resultTime": "2016-11-18T11:04:15.790Z",
                        "result": 20.4,
                        "Datastream": { "@iot.id": 6 }
                    };
                    const infos = {
                        api: `{patch} ${entity.name} Patch with Datastream`,
                        apiName: `PatchDatastream${entity.name}`,
                        apiDescription: "Patch an Observation with Datastream.",
                        apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#65",
                        apiExample: {
                            http: `/v1.0/${entity.name}(${itemObject.id})`,
                            curl: defaultPatch("curl", "KEYHTTP", datas),
                            javascript: defaultPatch("javascript", "KEYHTTP", datas),
                            python: defaultPatch("python", "KEYHTTP", datas)
                        },
                        apiParamExample: datas
                    };
                    chai.request(server)
                        .patch(`/test${infos.apiExample.http}`)
                        .send(infos.apiParamExample)
                        .set("Cookie", `${keyTokenName}=${token}`)
                        .end((err: any, res: any) => {
                            should.not.exist(err);
                            res.status.should.equal(200);
                            res.type.should.equal("application/json");
                            res.body.should.include.keys(testsKeys);
                            const newItems = res.body;
                            newItems.result.should.not.eql(itemObject.result);
                            addToApiDoc({ ...infos, result: res });
                            done();
                        });
                });
        });
    });

    describe(`{delete} ${entity.name} Delete`, () => {
        
        it("should return no content with code 204", (done) => {
            dbTest("observation")
            .select("*")
            .orderBy("id")
            .then((items) => {                
                const thingObject = items[items.length - 1];
                const lengthBeforeDelete = items.length;
                const infos = {
                        api: `{delete} ${entity.name} Delete one`,
                        apiName: `Delete${entity.name}`,
                        apiDescription: "Delete an Observations.",
                        apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#68",
                        apiExample: {
                            http: `/v1.0/${entity.name}(${thingObject.id})`,
                            curl: defaultDelete("curl", "KEYHTTP"),
                            javascript: defaultDelete("javascript", "KEYHTTP"),
                            python: defaultDelete("python", "KEYHTTP")
                        }
                    };
                    chai.request(server)
                        .delete(`/test${infos.apiExample.http}`)
                        .set("Cookie", `${keyTokenName}=${token}`)
                        .end((err: any, res: any) => {
                            should.not.exist(err);
                            res.status.should.equal(204);
                            dbTest("observation")
                                .select("*")
                                .orderBy("id")
                                .then((newItems) => {
                                    newItems.length.should.eql(lengthBeforeDelete - 1);
                                    addToApiDoc({ ...infos, result: res });
                                    done();
                                });
                        });
                });
        });

        it("should throw an error if the sensor does not exist", (done) => {
            chai.request(server)
                .delete(`/test/v1.0/${entity.name}(${BigInt(Number.MAX_SAFE_INTEGER)})`)
                .set("Cookie", `${keyTokenName}=${token}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(404);
                    res.type.should.equal("application/json");

                    docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4);
                    generateApiDoc(docs, `apiDoc${entity.name}.js`);
                    
                    done();
                });
        });
    });
});
