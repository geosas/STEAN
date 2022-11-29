/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * TDD for Lora API.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */
process.env.NODE_ENV = "test";

import chai from "chai";
import chaiHttp from "chai-http";
import { IApiDoc, generateApiDoc, IApiInput, prepareToApiDoc, identification, keyTokenName, defaultPost } from "./constant";
import { server } from "../../server/index";
import { _DBDATAS } from "../../server/db/constants";
import { IEntity } from "../../server/types";

const testsKeys = [
    "@iot.id",
    "name",
    "deveui",
    "description",
    "properties",
    "@iot.selfLink",
    "Datastreams@iot.navigationLink",
    "MultiDatastream@iot.navigationLink",
    "Decoder@iot.navigationLink"
];

chai.use(chaiHttp);

const should = chai.should();

const docs: IApiDoc[] = [];
const entity: IEntity = _DBDATAS.Loras;
// const entityObs: IEntity = _DBDATAS.Observations;
let firstLoraID = "";
let firstLoraDEVEUI = "";

const dataInput = {
    "Battery": 3.2800000000000002,
    "Humidity": 4.5859375,
    "Temperature": 17.798207397460935
};



const addToApiDoc = (input: IApiInput) => {
    docs.push(prepareToApiDoc(input, entity.name));
};

addToApiDoc({
    api: `{infos} ${entity.name} Infos.`,
    apiName: `Infos${entity.name}`,
    apiDescription:
        "Lora is an layer for add observations in sensorThings from LORA sensors, the link with sensor is done by deveui (the unique ID of lora sensor) in things properties",
    apiReference: "",
    result: ""
});

