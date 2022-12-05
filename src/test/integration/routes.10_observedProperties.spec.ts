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
    defaultGet,
    defaultPost,
    defaultPatch,
    defaultDelete
} from "./constant";
import { server } from "../../server/index";
import { dbTest } from "../dbTest";
import { _DBDATAS } from "../../server/db/constants";
import { IEntity } from "../../server/types";
import { testsKeys as datastreams_testsKeys } from "./routes.07_datastreams.spec";

export const testsKeys = ["@iot.id", "@iot.selfLink", "Datastreams@iot.navigationLink", "name", "description", "definition"];

chai.use(chaiHttp);

const should = chai.should();

const docs: IApiDoc[] = [];
const entity: IEntity = _DBDATAS.ObservedProperties;



const addToApiDoc = (input: IApiInput) => {
    docs.push(prepareToApiDoc(input, entity.name));
};

addToApiDoc({
    api: `{infos} ${entity.name} Infos`,
    apiName: `Infos${entity.name}`,
    apiDescription: "An ObservedProperty specifies the phenomenon of an Observation.",
    apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#30",

    result: ""
});

describe("endpoint : ObservedProperties", () => {
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
        it("Return all observedProperty", (done) => {
            const infos = {
                api: `{get} ${entity.name} Get all`,
                apiName: `GetAll${entity.name}`,
                apiDescription: "Retrieve all observed Properties.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#37",
                apiExample: {
                    http: `/v1.0/${entity.name}`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                },
                apiSuccess: ["{number} id @iot.id", "{relation} selfLink @iot.selfLink", ...success]
            };
            dbTest("observedproperty")
                .count()
                .then((result) => {
                    const nb = Number(result[0]["count"]) > 200 ? 200 : Number(result[0]["count"]);
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
                            docs[docs.length - 1].apiErrorExample = JSON.stringify({ "code": 404, "message": "Not Found" }, null, 4);
                            done();
                        });
                });
        });

        it("Return observedProperty id: 2", (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get one`,
                apiName: `GetOne${entity.name}`,
                apiDescription: "Get a specific observed Property.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#38",
                apiExample: {
                    http: `/v1.0/${entity.name}(2)`,
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
                    res.body["@iot.selfLink"].should.contain("/ObservedProperties(2)");
                    res.body["@iot.id"].should.eql(2);
                    res.body["Datastreams@iot.navigationLink"].should.contain("/ObservedProperties(2)/Datastreams");
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return error observedProperty does not exist", (done) => {
            chai.request(server)
                .get(`/test/v1.0/${entity.name}(${BigInt(Number.MAX_SAFE_INTEGER)})`)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.equal(404);
                    res.type.should.equal("application/json");
                    docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4).replace(Number.MAX_SAFE_INTEGER.toString(), "2");
                    done();
                });
        });

        it("Return observedProperty of a specific Datastream", (done) => {
            const id = 8;
            const infos = {
                api: `{get} Datastream(10/${entity.name} Get from a specific Datastream`,
                apiName: `GetDatastream${entity.name}`,
                apiDescription: "Get observed Property from Datastream",
                apiExample: {
                    http: `/v1.0/Datastreams(9)/ObservedProperty`,
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
                    res.body.value[0].should.include.keys(testsKeys);
                    res.body["@iot.count"].should.eql("1");
                    res.body.value.length.should.eql(1);
                    res.body.value[0]["@iot.id"].should.eql(id);
                    res.body.value[0]["@iot.selfLink"].should.contain(`/ObservedProperties(${id})`);
                    res.body.value[0]["Datastreams@iot.navigationLink"].should.contain(`/ObservedProperties(${id})/Datastreams`);
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return observedProperty with inline related entities using $expand query option", (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get Expand Datastreams`,
                apiName: `GetExpandDatastreams${entity.name}`,
                apiDescription: "`Get a specific observed Property and expand Datastreams.",
                apiExample: {
                    http: `/v1.0/${entity.name}(1)?$expand=Datastreams`,
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
                    res.body.should.include.keys("Datastreams");
                    res.body.Datastreams[0].should.include.keys(datastreams_testsKeys);
                    res.body["@iot.id"].should.eql(1);
                    res.body.Datastreams = [res.body.Datastreams[0], res.body.Datastreams[1], "..."];
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it(`Retrieve specified properties for a specific ${entity.name}`, (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get from a Select`,
                apiName: `GetSelectDescription${entity.name}`,
                apiDescription: "Retrieve specified properties for a specific observed Property.",
                apiExample: {
                    http: `/v1.0/${entity.name}(1)?$select=description`,
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
                    Object.keys(res.body).length.should.eql(1);
                    res.body.should.include.keys("description");
                    addToApiDoc({ ...infos, result: res });
                    done();
                });

            it("Return Sensor Subentity Datastreams", (done) => {
                const name = "Datastreams";
                chai.request(server)
                    .get(`/test/v1.0/${entity.name}(1)/Datastreams`)
                    .end((err: any, res: any) => {
                        should.not.exist(err);
                        res.status.should.equal(200);
                        res.type.should.equal("application/json");
                        res.body["@iot.count"].should.eql("2");
                        const id = Number(res.body.value[0]["@iot.id"]);
                        res.body.value[0]["@iot.selfLink"].should.contain(`/${name}(${id})`);
                        res.body.value[0]["Thing@iot.navigationLink"].should.contain(`/${name}(${id})/Thing`);
                        res.body.value[0]["Sensor@iot.navigationLink"].should.contain(`/${name}(${id})/Sensor`);
                        res.body.value[0]["ObservedProperty@iot.navigationLink"].should.contain(`/${name}(${id})/ObservedProperty`);
                        res.body.value[0]["Observations@iot.navigationLink"].should.contain(`/${name}(${id})/Observations`);
                        done();
                    });
            });

            it("Return Sensor Subentity MultiDatastreams", (done) => {
                const name = "MultiDatastreams";
                chai.request(server)
                    .get(`/test/v1.0/${entity.name}(11)/MultiDatastreams`)
                    .end((err: any, res: any) => {
                        should.not.exist(err);
                        res.status.should.equal(200);
                        res.type.should.equal("application/json");
                        const id = Number(res.body.value[0]["@iot.id"]);
                        res.body.value[0]["@iot.selfLink"].should.contain(`/${name}(${id})`);
                        res.body.value[0]["Thing@iot.navigationLink"].should.contain(`/${name}(${id})/Thing`);
                        res.body.value[0]["Sensor@iot.navigationLink"].should.contain(`/${name}(${id})/Sensor`);
                        res.body.value[0]["ObservedProperties@iot.navigationLink"].should.contain(`/${name}(${id})/ObservedProperties`);
                        res.body.value[0]["Observations@iot.navigationLink"].should.contain(`/${name}(${id})/Observations`);
                        done();
                    });
            });

            it("Return Sensor Expand Datastreams", (done) => {
                const name = "Datastreams";
                chai.request(server)
                    .get(`/test/v1.0/${entity.name}(2)?$expand=${name}`)
                    .end((err: any, res: any) => {
                        should.not.exist(err);
                        res.status.should.equal(200);
                        res.type.should.equal("application/json");
                        const id = Number(res.body[name][0]["@iot.id"]);
                        res.body[name][0]["@iot.selfLink"].should.contain(`/${name}(${id})`);
                        res.body[name][0]["Thing@iot.navigationLink"].should.contain(`/${name}(${id})/Thing`);
                        res.body[name][0]["Sensor@iot.navigationLink"].should.contain(`/${name}(${id})/Sensor`);
                        res.body[name][0]["ObservedProperty@iot.navigationLink"].should.contain(`/${name}(${id})/ObservedProperty`);
                        res.body[name][0]["Observations@iot.navigationLink"].should.contain(`/${name}(${id})/Observations`);
                        done();
                    });
            });

            it("Return Sensor Expand MultiDatastreams", (done) => {
                const name = "MultiDatastreams";
                chai.request(server)
                    .get(`/test/v1.0/${entity.name}(11)?$expand=${name}`)
                    .end((err: any, res: any) => {
                        should.not.exist(err);
                        res.status.should.equal(200);
                        res.type.should.equal("application/json");
                        const id = Number(res.body[name][0]["@iot.id"]);
                        res.body[name][0]["@iot.selfLink"].should.contain(`/${name}(${id})`);
                        res.body[name][0]["Thing@iot.navigationLink"].should.contain(`/${name}(${id})/Thing`);
                        res.body[name][0]["Sensor@iot.navigationLink"].should.contain(`/${name}(${id})/Sensor`);
                        res.body[name][0]["ObservedProperties@iot.navigationLink"].should.contain(`/${name}(${id})/ObservedProperties`);
                        res.body[name][0]["Observations@iot.navigationLink"].should.contain(`/${name}(${id})/Observations`);
                        done();
                    });
            });
        });
    });

    describe(`{post} ${entity.name} Create,`, () => {
        it("Return ObservedProperty Thing", (done) => {
            const datas = {
                name: "Area Temperature",
                description: "The degree or intensity of heat present in the area",
                definition: "http://www.qudt.org/qudt/owl/1.0.0/quantity/Instances.html#AreaTemperature"
            };
            const infos = {
                api: `{post} ${entity.name} Post basic`,
                apiName: `Post${entity.name}`,
                apiDescription: "Post a new observed Property.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#61",
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

                    docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4);
                    done();
                });
        });
    });

    describe(`{patch} ${entity.name} Patch`, () => {
        it("Return updated ObservedProperty", (done) => {
            dbTest("observedproperty")
                .select("*")
                .orderBy("id")
                .then((items) => {
                    const itemObject = items[items.length - 1];
                    myId = itemObject.id;
                    const datas = {
                        name: "New PM 2.5 Observation"
                    };
                    const infos = {
                        api: `{patch} ${entity.name} Patch one`,
                        apiName: `Patch${entity.name}`,
                        apiDescription: "Patch an observed Property.",
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
                            res.body.name.should.not.eql(itemObject.name);
                            addToApiDoc({ ...infos, result: res });
                            done();
                        });
                });
        });

        it("Return Error if the ObservedProperty does not exist", (done) => {
            chai.request(server)
                .patch(`/test/v1.0/${entity.name}(${BigInt(Number.MAX_SAFE_INTEGER)})`)
                .send({
                    name: "New PM 2.5 Observation"
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
    });

    describe(`{delete} ${entity.name} Delete`, () => {
        it("Return no content with code 204", (done) => {
            dbTest("observedproperty")
                .select("*")
                .orderBy("id")
                .then((items) => {
                    const thingObject = items[items.length - 1];
                    myId = thingObject.id;
                    const lengthBeforeDelete = items.length;
                    const infos = {
                        api: `{delete} ${entity.name} Delete one`,
                        apiName: `Delete${entity.name}`,
                        apiDescription: "Delete an observed Property.",
                        apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#68",
                        apiExample: {
                            http: `/v1.0/${entity.name}(${myId})`,
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
                            dbTest("observedproperty")
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
                    docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4).replace(Number.MAX_SAFE_INTEGER.toString(), myId);
                    generateApiDoc(docs, `apiDoc${entity.name}.js`);
                    
                    done();
                });
        });
    });
});
