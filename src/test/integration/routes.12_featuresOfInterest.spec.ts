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
import { testsKeys as observations_testsKeys } from "./routes.11_observations.spec";

const testsKeys = ["@iot.id", "@iot.selfLink", "Observations@iot.navigationLink", "name", "description", "encodingType", "feature"];
chai.use(chaiHttp);

const should = chai.should();

const docs: IApiDoc[] = [];
const entity: IEntity = _DBDATAS.FeaturesOfInterest;

const addToApiDoc = (input: IApiInput) => {
    docs.push(prepareToApiDoc(input, entity.name));
};

addToApiDoc({
    api: `{infos} ${entity.name} Infos`,
    apiName: `Infos${entity.name}`,
    apiDescription: `An Observation results is a value being assigned to a phenomenon.<br>The phenomenon is a property of a feature, the latter being the FeatureOfInterest of the Observation.<br>
    In the context of the Internet of Things, many Observations’ FeatureOfInterest can be the Location of the Thing. For example, the FeatureOfInterest of a wifi-connect thermostat can be the Location of the thermostat (the living room where the thermostat is located in).<br>In the case of remote sensing, the FeatureOfInterest can be the geographical area or volume that is being sensed`,
    apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#32",
    result: ""
});

describe("endpoint : Features of Interest", () => {
    let success: string[] = [];
    let params: string[] = [];
    let myId = "";
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
        it("Return all features of interests", (done) => {
            const infos = {
                api: `{get} ${entity.name} Get all`,
                apiName: `GetAll${entity.name}`,
                apiDescription: "Retrieve all Features of interests.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#37",
                apiExample: {
                    http: `/v1.0/${entity.name}`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                },
                apiSuccess: success
            };
            dbTest("featureofinterest")
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
                            docs[docs.length - 1].apiErrorExample = JSON.stringify({ "code": 404, "message": "Not Found" }, null, 4);
                            done();
                        });
                });
        });

        it("Return Feature of interest id: 1", (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get one`,
                apiName: `GetOne${entity.name}`,
                apiDescription: "Get a specific Feature of interest.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#38",
                apiExample: { http: `/v1.0/${entity.name}(1)` }
            };
            chai.request(server)
                .get(`/test${infos.apiExample.http}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.should.include.keys(testsKeys);
                    res.body["@iot.selfLink"].should.contain("/FeaturesOfInterest(1)");
                    res.body["@iot.id"].should.eql(1);
                    res.body["Observations@iot.navigationLink"].should.contain("/FeaturesOfInterest(1)/Observations");
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("should throw an error if the features of interest does not exist", (done) => {
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

        it(`Return all features of interests using $expand query option`, (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get one and expand`,
                apiName: `GetExpandObservations${entity.name}`,
                apiDescription: "Get a specific Feature of interest and expand Observations",
                apiExample: { http: `/v1.0/${entity.name}(1)?$expand=Observations` }
            };
            chai.request(server)
                .get(`/test${infos.apiExample.http}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.should.include.keys(testsKeys.filter((elem) => elem !== "Observations@iot.navigationLink"));
                    res.body.should.include.keys("Observations");
                    res.body.Observations[0].should.include.keys(observations_testsKeys);
                    res.body["@iot.id"].should.eql(1);
                    res.body.Observations = [res.body.Observations[0], res.body.Observations[1], "..."];
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return Datastreams Subentity Observations", (done) => {
            const name = "Observations";
            chai.request(server)
                .get(`/test/v1.0/${entity.name}(1)/${name}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    const id = res.body.value[0]["@iot.id"];
                    res.body.value[0]["@iot.selfLink"].should.contain(`/${name}(${id})`);
                    res.body.value[0]["Datastream@iot.navigationLink"].should.contain(`/${name}(${id})/Datastream`);
                    res.body.value[0]["MultiDatastream@iot.navigationLink"].should.contain(`/${name}(${id})/MultiDatastream`);
                    res.body.value[0]["FeatureOfInterest@iot.navigationLink"].should.contain(`/${name}(${id})/FeatureOfInterest`);
                    done();
                });
        });

        it("Return Datastreams Expand Observations", (done) => {
            const name = "Observations";
            chai.request(server)
                .get(`/test/v1.0/${entity.name}(1)?$expand=${name}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    const id = Number(res.body[name][0]["@iot.id"]);
                    res.body[name][0]["@iot.selfLink"].should.contain(`/Observations(${id})`);
                    res.body[name][0]["FeatureOfInterest@iot.navigationLink"].should.contain(`/Observations(${id})/FeatureOfInterest`);
                    res.body[name][0]["Datastream@iot.navigationLink"].should.contain(`Observations(${id})/Datastream`);
                    res.body[name][0]["MultiDatastream@iot.navigationLink"].should.contain(`Observations(${id})/MultiDatastream`);
                    done();
                });
        });
    });

    describe(`{post} ${entity.name} Create`, () => {
        it("Return added Feature of interest", (done) => {
            const datas = {
                "name": "Weather Station YYC.",
                "description": "This is a weather station located at Au Comptoir Vénitien.",
                "encodingType": "application/vnd.geo+json",
                "feature": {
                    "type": "Point",
                    "coordinates": [48.11829243294942, -1.717928984533772]
                }
            };
            const infos = {
                api: `{post} ${entity.name} Post basic`,
                apiName: `Post${entity.name}`,
                apiDescription: "Post a new Feature of interest.",
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
                .post("/test/v1.0/FeaturesOfInterest")
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

    describe("PATCH /v1.0/FeaturesOfInterest", () => {
        it("Return updated Feature of interest", (done) => {
            dbTest("featureofinterest")
                .select("*")
                .orderBy("id")
                .then((items) => {
                    const itemObject = items[items.length - 1];
                    myId = itemObject.id;
                    const datas = {
                        "name": "My New Name",
                        "feature": {
                            "type": "Point",
                            "coordinates": [48.11829243294942, -1.717928984533772]
                        }
                    };
                    const infos = {
                        api: `{patch} ${entity.name} Patch one`,
                        apiName: `Patch${entity.name}`,
                        apiDescription: "Patch a Feature of interest.",
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
                            newItems.name.should.not.eql(itemObject.name);
                            addToApiDoc({
                                api: `{patch} ${entity.name} Patch one`,
                                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#65",
                                apiName: `Patch${entity.name}`,
                                apiDescription: "Patch a sensor.",
                                // apiParam: _PARAMS.slice(0, 4),
                                result: res
                            });
                            done();
                        });
                });
        });

        it("Return Error Feature of interest does not exist", (done) => {
            chai.request(server)
                .patch(`/test/v1.0/${entity.name}(${BigInt(Number.MAX_SAFE_INTEGER)})`)
                .send({
                    "name": "My New Name",
                    "feature": {
                        "type": "Point",
                        "coordinates": [-115.06, 55.05]
                    }
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
        it("should return no content with code 204", (done) => {
            dbTest(entity.table)
                .select("*")
                .orderBy("id")
                .then((items) => {
                    const thingObject = items[items.length - 1];
                    const lengthBeforeDelete = items.length;
                    const infos = {
                        api: `{delete} ${entity.name} Delete one`,
                        apiName: `Delete${entity.name}`,
                        apiDescription: "Delete a Feature of interest.",
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
                            dbTest(entity.table)
                                .select("*")
                                .orderBy("id")
                                .then((updatedThings) => {
                                    updatedThings.length.should.eql(lengthBeforeDelete - 1);
                                    addToApiDoc({ ...infos, result: res });
                                    done();
                                });
                        });
                });
        });
        it("should throw an error if the movie does not exist", (done) => {
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
