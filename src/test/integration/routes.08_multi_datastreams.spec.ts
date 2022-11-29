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
    defaultPatch,
    defaultDelete,
    defaultGet,
    defaultPost
} from "./constant";
import { server } from "../../server/index";
import { dbTest } from "../dbTest";
import { _DBDATAS } from "../../server/db/constants";
import { IEntity } from "../../server/types";

export const testsKeys = [
    "@iot.id",
    "name",
    "description",
    "@iot.selfLink",
    "Thing@iot.navigationLink",
    "Sensor@iot.navigationLink",
    "ObservedProperties@iot.navigationLink",
    "Observations@iot.navigationLink",
    "unitOfMeasurements",
    "observationType",
    "multiObservationDataTypes"
];

chai.use(chaiHttp);

const should = chai.should();

const docs: IApiDoc[] = [];
const entity: IEntity = _DBDATAS.MultiDatastreams;

const addToApiDoc = (input: IApiInput) => {
    docs.push(prepareToApiDoc(input, entity.name));
};

addToApiDoc({
    api: `{infos} ${entity.name} Infos`,
    apiName: `Infos${entity.name}`,
    apiDescription: `MultiDatastream entity is an extension to handle complex observations when the result is an array.<br><img src="./assets/multi.jpg" alt="${entity.name}"></br>`,
    apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#77",
    result: ""
});

