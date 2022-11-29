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
    defaultGet
} from "./constant";
import { server } from "../../server/index";
import { dbTest } from "../dbTest";
import { _DBDATAS } from "../../server/db/constants";
import { IEntity } from "../../server/types";
import { testsKeys as locations_testsKeys } from "./routes.05_locations.spec";

const testsKeys = ["@iot.selfLink", "@iot.id", "Things@iot.navigationLink", "Locations@iot.navigationLink", "time"];

chai.use(chaiHttp);

const should = chai.should();

const docs: IApiDoc[] = [];
const entity: IEntity = _DBDATAS.HistoricalLocations;

const addToApiDoc = (input: IApiInput) => {
    docs.push(prepareToApiDoc(input, entity.name));
};

addToApiDoc({
    api: `{infos} ${entity.name} Infos`,
    apiName: `Infos${entity.name}`,
    apiDescription: "A Thing’s HistoricalLocation entity set provides the times of the current (last known) and previous locations of the Thing.",
    apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#26",
    result: ""
});

describe("endpoint : HistoricalLocations", () => {
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
        it("Return all HistoricalLocations", (done) => {
            const infos = {
                api: `{get} ${entity.name} Get all`,
                apiName: `GetAll${entity.name}`,
                apiDescription: "Retrieve all Historical Locations.",
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
                    chai.request(server)
                        .get(`/test${infos.apiExample.http}`)
                        .end((err, res) => {
                            const nb = Number(result[0]["count"]) > 200 ? 200 : Number(result[0]["count"]);
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

        it("Return HistoricalLocations id: 1", (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get One`,
                apiName: `GetOne${entity.name}`,
                apiDescription: "Get a specific Historical Location.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#38",
                apiExample: {
                    http: `/v1.0/${entity.name}(1)`,
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
                    res.body["@iot.selfLink"].should.contain("/HistoricalLocations(1)");
                    res.body["@iot.id"].should.eql(1);
                    res.body["Things@iot.navigationLink"].should.contain("/HistoricalLocations(1)/Things");
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return Error if the HistoricalLocations does not exist", (done) => {
            chai.request(server)
                .get(`/test/v1.0/${entity.name}(${BigInt(Number.MAX_SAFE_INTEGER)})`)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.equal(404);
                    res.type.should.equal("application/json");
                    docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4).replace(Number.MAX_SAFE_INTEGER.toString(), "1");
                    done();
                });
        });

        it("Return HistoricalLocations id: 6 and $expand Locations", (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get Expand`,
                apiName: `GetExpandLocations${entity.name}`,
                apiDescription: "Get a specific Historical Location and expand Locations.",
                apiExample: {
                    http: `/v1.0/${entity.name}(6)?$expand=Locations`,
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
                    res.body.should.include.keys(testsKeys.filter((elem) => elem !== "Locations@iot.navigationLink"));
                    res.body.should.include.keys("Locations");
                    res.body.Locations.length.should.eql(1);
                    res.body.Locations[0].should.include.keys(locations_testsKeys);
                    res.body["@iot.id"].should.eql(6);
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return specified time of HistoricalLocations id: 6", (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get Select`,
                apiName: `GetSelectTime${entity.name}`,
                apiDescription: "Retrieve time for a specific Historical Location.",
                apiExample: {
                    http: `/v1.0/${entity.name}(6)?$select=time`,
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
                    res.body.should.include.keys("time");
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return HistoricalLocations Subentity Things", (done) => {
            const name = "Things";
            chai.request(server)
                .get(`/test/v1.0/${entity.name}(2)/Things`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body["@iot.count"].should.eql("1");
                    const id = Number(res.body.value[0]["@iot.id"]);
                    res.body.value[0]["@iot.selfLink"].should.contain(`/${name}(${id})`);
                    res.body.value[0]["Locations@iot.navigationLink"].should.contain(`/${name}(${id})/Location`);
                    res.body.value[0]["HistoricalLocations@iot.navigationLink"].should.contain(`/${name}(${id})/HistoricalLocations`);
                    res.body.value[0]["Datastreams@iot.navigationLink"].should.contain(`/${name}(${id})/Datastreams`);
                    res.body.value[0]["MultiDatastreams@iot.navigationLink"].should.contain(`/${name}(${id})/MultiDatastreams`);
                    done();
                });
        });

        it("Return HistoricalLocations Subentity Locations", (done) => {
            const name = "Locations";
            chai.request(server)
                .get(`/test/v1.0/${entity.name}(2)/Locations`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body["@iot.count"].should.eql("1");
                    const id = Number(res.body.value[0]["@iot.id"]);
                    res.body.value[0]["@iot.selfLink"].should.contain(`/${name}(${id})`);
                    res.body.value[0]["Things@iot.navigationLink"].should.contain(`/${name}(${id})/Things`);
                    res.body.value[0]["HistoricalLocations@iot.navigationLink"].should.contain(`/${name}(${id})/HistoricalLocations`);
                    done();
                });
        });

        it("Return HistoricalLocations Expand Things", (done) => {
            const name = "Things";
            chai.request(server)
                .get(`/test/v1.0/${entity.name}(2)?$expand=${name}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    const id = Number(res.body[name][0]["@iot.id"]);
                    res.body[name][0]["@iot.selfLink"].should.contain(`/${name}(${id})`);
                    res.body[name][0]["Locations@iot.navigationLink"].should.contain(`${name}(${id})/Location`);
                    res.body[name][0]["HistoricalLocations@iot.navigationLink"].should.contain(`/${name}(${id})/HistoricalLocations`);
                    res.body[name][0]["Datastreams@iot.navigationLink"].should.contain(`${name}(${id})/Datastreams`);
                    res.body[name][0]["MultiDatastreams@iot.navigationLink"].should.contain(`${name}(${id})/MultiDatastreams`);
                    done();
                });
        });

        it("Return HistoricalLocations Expand Locations", (done) => {
            const name = "Locations";
            chai.request(server)
                .get(`/test/v1.0/${entity.name}(2)?$expand=${name}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    const id = Number(res.body[name][0]["@iot.id"]);
                    res.body[name][0]["@iot.selfLink"].should.contain(`/${name}(${id})`);
                    res.body[name][0]["Things@iot.navigationLink"].should.contain(`/${name}(${id})/Things`);
                    res.body[name][0]["HistoricalLocations@iot.navigationLink"].should.contain(`/${name}(${id})/HistoricalLocations`);
                    done();
                });
        });
    });

    describe(`{patch} ${entity.name} Patch`, () => {
        it("Return updated HistoricalLocations", (done) => {
            dbTest(entity.table)
                .select("*")
                .orderBy("id")
                .then((locations) => {
                    const locationObject = locations[locations.length - 1];
                    const datas = {
                        "time": "2015-02-07T19:22:11.297Z"
                    };
                    const infos = {
                        api: `{patch} ${entity.name} Patch one`,
                        apiName: `Patch${entity.name}`,
                        apiDescription: "Patch an Historical Location.",
                        apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#65",
                        apiExample: {
                            http: `/v1.0/${entity.name}(${locationObject.id})`,
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
                            const newLocationObject = res.body;
                            newLocationObject.should.not.eql(locationObject.time);
                            addToApiDoc({ ...infos, result: res });
                            done();
                        });
                });
        });

        it("Return Error if the HistoricalLocations does not exist", (done) => {
            chai.request(server)
                .patch(`/test/v1.0/${entity.name}(${BigInt(Number.MAX_SAFE_INTEGER)})`)
                .send({
                    "time": "2015-02-07T19:22:11.297Z"
                })
                .set("Cookie", `${keyTokenName}=${token}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(404);
                    res.type.should.equal("application/json");

                    docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4);
                    done();
                });
        });
    });

    describe(`{delete} ${entity.name} Delete`, () => {
        it("Return no content with code 204", (done) => {
            dbTest(entity.table)
                .select("*")
                .orderBy("id")
                .then((locations) => {
                    const locationObject = locations[locations.length - 1];
                    const lengthBeforeDelete = locations.length;
                    const infos = {
                        api: `{delete} ${entity.name} Delete one`,
                        apiName: `Delete${entity.name}`,
                        apiDescription: "Delete a Historical Location.",
                        apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#68",
                        apiExample: {
                            http: `/v1.0/${entity.name}(${locationObject.id})`,
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
                            dbTest(entity.table)
                                .select("*")
                                .orderBy("id")
                                .then((updatedLocations) => {
                                    updatedLocations.length.should.eql(lengthBeforeDelete - 1);
                                    addToApiDoc({ ...infos, result: res });
                                    done();
                                });
                        });
                });
        });

        it("Return Error if the HistoricalLocations does not exist", (done) => {
            chai.request(server)
                .delete(`/test/v1.0/${entity.name}(${BigInt(Number.MAX_SAFE_INTEGER)})`)
                .set("Cookie", `${keyTokenName}=${token}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(404);
                    res.type.should.equal("application/json");
                    docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4).replace(Number.MAX_SAFE_INTEGER.toString(), "1");
                    generateApiDoc(docs, `apiDoc${entity.name}.js`);
                    
                    done();
                });
        });
    });
});