describe("endpoint : Lora", () => {
    const success: string[] = [];
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

    describe(`{get} ${entity.name}.`, () => {
        it("should return all Lora sensor", (done) => {
            const infos = {
                api: `{get} ${entity.name} Get all`,
                apiName: `GetAll${entity.name}`,
                apiDescription: `Retrieve all things identified with lora deveui in properties.`,
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#37",
                apiExample: { http: `/v1.0/${entity.name}` },
                apiSuccess: ["{number} id @iot.id", "{relation} selfLink @iot.selfLink", ...success]
            };
                    chai.request(server)
                        .get(`/test/v1.0/${entity.name}`)
                        .end((err, res) => {
                            should.not.exist(err);
                            res.status.should.equal(200);
                            res.type.should.equal("application/json");
                            // res.body.value.length.should.eql(4);
                            res.body.should.include.keys("@iot.count", "value");
                            res.body.value[0].should.include.keys(testsKeys);
                            res.body.value = [res.body.value[0], res.body.value[1], "..."];
                            addToApiDoc({ ...infos, result: res });
                            firstLoraDEVEUI = res.body.value[0].deveui;
                            firstLoraID = res.body.value[0]["@iot.id"];
                            done();
                        });
        });

        it("should respond with a single Lora", (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get one`,
                apiName: `GetOne${entity.name}`,
                apiDescription: "Get a specific Lora.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#38",
                apiExample: { http: `/v1.0/${entity.name}(${firstLoraDEVEUI})` }
            };
            chai.request(server)
                .get(`/test${infos.apiExample.http}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body["@iot.selfLink"].should.contain(`/Loras(${firstLoraID})`);
                    res.body["@iot.id"].should.eql(Number(firstLoraID));
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("should throw an error if the Lora does not exist", (done) => {
            chai.request(server)
                .get(`/test/v1.0/${entity.name}(NOTHINGTOFOUND)`)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.equal(404);
                    res.type.should.equal("application/json");
                    res.body["detail"].should.include("NOTHINGTOFOUND not found");
                    docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4);
                    done();
                });
        });
    });

    describe(`{post} ${entity.name} Add lora observation.`, () => {
        it("should return the Lora Affected multi that was added", (done) => {
            const datas = {
                "MultiDatastream": {
                    "@iot.id": 2
                },
                "name": "My new Lora name",
                "description": "My new Lora Description",
                "deveui": "8cf9574000009L8C"
            };
            const infos = {
                api: `{post} ${entity.name} Post basic`,
                apiName: `Post${entity.name}`,
                apiDescription: `Post a new Observation in a Lora Thing.`,
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

        it("should return the Lora observation that was added", (done) => {
            const datas = {
                "data": dataInput,
                "deveui": "8cf9574000002d4d",
                "sensor_id": "8cf9574000002d4d",
                "timestamp": "2021-10-18T14:53:44+02:00",
                "payload_ciphered": null,
                "payload_deciphered": "012f5ecec2014a1ab2"
            };
            const infos = {
                api: `{post} ${entity.name} Post basic`,
                apiName: `Post${entity.name}Multi`,
                apiDescription: `Post a new Observation in a Lora Thing.`,
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
                    res.body["@iot.selfLink"].should.contain("/Observations(");
                    res.body["result"]["Humidity"].should.eql(dataInput.Humidity);
                    res.body["result"]["Temperature"].should.eql(17.7982073974609);
                    res.body["result"]["Battery"].should.eql(3.28);
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
                    docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4);
                    done();
                });
        });

        it("should return that Observation already exist", (done) => {
            const datas = {
                "data": dataInput,
                "deveui": "8cf9574000002d4d",
                "sensor_id": "8cf9574000002d4d",
                "timestamp": "2021-10-18T14:53:44+02:00",
                "payload_ciphered": null,
                "payload_deciphered": "012f5ecec2014a1ab2"
            };
            const infos = {
                api: `{post} ${entity.name} Post Duplicate`,
                apiName: `Post${entity.name}`,
                apiDescription: "Post a new Duplicate Lora Observation.",
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
                    res.status.should.equal(400);
                    res.type.should.equal("application/json");
                    res.body["detail"].should.eql("Observation already exist");
                    done();
                });
        });

        it("should return the Observation that was added with Sort", (done) => {
            const datas = {
                "data": {
                    "Battery": 50,
                    "Temperature": 25,
                    "Humidity": 100
                },
                "deveui": "8cf9574000002d4d",
                "sensor_id": "8cf9574000002d4d",
                "timestamp": "2021-10-15T14:53:44+02:00",
                "payload_ciphered": null,
                "payload_deciphered": "012f5ecec2014a1ab2"
            };
            const infos = {
                api: `{post} ${entity.name} Post Sort`,
                apiName: `Post${entity.name}Sort`,
                apiDescription: "Post a new Lora Observation Sorted.",
                apiExample: {
                    http: `/v1.0/${entity.name}`,
                    curl: defaultPost("curl", "KEYHTTP", datas),
                    javascript: defaultPost("javascript", "KEYHTTP", datas),
                    python: defaultPost("python", "KEYHTTP", datas)
                },
                // apiParam: params,
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
                    res.body["@iot.selfLink"].should.contain("/Observations(");
                    res.body["result"]["Humidity"].should.eql(100);
                    res.body["result"]["Temperature"].should.eql(25);
                    res.body["result"]["Battery"].should.eql(50);
                    // res.body["phenomenonTime"].should.eql("2021-10-15T12:53:44.000Z");
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("should return the Observation with data null", (done) => {
            const datas = {
                "data": null,
                "deveui": "8cf9574000002d4d",
                "sensor_id": "8cf9574000002d4d",
                "timestamp": "2021-10-15T14:53:44+02:00",
                "payload_ciphered": null,
                "payload_deciphered": ""
            };
            const infos = {
                api: `{post} ${entity.name} Post Data Null`,
                apiName: `Post${entity.name}Null`,
                apiDescription: "Post a new Lora Observation With Data null.",
                apiExample: {
                    http: `/v1.0/${entity.name}`,
                    curl: defaultPost("curl", "KEYHTTP", datas),
                    javascript: defaultPost("javascript", "KEYHTTP", datas),
                    python: defaultPost("python", "KEYHTTP", datas)
                },
                // apiParam: params,
                apiParamExample: datas
            };
            chai.request(server)
                .post(`/test${infos.apiExample.http}`)
                .send(infos.apiParamExample)
                .set("Cookie", `${keyTokenName}=${token}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(400);
                    res.type.should.equal("application/json");
                    res.body["detail"].should.eql("Data is missing or Null");
                    done();
                });
        });

        it("should return error that Data not corresponding", (done) => {
            const datas = {
                "data": {
                    "lost": 50,
                    "nothing": 25,
                    "dontknow": 100
                },
                "deveui": "8cf9574000002d4d",
                "sensor_id": "8cf9574000002d4d",
                "timestamp": "2021-10-15T14:53:44+02:00",
                "payload_ciphered": null,
                "payload_deciphered": ""
            };
            const infos = {
                api: `{post} ${entity.name} Post Data Nots`,
                apiName: `Post${entity.name}DataNotCorrespond`,
                apiDescription: "Post a new Lora Observation Data not corresponding.",
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
                    res.status.should.equal(400);
                    res.type.should.equal("application/json");
                    res.body["detail"].should.eql("Data not corresponding [Humidity,Temperature,Battery]");
                    generateApiDoc(docs, `apiDoc${entity.name}.js`);
                    
                    done();
                });
        });
    });

    // describe(`{delete} ${entity.name} Delete.`, () => {
    //     it("should return no content with code 204", (done) => {
    //         dbTest("multidatastream")
    //             .whereRaw(whereLora())
    //             .then((items) => {
    //                 const thingObject = items[items.length - 1];
    //                 const myId = thingObject.deveui;

    //                 const lengthBeforeDelete = items.length;
    //                 const infos = {
    //                     api: `{delete} ${entity.name} Delete one`,
    //                     apiName: `Delete${entity.name}`,
    //                     apiDescription: "Delete an Lora Observation.",
    //                     apiExample: {
    //                         http: `/v1.0/${entity.name}(${myId})`,
    //                         curl: defaultDelete("curl", "KEYHTTP"),
    //                         javascript: defaultDelete("javascript", "KEYHTTP"),
    //                         python: defaultDelete("python", "KEYHTTP")
    //                     }
    //                 };
    //                 chai.request(server)
    //                     .delete(`/test${infos.apiExample.http}`)
    //                     .set("Cookie", `${keyTokenName}=${token}`)
    //                     .end((err: any, res: any) => {
    //                         should.not.exist(err);
    //                         res.status.should.equal(204);
    //                         dbTest("multidatastream")
    //                             .whereRaw(whereLora())
    //                             .then((newItems) => {
    //                                 console.log(items);

    //                                 newItems.length.should.eql(lengthBeforeDelete - 1);
    //                                 addToApiDoc({ ...infos, result: res });
    //                                 done();
    //                             });
    //                     });
    //             });
    //     });
    //     it("should throw an error if the sensor does not exist", (done) => {
    //         chai.request(server)
    //             .delete(`/test/v1.0/${entity.name}(${BigInt(Number.MAX_SAFE_INTEGER)})`)
    //             .set("Cookie", `${keyTokenName}=${token}`)
    //             .end((err: any, res: any) => {
    //                 should.not.exist(err);
    //                 res.status.should.equal(404);
    //                 res.type.should.equal("application/json");
    //                 docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4);
    //                 generateApiDoc(docs, `apiDoc${entity.name}.js`);
    //                 done();
    //             });
    //     });
    // });
});