describe("endpoint : MultiDatastream", () => {
    let myId = "";
    let myError = "";
    let firstID = 0;
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
        it("Return all MultiDatastreams", (done) => {
            const infos = {
                api: `{get} ${entity.name} Get all`,
                apiName: `GetAll${entity.name}`,
                apiDescription: "Retrieve all Multi Datastreams.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#37",
                apiExample: {
                    http: `/v1.0/${entity.name}`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                },
                apiSuccess: ["{number} id @iot.id", "{relation} selfLink @iot.selfLink", ...success]
            };
            dbTest(_DBDATAS.MultiDatastreams.table)
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

        it(`Return MultiDatastream id: ${firstID}`, (done) => {
            const id: number = firstID;
            const infos = {
                api: `{get} ${entity.name}(:id) Get one`,
                apiName: `GetOne${entity.name}`,
                apiDescription: "Get a specific Multi Datastreams.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#38",
                apiExample: {
                    http: `/v1.0/${entity.name}(${id})`,
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
                    res.body["@iot.id"].should.eql(id);
                    res.body["@iot.selfLink"].should.contain(`/MultiDatastreams(${id})`);
                    res.body["Sensor@iot.navigationLink"].should.contain(`/MultiDatastreams(${id})/Sensor`);
                    res.body["ObservedProperties@iot.navigationLink"].should.contain(`/MultiDatastreams(${id})/ObservedProperties`);
                    res.body["Observations@iot.navigationLink"].should.contain(`/MultiDatastreams(${id})/Observations`);
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return error if MultiDatastream does not exist", (done) => {
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

        it("Return MultiDatastreams of a specific Thing.", (done) => {
            const id = 15;
            const infos = {
                api: `{get} Things(${id})/${entity.name}(:id) Get from specific Thing`,
                apiName: `GetAllFromThing${entity.name}`,
                apiDescription: "Get Multi Datastreams(s) from Thing.",
                apiExample: {
                    http: `/v1.0/Things(${id})/${entity.name}`,
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
                    res.body["@iot.count"].should.eql("3");
                    res.body.value.length.should.eql(3);
                    res.body.value[0]["@iot.id"].should.eql(8);
                    res.body.value[0]["@iot.selfLink"].should.contain("/MultiDatastreams(8)");
                    res.body.value[0]["Sensor@iot.navigationLink"].should.contain("/MultiDatastreams(8)/Sensor");
                    res.body.value[0]["ObservedProperties@iot.navigationLink"].should.contain("/MultiDatastreams(8)/ObservedProperties");
                    res.body.value[0]["Observations@iot.navigationLink"].should.contain("/MultiDatastreams(8)/Observations");
                    res.body.value = [res.body.value[0], res.body.value[1], "..."];
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return all informations for a MultiDatastream.", (done) => {
            const id = 1;
            const infos = {
                api: `{get} all ${entity.name} informations`,
                apiName: `GetAllFromInfos${entity.name}`,
                apiDescription: "Get all informations of a Multi Datastreams(s).",
                apiExample: {
                    http: `/v1.0/${entity.name}(${id})?$expand=Thing/Locations/FeatureOfInterest,Sensor,ObservedProperties`,
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
                    res.body.should.include.keys("Thing");
                    res.body["Thing"].should.include.keys("Locations");
                    // res.body["Thing"]["Locations"].should.include.keys("FeatureOfInterest");
                    res.body.should.include.keys("Sensor");
                    res.body.should.include.keys("ObservedProperties");
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return MultiDatastreams Subentity Thing", (done) => {
            const name = "Thing";
            chai.request(server)
                .get(`/test/v1.0/${entity.name}(10)/${name}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body["@iot.count"].should.eql("1");
                    const id = res.body.value[0]["@iot.id"];
                    res.body.value[0]["@iot.selfLink"].should.contain(`/${name}s(${id})`);
                    res.body.value[0]["Locations@iot.navigationLink"].should.contain(`/${name}s(${id})/Locations`);
                    res.body.value[0]["HistoricalLocations@iot.navigationLink"].should.contain(`/${name}s(${id})/HistoricalLocations`);
                    res.body.value[0]["Datastreams@iot.navigationLink"].should.contain(`/${name}s(${id})/Datastreams`);
                    res.body.value[0]["MultiDatastreams@iot.navigationLink"].should.contain(`/${name}s(${id})/MultiDatastreams`);
                    done();
                });
        });

        it("Return MultiDatastreams Subentity Sensor", (done) => {
            const name = "Sensor";
            chai.request(server)
                .get(`/test/v1.0/${entity.name}(10)/${name}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body["@iot.count"].should.eql("1");
                    const id = res.body.value[0]["@iot.id"];
                    res.body.value[0]["@iot.selfLink"].should.contain(`/Sensors(${id})`);
                    res.body.value[0]["Datastreams@iot.navigationLink"].should.contain(`/Sensors(${id})/Datastreams`);
                    res.body.value[0]["MultiDatastreams@iot.navigationLink"].should.contain(`/Sensors(${id})/MultiDatastreams`);
                    done();
                });
        });

        it("Return MultiDatastreams Subentity ObservedProperties", (done) => {
            const name = "ObservedProperties";
            chai.request(server)
                .get(`/test/v1.0/${entity.name}(10)/${name}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body["@iot.count"].should.eql("2");
                    const id = res.body.value[0]["@iot.id"];
                    res.body.value[0]["@iot.selfLink"].should.contain(`/ObservedProperties(${id})`);
                    res.body.value[0]["Datastreams@iot.navigationLink"].should.contain(`/ObservedProperties(${id})/Datastreams`);
                    res.body.value[0]["MultiDatastreams@iot.navigationLink"].should.contain(`/ObservedProperties(${id})/MultiDatastreams`);
                    done();
                });
        });

        it("Return MultiDatastreams Subentity Observations", (done) => {
            const name = "Observations";
            chai.request(server)
                .get(`/test/v1.0/${entity.name}(10)/${name}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body["@iot.count"].should.eql("3");
                    const id = Number(res.body.value[0]["@iot.id"]);
                    res.body.value[0]["@iot.selfLink"].should.contain(`/${name}(${id})`);
                    res.body.value[0]["Datastream@iot.navigationLink"].should.contain(`/${name}(${id})/Datastream`);
                    res.body.value[0]["MultiDatastream@iot.navigationLink"].should.contain(`/${name}(${id})/MultiDatastream`);
                    res.body.value[0]["FeatureOfInterest@iot.navigationLink"].should.contain(`/${name}(${id})/FeatureOfInterest`);
                    done();
                });
        });

        it("Return MultiDatastreams Expand Things", (done) => {
            const name = "Thing";
            chai.request(server)
                .get(`/test/v1.0/${entity.name}(2)?$expand=${name}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    const id = Number(res.body[name]["@iot.id"]);
                    res.body[name]["@iot.selfLink"].should.contain(`/Things(${id})`);
                    res.body[name]["Locations@iot.navigationLink"].should.contain(`Things(${id})/Locations`);
                    res.body[name]["HistoricalLocations@iot.navigationLink"].should.contain(`/Things(${id})/HistoricalLocations`);
                    res.body[name]["Datastreams@iot.navigationLink"].should.contain(`Things(${id})/Datastreams`);
                    res.body[name]["MultiDatastreams@iot.navigationLink"].should.contain(`Things(${id})/MultiDatastreams`);
                    done();
                });
        });

        it("Return MultiDatastreams Expand Sensor", (done) => {
            const name = "Sensor";
            chai.request(server)
                .get(`/test/v1.0/${entity.name}(2)?$expand=${name}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    const id = Number(res.body[name]["@iot.id"]);
                    res.body[name]["@iot.selfLink"].should.contain(`/Sensors(${id})`);
                    res.body[name]["Datastreams@iot.navigationLink"].should.contain(`Sensors(${id})/Datastreams`);
                    res.body[name]["MultiDatastreams@iot.navigationLink"].should.contain(`Sensors(${id})/MultiDatastreams`);
                    done();
                });
        });

        it("Return MultiDatastreams Expand Observations", (done) => {
            const name = "Observations";
            chai.request(server)
                .get(`/test/v1.0/${entity.name}(2)?$expand=${name}`)
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

        it("Return MultiDatastreams Expand ObservedProperties", (done) => {
            const name = "ObservedProperties";
            chai.request(server)
                .get(`/test/v1.0/${entity.name}(1)?$expand=${name}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    const id = Number(res.body[name][0]["@iot.id"]);
                    res.body[name][0]["@iot.selfLink"].should.contain(`/ObservedProperties(${id})`);
                    res.body[name][0]["Datastreams@iot.navigationLink"].should.contain(`ObservedProperties(${id})/Datastreams`);
                    res.body[name][0]["MultiDatastreams@iot.navigationLink"].should.contain(`ObservedProperties(${id})/MultiDatastreams`);
                    done();
                });
        });
    });

    describe(`{post} ${entity.name} Create`, () => {
        it("Return added MultiDatastream", (done) => {
            const datas = {
                description: "Air quality readings",
                name: "air_quality_readings",
                Thing: {
                    "@iot.id": 2
                },
                Sensor: {
                    "@iot.id": 1
                },
                multiObservationDataTypes: ["humidity", "Temperature"],
                unitOfMeasurements: [
                    {
                        symbol: "%",
                        name: "humidity",
                        definition: "http://unitsofmeasure.org/ucum.html"
                    },
                    {
                        name: "Temperature",
                        symbol: "°",
                        definition: "http://unitsofmeasure.org/blank.html"
                    }
                ],
                ObservedProperties: [
                    {
                        name: "humidity",
                        definition: "humidity",
                        description: "valeur en pourcentage du taux d'humidity de l'air"
                    },
                    {
                        name: "Temperature",
                        definition: "Temperature",
                        description: "valeur en degré de la Temperature de l'air"
                    }
                ]
            };
            const infos = {
                api: `{post} ${entity.name} Post with existing Thing And Sensor`,
                apiName: `PostExistingThing${entity.name}`,
                apiDescription: "Post a new Multi Datastreams.",
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
                .post("/test/v1.0/MultiDatastreams")
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

        it("Return added MultiDatastream with created Thing", (done) => {
            const datas = {
                description: "Air quality readings",
                name: "air_quality_readings",
                Thing: {
                    description: "A New SensorWeb thing",
                    name: "SensorWebThing",
                    properties: {
                        organization: "Mozilla",
                        owner: "Mozilla"
                    }
                },
                Sensor: {
                    name: "DHT72",
                    description: "DHT72 temperature Humidity sensor",
                    encodingType: "application/pdf",
                    metadata: "https://cdn-shop.adafruit.com/datasheets/DHT72.pdf"
                },
                multiObservationDataTypes: ["humidity", "Temperature"],
                unitOfMeasurements: [
                    {
                        symbol: "%",
                        name: "humidity",
                        definition: "http://unitsofmeasure.org/ucum.html"
                    },
                    {
                        name: "Temperature",
                        symbol: "°",
                        definition: "http://unitsofmeasure.org/blank.html"
                    }
                ],
                ObservedProperties: [
                    {
                        name: "humidity",
                        definition: "humidity",
                        description: "valeur en pourcentage du taux d'humidity de l'air"
                    },
                    {
                        name: "Temperature",
                        definition: "Temperature",
                        description: "valeur en degré de la Temperature de l'air"
                    }
                ]
            };
            const infos = {
                api: `{post} ${entity.name} Post With Thing and Sensor`,
                apiName: `PostThingSensor${entity.name}`,
                apiDescription: "Post a new Multi Datastream With New Thing and Sensor.",
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
                    docs[docs.length - 1].apiErrorExample = myError;

                    done();
                });
        });

        it("Return Error if ObservedProperties length not equal multiObservationDataTypes", (done) => {
            chai.request(server)
                .post("/test/v1.0/MultiDatastreams")
                .send({
                    description: "Air quality readings",
                    name: "air_quality_readings",
                    Thing: {
                        "@iot.id": 2
                    },
                    Sensor: {
                        "@iot.id": 1
                    },
                    multiObservationDataTypes: ["humidity", "Temperature"],
                    unitOfMeasurements: [
                        {
                            symbol: "%",
                            name: "humidity",
                            definition: "http://unitsofmeasure.org/ucum.html"
                        },
                        {
                            name: "Temperature",
                            symbol: "°",
                            definition: "http://unitsofmeasure.org/blank.html"
                        }
                    ],
                    ObservedProperties: [
                        {
                            name: "humidity",
                            definition: "humidity",
                            description: "valeur en pourcentage du taux d'humidity de l'air"
                        }
                    ]
                })
                .set("Cookie", `${keyTokenName}=${token}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(400);
                    res.body["detail"].should.eql("Size of list of ObservedProperties (1) is not equal to size of multiObservationDataTypes (2)");
                    done();
                });
        });

        it("Return Error if unitOfMeasurements length not equal multiObservationDataTypes", (done) => {
            chai.request(server)
                .post("/test/v1.0/MultiDatastreams")
                .send({
                    description: "Air quality readings",
                    name: "air_quality_readings",
                    Thing: {
                        "@iot.id": 2
                    },
                    Sensor: {
                        "@iot.id": 1
                    },
                    multiObservationDataTypes: ["humidity", "Temperature"],
                    unitOfMeasurements: [
                        {
                            symbol: "%",
                            name: "humidity",
                            definition: "http://unitsofmeasure.org/ucum.html"
                        }
                    ],
                    ObservedProperties: [
                        {
                            name: "humidity",
                            definition: "humidity",
                            description: "valeur en pourcentage du taux d'humidity de l'air"
                        },
                        {
                            name: "Temperature",
                            definition: "Temperature",
                            description: "valeur en degré de la Temperature de l'air"
                        }
                    ]
                })
                .set("Cookie", `${keyTokenName}=${token}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(400);
                    res.body["detail"].should.eql("Size of list of unitOfMeasurements (1) is not equal to size of multiObservationDataTypes (2)");
                    done();
                });
        });
    });

    describe(`{patch} ${entity.name} Patch`, () => {
        it("Return updated MultiDatastream", (done) => {
            dbTest(_DBDATAS.MultiDatastreams.table)
                .select("*")
                .orderBy("id")
                .then((items) => {
                    const itemObject = items[items.length - 1];
                    myId = itemObject.id;
                    const datas = {
                        description: "Modification of the description"
                    };
                    const infos = {
                        api: `{patch} ${entity.name} Patch one`,
                        apiName: `Patch${entity.name}`,
                        apiDescription: "Patch a Multi Datastream.",
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
                            newItems.description.should.not.eql(itemObject.description);
                            addToApiDoc({ ...infos, result: res });
                            done();
                        });
                });
        });

        it("Return Error if the MultiDatastream does not exist", (done) => {
            chai.request(server)
                .patch(`/test/v1.0/${entity.name}(${BigInt(Number.MAX_SAFE_INTEGER)})`)
                .send({
                    unitOfMeasurement: {
                        symbol: "ºC",
                        name: "Celsius",
                        definition: "http://unitsofmeasure.org/ucum.html"
                    },
                    observationType: "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement",
                    description: "Temp readings",
                    name: "temp_readings"
                })
                .set("Cookie", `${keyTokenName}=${token}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(404);
                    res.type.should.equal("application/json");
                    // the JSON response body should have a

                    docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4).replace(Number.MAX_SAFE_INTEGER.toString(), myId);

                    done();
                });
        });
    });

    describe(`{delete} ${entity.name} Delete`, () => {
        it("should return no content with code 204", (done) => {
            dbTest(_DBDATAS.MultiDatastreams.table)
                .select("*")
                .orderBy("id")
                .then((items) => {
                    const thingObject = items[items.length - 1];
                    myId = thingObject.id;
                    const lengthBeforeDelete = items.length;
                    const infos = {
                        api: `{delete} ${entity.name} Delete one`,
                        apiName: `Delete${entity.name}`,
                        apiDescription: "Delete a Multi Datastream.",
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
                            dbTest(_DBDATAS.MultiDatastreams.table)
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
        it("Return Error if the MultiDatastream does not exist", (done) => {
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
