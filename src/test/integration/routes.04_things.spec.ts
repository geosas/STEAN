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
    defaultGet,
    defaultPost,
    identification,
    keyTokenName,
    defaultPatch,
    defaultDelete,
    addToFile,
    writeAddToFile
} from "./constant";
import { server } from "../../server/index";
import { dbTest } from "../dbTest";
import { _DBDATAS } from "../../server/db/constants";
import { IEntity } from "../../server/types";

export const testsKeys = [
    "@iot.id",
    "@iot.selfLink",
    "description",
    "name",
    "properties",
    "Locations@iot.navigationLink",
    "HistoricalLocations@iot.navigationLink",
    "Datastreams@iot.navigationLink",
    "MultiDatastreams@iot.navigationLink"
];

chai.use(chaiHttp);

const should = chai.should();

const docs: IApiDoc[] = [];
const entity: IEntity = _DBDATAS.Things;



const addToApiDoc = (input: IApiInput) => {
    docs.push(prepareToApiDoc(input, entity.name));
};

addToApiDoc({
    api: `{infos} ${entity.name} infos`,
    apiName: `Infos${entity.name}`,
    apiDescription: `A Thing is an object of the physical world (physical Things) or the information world (virtual Things) that is capable of being identified and integrated into communication networks<br>
    Thing is a good starting point to start creating the SensorThings model structure.<br>
    <br>
    A Thing has Locations and one or more Datastreams to collect Observations. A minimal Thing can be created without a Location and Datastream and there are options to create a Things with a nested linked Location and Datastream.`,
    apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#25",
    result: ""
});

describe("endpoint : Thing [8.2.1]", () => {
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
                .type("form")
                .end((err: any, res: any) => {
                    token = String(res.body["token"]);
                    done();
                });
        });
    });

    describe(`{get} ${entity.name}`, () => {
        it("Return all Things", (done) => {
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

            chai.request(server)
                .get(addToFile(addToFile(`/test${infos.apiExample.http}`)))
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.value.length.should.eql(20);
                    res.body.value = [res.body.value[0], res.body.value[1], "..."];
                    addToApiDoc({ ...infos, result: res });
                    docs[docs.length - 1].apiErrorExample = JSON.stringify({ "code": 404, "message": "Not Found" }, null, 4);
                    done();
                });
        });

        it("Return Thing id: 1", (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get one`,
                apiName: `GetOne${entity.name}`,
                apiDescription: `Get a specific Thing.`,
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#38",
                apiExample: {
                    http: `/v1.0/${entity.name}(1)`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                }
            };
            chai.request(server)
                .get(addToFile(`/test${infos.apiExample.http}`))
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.should.include.keys(testsKeys);
                    res.body["@iot.id"].should.eql(1);
                    res.body["@iot.selfLink"].should.contain("/Things(1)");
                    res.body["Locations@iot.navigationLink"].should.contain("/Things(1)/Locations");
                    res.body["HistoricalLocations@iot.navigationLink"].should.contain("/Things(1)/HistoricalLocation");
                    res.body["Datastreams@iot.navigationLink"].should.contain("/Things(1)/Datastreams");
                    res.body["MultiDatastreams@iot.navigationLink"].should.contain("/Things(1)/MultiDatastreams");
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return error if Thing does not exist", (done) => {
            chai.request(server)
                .get(addToFile(`/test/v1.0/${entity.name}(${BigInt(Number.MAX_SAFE_INTEGER)})`))
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.equal(404);
                    res.type.should.equal("application/json");
                    docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4).replace(Number.MAX_SAFE_INTEGER.toString(), "1");
                    done();
                });
        });

        it("Return property name of Thing id: 1", (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get only a property`,
                apiName: `GetName${entity.name}`,
                apiDescription: "Get the name of a specific Thing.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#39",
                apiExample: {
                    http: `/v1.0/${entity.name}(1)/name`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                }
            };
            chai.request(server)
                .get(addToFile(`/test${infos.apiExample.http}`))
                .end((err: any, res: any) => {
                    // there should be no errors
                    should.not.exist(err);
                    // there should be a 200 status code
                    res.status.should.equal(200);
                    // the response should be JSON
                    res.type.should.equal("application/json");
                    // the JSON response body should have a
                    // key-value pair of {"value": 1 thing object}
                    res.body.should.include.keys("name");
                    Object.keys(res.body).length.should.eql(1);
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return error if the column does not exist", (done) => {
            chai.request(server)
                .get(addToFile(`/test/v1.0/${entity.name}(${BigInt(Number.MAX_SAFE_INTEGER)})/nameNot`))
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.equal(404);
                    res.type.should.equal("application/json");
                    docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4);
                    done();
                });
        });

        it("Return value of property name Thing id: 1", (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get only the value of a property`,
                apiName: `GetNameValue${entity.name}`,
                apiDescription: "Get the value of the property of a specific Thing.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#40",
                apiExample: {
                    http: `/v1.0/${entity.name}(1)/name/$value`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                }
            };
            chai.request(server)
                .get(addToFile(`/test${infos.apiExample.http}`))
                .end((err: any, res: any) => {
                    // there should be no errors
                    should.not.exist(err);
                    // there should be a 200 status code
                    res.status.should.equal(200);
                    // the response should be text plain
                    res.type.should.equal("text/plain");
                    res.text.should.contain("SensorWebThing");
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return Thing Select @iot.id", (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get Select with @iot.id`,
                apiName: `Get${entity.name}SelectIot`,
                apiDescription: "Get with select with @iot.id.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#48",
                apiExample: {
                    http: `/v1.0/${entity.name}?$select=name,description,@iot.id`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                }
            };
            chai.request(server)
                .get(addToFile(`/test${infos.apiExample.http}`))
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body["@iot.count"].should.eql("20");
                    res.body.value[0]["@iot.id"].should.eql(1);
                    Object.keys(res.body.value[0]).length.should.eql(3);
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return Thing Select id", (done) => {
            chai.request(server)
                .get(addToFile(`/test/v1.0/${entity.name}?$select=name,description,id`,))
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body["@iot.count"].should.eql("20");
                    res.body.value[0]["@iot.id"].should.eql(1);
                    Object.keys(res.body.value[0]).length.should.eql(3);
                    done();
                });
        });

        it("Return Thing Select with Datastreams navigation link", (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get Select with navigation link`,
                apiName: `Get${entity.name}SelectNavLink`,
                apiDescription: "Get select with navigation link",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#48",
                apiExample: {
                    http: `/v1.0/${entity.name}?$select=name,description,Datastreams`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                }
            };
            chai.request(server)
                .get(addToFile(`/test${infos.apiExample.http}`))
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body["@iot.count"].should.eql("20");
                    res.body.value[0]["Datastreams@iot.navigationLink"].should.contain("/Things(1)/Datastreams");
                    Object.keys(res.body.value[0]).length.should.eql(3);
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return Thing Subentity Locations", (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get Subentity Locations`,
                apiName: `Get${entity.name}Subentity`,
                apiDescription: "Get Subentity Locations of a specific Thing.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#41",
                apiExample: {
                    http: `/v1.0/${entity.name}(6)/Locations`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                }
            };
            chai.request(server)
                .get(addToFile(`/test${infos.apiExample.http}`))
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body["@iot.count"].should.eql("1");
                    res.body.value[0]["@iot.id"].should.eql(1);
                    res.body.value[0]["@iot.selfLink"].should.contain("/Locations(1)");
                    res.body.value[0]["Things@iot.navigationLink"].should.contain("/Locations(1)/Things");
                    res.body.value[0]["HistoricalLocations@iot.navigationLink"].should.contain("Locations(1)/HistoricalLocations");
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return Thing Subentity HistoricalLocations", (done) => {
            chai.request(server)
                .get(addToFile(`/test/v1.0/${entity.name}(6)/HistoricalLocations`))
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body["@iot.count"].should.eql("2");
                    res.body.value[0]["@iot.id"].should.eql(1);
                    res.body.value[0]["@iot.selfLink"].should.contain("HistoricalLocations(1)");
                    res.body.value[0]["Things@iot.navigationLink"].should.contain("/HistoricalLocations(1)/Things");
                    res.body.value[0]["Locations@iot.navigationLink"].should.contain("HistoricalLocations(1)/Locations");
                    done();
                });
        });

        it("Return Thing Subentity Datastreams", (done) => {
            chai.request(server)
                .get(addToFile(`/test/v1.0/${entity.name}(6)/Datastreams`))
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    const id = Number(res.body.value[0]["@iot.id"]);
                    res.body.value[0]["@iot.selfLink"].should.contain(`Datastreams(${id})`);
                    res.body.value[0]["Thing@iot.navigationLink"].should.contain(`/Datastreams(${id})/Thing`);
                    res.body.value[0]["Sensor@iot.navigationLink"].should.contain(`/Datastreams(${id})/Sensor`);
                    res.body.value[0]["ObservedProperty@iot.navigationLink"].should.contain(`/Datastreams(${id})/ObservedProperty`);
                    res.body.value[0]["Observations@iot.navigationLink"].should.contain(`/Datastreams(${id})/Observations`);

                    done();
                });
        });

        it("Return Thing Subentity MultiDatastreams", (done) => {
            chai.request(server)
                .get(addToFile(`/test/v1.0/${entity.name}(12)/MultiDatastreams`))
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body["@iot.count"].should.eql("2");
                    res.body.value[0]["@iot.id"].should.eql(1);
                    res.body.value[0]["@iot.selfLink"].should.contain("MultiDatastreams(1)");
                    res.body.value[0]["Thing@iot.navigationLink"].should.contain("/MultiDatastreams(1)/Thing");
                    res.body.value[0]["Sensor@iot.navigationLink"].should.contain("/MultiDatastreams(1)/Sensor");
                    res.body.value[0]["ObservedProperties@iot.navigationLink"].should.contain("/MultiDatastreams(1)/ObservedProperties");
                    res.body.value[0]["Observations@iot.navigationLink"].should.contain("/MultiDatastreams(1)/Observations");

                    done();
                });
        });

        it("Return Thing Expand Locations", (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get Expand Locations`,
                apiName: `Get${entity.name}Expand`,
                apiDescription: "Get Expand Locations of a specific Thing.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#47",
                apiExample: {
                    http: `/test/v1.0/${entity.name}(6)?$expand=Locations`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                }
            };
            chai.request(server)
                .get(addToFile(`/test${infos.apiExample.http}`))
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.Locations[0]["@iot.id"].should.eql(1);
                    res.body.Locations[0]["@iot.selfLink"].should.contain("/Locations(1)");
                    res.body.Locations[0]["Things@iot.navigationLink"].should.contain("/Locations(1)/Things");
                    res.body.Locations[0]["HistoricalLocations@iot.navigationLink"].should.contain("Locations(1)/HistoricalLocations");
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return Thing Expand Locations With select inside", (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get Expand Locations`,
                apiName: `Get${entity.name}ExpandSelect`,
                apiDescription: "Get Expand Locations of a specific Thing with a select inside.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#48",
                apiExample: {
                    http: `/v1.0/${entity.name}(6)?$expand=Locations($select=location)`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                }
            };
            chai.request(server)
                .get(addToFile(`/test${infos.apiExample.http}`))
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    Object.keys(res.body.Locations[0]).should.contain("location");
                    Object.keys(res.body.Locations[0]).length.should.equal(1);
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return Thing Expand Locations , HistoricalLocations", (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get Expand coma separation`,
                apiName: `Get${entity.name}ExpandComaHistorical`,
                apiDescription: "Get Expand Locations and Historical Location of a specific Thing.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#47",
                apiExample: {
                    http: `/v1.0/${entity.name}(6)?$expand=Locations,HistoricalLocations`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                }
            };
            chai.request(server)
                .get(addToFile(`/test${infos.apiExample.http}`))
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.Locations[0]["@iot.id"].should.eql(1);
                    res.body.Locations[0]["@iot.selfLink"].should.contain("Locations(1)");
                    res.body.HistoricalLocations[0]["@iot.id"].should.eql(1);
                    res.body.HistoricalLocations[0]["@iot.selfLink"].should.contain("HistoricalLocations(1)");
                    addToApiDoc({ ...infos, result: res });

                    done();
                });
        });

        it("Return Thing Expand Locations / HistoricalLocations", (done) => {
            const infos = {
                api: `{get} ${entity.name}(:id) Get Expand  slash separation`,
                apiName: `Get${entity.name}ExpandSlashHistorical`,
                apiDescription: "Get Expand Locations and it's Historical Location of a specific Thing.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#47",
                apiExample: {
                    http: `/v1.0/${entity.name}(6)?$expand=Locations/HistoricalLocations`,
                    curl: defaultGet("curl", "KEYHTTP"),
                    javascript: defaultGet("javascript", "KEYHTTP"),
                    python: defaultGet("python", "KEYHTTP")
                }
            };
            chai.request(server)
                .get(addToFile(`/test${infos.apiExample.http}`))
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.Locations[0]["@iot.id"].should.eql(1);
                    res.body.Locations[0]["@iot.selfLink"].should.contain("Locations(1)");
                    res.body.Locations[0].HistoricalLocations[0]["@iot.id"].should.eql(1);
                    res.body.Locations[0].HistoricalLocations[0]["@iot.selfLink"].should.contain("HistoricalLocations(1)");
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Return Thing Expand HistoricalLocations", (done) => {
            const name = "HistoricalLocations";

            chai.request(server)
                .get(addToFile(`/test/v1.0/${entity.name}(6)?$expand=HistoricalLocations`))
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    const id = Number(res.body[name][0]["@iot.id"]);
                    res.body[name][0]["@iot.selfLink"].should.contain(`HistoricalLocations(${id})`);
                    res.body[name][0]["Things@iot.navigationLink"].should.contain(`/HistoricalLocations(${id})/Things`);
                    res.body[name][0]["Locations@iot.navigationLink"].should.contain(`HistoricalLocations(${id})/Locations`);
                    done();
                });
        });

        it("Return Thing Expand Datastreams", (done) => {
            const name = "Datastreams";
            chai.request(server)
                .get(addToFile(`/test/v1.0/${entity.name}(6)?$expand=Datastreams`))
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    const id = Number(res.body[name][0]["@iot.id"]);
                    res.body[name][0]["@iot.selfLink"].should.contain(`Datastreams(${id})`);
                    res.body[name][0]["Thing@iot.navigationLink"].should.contain(`/Datastreams(${id})/Thing`);
                    res.body[name][0]["Sensor@iot.navigationLink"].should.contain(`/Datastreams(${id})/Sensor`);
                    res.body[name][0]["ObservedProperty@iot.navigationLink"].should.contain(`/Datastreams(${id})/ObservedProperty`);
                    res.body[name][0]["Observations@iot.navigationLink"].should.contain(`/Datastreams(${id})/Observations`);

                    done();
                });
        });

        it("Return Thing Select with Expand Datastreams", (done) => {
            chai.request(server)
                .get(addToFile(`/test/v1.0/${entity.name}?$select=name,description&$expand=Datastreams`))
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    Object.keys(res.body["value"][0]).length.should.equal(3);
                    done();
                });
        });

        it("Return Thing Expand MultiDatastreams", (done) => {
            chai.request(server)
                .get(addToFile(`/test/v1.0/${entity.name}(12)?$expand=MultiDatastreams`))
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.MultiDatastreams[0]["@iot.id"].should.eql(1);
                    res.body.MultiDatastreams[0]["@iot.selfLink"].should.contain("MultiDatastreams(1)");
                    res.body.MultiDatastreams[0]["Thing@iot.navigationLink"].should.contain("/MultiDatastreams(1)/Thing");
                    res.body.MultiDatastreams[0]["Sensor@iot.navigationLink"].should.contain("/MultiDatastreams(1)/Sensor");
                    res.body.MultiDatastreams[0]["ObservedProperties@iot.navigationLink"].should.contain("/MultiDatastreams(1)/ObservedProperties");
                    res.body.MultiDatastreams[0]["Observations@iot.navigationLink"].should.contain("/MultiDatastreams(1)/Observations");

                    done();
                });
        });

        // it("Return Things association link", (done) => {
        //     const infos = {
        //         api: `{get} ${entity.name}(:id) Get Subentity Locations`,
        //         apiName: `Get${entity.name}RefLinks`,
        //         apiDescription: "Get Subentity Locations of a specific Thing.",
        //         apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#41",
        //         apiExample: {
        //             http: `/v1.0/${entity.name}/$ref`,
        //             curl: defaultGet("curl", "KEYHTTP"),
        //             javascript: defaultGet("javascript", "KEYHTTP"),
        //             python: defaultGet("python", "KEYHTTP")
        //         }
        //     };
        //     chai.request(server)
        //         .get(addToFile(`/test${infos.apiExample.http}`))
        //         .end((err: any, res: any) => {
        //             should.not.exist(err);
        //             res.status.should.equal(200);
        //             res.type.should.equal("application/json");
        //             res.body["@iot.count"].should.eql("20");
        //             res.body.value[0]["@iot.selfLink"].should.contain("/Things(1)");
        //             addToApiDoc({ ...infos, result: res });
        //             done();
        //         });
        // });        
    });

    describe(`{post} ${entity.name} Create. [10.2.1]`, () => {
        let myError = "";

        // http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#61
        it("Return added Thing", (done) => {
            const datas = {
                "description": "A SensorWeb thing",
                "name": "SensorWebThing",
                "properties": {
                    "organization": "Mozilla",
                    "owner": "Mozilla"
                }
            };
            const infos = {
                api: `{post} ${entity.name} Post basic`,
                apiName: `Post${entity.name}`,
                apiDescription: "Post a new Thing.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#61",
                apiPermission: "admin:computer",
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
                .post("/test/v1.0/things")
                .send({})
                .set("Cookie", `${keyTokenName}=${token}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(400);
                    res.type.should.equal("application/json");
                    // res.body;
                    myError = JSON.stringify(res.body, null, 4);
                    docs[docs.length - 1].apiErrorExample = myError;
                    done();
                });
        });

        it("POST Thing with new Location", (done) => {
            const datas = {
                "name": "Temperature Monitoring System",
                "description": "Thing (POST with new Location)",
                "properties": {
                    "Deployment Condition": "Deployed in a third floor balcony",
                    "Case Used": "Radiation shield"
                },
                "Locations": {
                    "name": "Au Comptoir Vénitien (Created new location)",
                    "description": "Au Comptoir Vénitien",
                    "encodingType": "application/vnd.geo+json",
                    "location": {
                        "type": "Point",
                        "coordinates": [48.11829243294942, -1.717928984533772]
                    }
                }
            };

            const infos = {
                api: `{post} ${entity.name} Post with new Location`,
                apiName: `Post${entity.name}Location`,
                apiDescription: "A Location entity can be linked to a Thing at its creation time. The Location provided will be a new Location in the system.",
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
                .end(async (err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(201);
                    res.type.should.equal("application/json");
                    res.body.should.include.keys(testsKeys);
                    const thingId = String(res.body["@iot.id"]);
                    dbTest("location")
                        .orderBy("id", "desc")
                        .select("id")
                        .first()
                        .then((locationRes) => {
                            dbTest("thing_location")
                                .where({ thing_id: thingId, location_id: locationRes.id })
                                .then((tempSearchNew) => {
                                    if (tempSearchNew && tempSearchNew[0]) {
                                        tempSearchNew[0]["location_id"].should.eql(locationRes.id);
                                        tempSearchNew[0]["thing_id"].should.eql(thingId);
                                        dbTest("historical_location")
                                            .orderBy("id", "desc")
                                            .select("thing_id")
                                            .first()
                                            .then((historical_locationRes) => {
                                                if (historical_locationRes && historical_locationRes) {
                                                    historical_locationRes["thing_id"].should.eql(thingId);
                                                    addToApiDoc({ ...infos, result: res });
                                                    docs[docs.length - 1].apiErrorExample = myError;
                                                    done();
                                                }
                                            })
                                            .catch((e) => console.log(e));
                                    }
                                })
                                .catch((e) => console.log(e));
                        })
                        .catch((e) => console.log(e));
                });
        });

        it("POST Thing with existing Location", (done) => {
            const datas = {
                "name": "Temperature Monitoring System",
                "description": "Sensor (POST with existing Location)",
                "properties": {
                    "Deployment Condition": "Deployed in a third floor balcony",
                    "Case Used": "Radiation shield"
                },
                "Locations": [{ "@iot.id": "1" }]
            };
            const infos = {
                api: `{post} ${entity.name} Post with existing Location`,
                apiName: "PostThingExistLocation",
                apiDescription: "Create a Thing with existing location.",
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#62",
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
                    const thingId = String(res.body["@iot.id"]);
                    dbTest("thing_location")
                        .where({ thing_id: thingId, location_id: 1 })
                        .then((tempSearchNew) => {
                            if (tempSearchNew && tempSearchNew[0]) {
                                tempSearchNew[0]["location_id"].should.eql("1");
                                tempSearchNew[0]["thing_id"].should.eql(thingId);
                                dbTest("historical_location")
                                    .orderBy("id", "desc")
                                    .select("thing_id")
                                    .first()
                                    .then((historical_locationRes) => {
                                        if (historical_locationRes && historical_locationRes) {
                                            historical_locationRes["thing_id"].should.eql(thingId);
                                            addToApiDoc({ ...infos, result: res });
                                            docs[docs.length - 1].apiErrorExample = myError;

                                            done();
                                        }
                                    })
                                    .catch((e) => console.log(e));
                            }
                        })
                        .catch((e) => console.log(e));
                });
        });

        it("POST Thing with existing Location that don't exist", (done) => {
            chai.request(server)
                .post("/test/v1.0/Things")
                .set("Cookie", `${keyTokenName}=${token}`)
                .send({
                    "name": "Temperature Monitoring System",
                    "description": "Sensor (POST with existing Location not exist)",
                    "properties": {
                        "Deployment Condition": "Deployed in a third floor balcony",
                        "Case Used": "Radiation shield"
                    },
                    "Locations": [{ "@iot.id": 1908 }]
                })
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(400);
                    res.type.should.equal("application/json");

                    // res.body.message.should.eql("No id found for Locations : 1908");
                    docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4);
                    done();
                });
        });

        it("POST Thing with new Location & Datastream", (done) => {
            const datas = {
                "name": "Temperature Monitoring System",
                "description": "Sensor system monitoring area temperature Hot",
                "properties": {
                    "Deployment Condition": "Deployed in a third floor balcony",
                    "Case Used": "Radiation shield"
                },
                "Locations": [{
                    "name": "Au Comptoir Vénitien (Created new location)",
                    "description": "Au Comptoir Vénitien",
                    "encodingType": "application/vnd.geo+json",
                    "location": {
                        "type": "Point",
                        "coordinates": [48.11829243294942, -1.717928984533772]
                    }
                }],
                "Datastreams": [
                    {
                        "name": "Air Temperature DS",
                        "description": "Datastream for recording temperature",
                        "observationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement",
                        "unitOfMeasurement": {
                            "name": "Degree Celsius",
                            "symbol": "degC",
                            "definition": "http://www.qudt.org/qudt/owl/1.0.0/unit/Instances.html#DegreeCelsius"
                        },
                        "ObservedProperty": {
                            "name": "Area Temperature",
                            "description": "The degree or intensity of heat present in the area",
                            "definition": "http://www.qudt.org/qudt/owl/1.0.0/quantity/Instances.html#AreaTemperature"
                        },
                        "Sensor": {
                            "name": "DHT22",
                            "description": "DHT22 temperature sensor",
                            "encodingType": "application/pdf",
                            "metadata": "https://cdn-shop.adafruit.com/datasheets/DHT22.pdf"
                        }
                    }
                ]
            };
            const infos = {
                api: `{post} ${entity.name} Post with Location and Datastream`,
                apiName: "PostThingLocationDatastream",
                apiDescription: "Create a Thing with new location & datastream.",
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
                    const thingId = String(res.body["@iot.id"]);
                    dbTest("datastream")
                        .orderBy("id", "desc")
                        .first()
                        .then((datastreamRes) => {
                            dbTest("sensor")
                                .select("id")
                                .orderBy("id", "desc")
                                .first()
                                .then((sensorRes) => {
                                    dbTest("observedproperty")
                                        .select("id")
                                        .orderBy("id", "desc")
                                        .first()
                                        .then((observedpropertyRes) => {
                                            datastreamRes["thing_id"].should.eql(thingId);
                                            datastreamRes["sensor_id"].should.eql(sensorRes.id);
                                            datastreamRes["observedproperty_id"].should.eql(observedpropertyRes.id);
                                            addToApiDoc({ ...infos, result: res });
                                            docs[docs.length - 1].apiErrorExample = myError;
                                            done();
                                        })
                                        .catch((e) => console.log(e));
                                })
                                .catch((e) => console.log(e));
                        })
                        .catch((e) => console.log(e));
                });
        });
    });

    describe(`{patch} ${entity.name} one thing`, () => {
        it("Return updated Thing", (done) => {
            dbTest(entity.table)
                .select("*")
                .orderBy("id")
                .then((things) => {
                    const thingObject = things[things.length - 1];
                    myId = thingObject.id;
                    const datas = {
                        "name": "New SensorWebThing Patch",
                        "properties": {
                            "organization": "Mozilla",
                            "owner": "Mozilla"
                        }
                    };
                    const infos = {
                        api: `{patch} ${entity.name} Patch a Thing`,
                        apiName: `Patch${entity.name}`,
                        apiDescription: "Patch a Thing.",
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
                            const newThingObject = res.body;
                            newThingObject.name.should.not.eql(thingObject.name);
                            addToApiDoc({ ...infos, result: res });
                            done();
                        });
                });
        });

        it("Return Error if the Thing does not exist", (done) => {
            chai.request(server)
                .patch(`/test/v1.0/${entity.name}(${BigInt(Number.MAX_SAFE_INTEGER)})`)
                .set("Cookie", `${keyTokenName}=${token}`)
                .send({
                    "description": "A SensorWeb thing",
                    "name": "New SensorWebThing",
                    "properties": {
                        "organization": "Mozilla",
                        "owner": "Mozilla"
                    }
                })
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(404);
                    res.type.should.equal("application/json");

                    docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4).replace(Number.MAX_SAFE_INTEGER.toString(), myId);
                    done();
                });
        });

        it("Return updated Thing with new location", (done) => {
            dbTest(entity.table)
                .select("*")
                .orderBy("id")
                .then((things) => {
                    const thingObject = things[things.length - 1];
                    const datas = {
                        "name": "New SensorWebThing back",
                        "properties": {
                            "organization": "Mozilla",
                            "owner": "Mozilla"
                        },
                        "Locations": [{ "@iot.id": 10 }]
                    };
                    const infos = {
                        api: `{patch} ${entity.name} Patch with New location`,
                        apiName: `PatchLocation${entity.name}`,
                        apiDescription: "Modify location of a Thing.",
                        apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#65",
                        apiExample: {
                            http: `/v1.0/${entity.name}(${thingObject.id})`,
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
                            const thingId = String(res.body["@iot.id"]);
                            dbTest("thing_location")
                                .where({ thing_id: thingId, location_id: 10 })
                                .then((tempSearchNew) => {
                                    if (tempSearchNew && tempSearchNew[0]) {
                                        tempSearchNew[0]["location_id"].should.eql("10");
                                        tempSearchNew[0]["thing_id"].should.eql(thingId);
                                        dbTest("historical_location")
                                            .orderBy("id", "desc")
                                            .select("thing_id")
                                            .first()
                                            .then((historical_locationRes) => {
                                                if (historical_locationRes && historical_locationRes) {
                                                    historical_locationRes["thing_id"].should.eql(thingId);
                                                    addToApiDoc({ ...infos, result: res });
                                                    done();
                                                }
                                            })
                                            .catch((e) => console.log(e));
                                    }
                                })
                                .catch((e) => console.log(e));
                        });
                });
        });

        it("Return updated Thing with only location (relation only)", (done) => {
            dbTest(entity.table)
                .select("*")
                .orderBy("id")
                .then((things) => {
                    const thingObject = things[things.length - 1];
                    const datas = {
                        "Locations": [{ "@iot.id": 2 }]
                    };
                    const infos = {
                        api: `{patch} ${entity.name} Patch with existing Location`,
                        apiName: `PatchExistLocation${entity.name}`,
                        apiDescription: "Patch a Thing and only location change.",
                        apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#65",
                        apiExample: {
                            http: `/v1.0/${entity.name}(${thingObject.id})`,
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
                            const thingId = String(res.body["@iot.id"]);
                            dbTest("thing_location")
                                .where({ thing_id: thingId, location_id: 2 })
                                .then((tempSearchNew) => {
                                    if (tempSearchNew && tempSearchNew[0]) {
                                        tempSearchNew[0]["location_id"].should.eql("2");
                                        tempSearchNew[0]["thing_id"].should.eql(thingId);
                                        dbTest("historical_location")
                                            .orderBy("id", "desc")
                                            .select("thing_id")
                                            .first()
                                            .then((historical_locationRes) => {
                                                if (historical_locationRes && historical_locationRes) {
                                                    historical_locationRes["thing_id"].should.eql(thingId);
                                                    addToApiDoc({ ...infos, result: res });
                                                    done();
                                                }
                                            })
                                            .catch((e) => console.log(e));
                                    }
                                })
                                .catch((e) => console.log(e));
                        });
                });
        });
    });

    describe(`{delete} ${entity.name} Delete`, () => {
        it("Return no content with code 204", (done) => {
            dbTest(entity.table)
                .select("*")
                .orderBy("id")
                .then((things) => {
                    const thingObject = things[things.length - 1];
                    const lengthBeforeDelete = things.length;
                    myId = thingObject.id;

                    const infos = {
                        api: `{delete} ${entity.name} Delete one`,
                        apiName: `Delete${entity.name}`,
                        apiDescription: "Delete a Thing.",
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
                            dbTest(entity.table)
                                .select("*")
                                .orderBy("id")
                                .then((updatedThings) => {
                                    updatedThings.length.should.eql(lengthBeforeDelete - 1);
                                    dbTest("historical_location")
                                        .select("*")
                                        .orderBy("id")
                                        .where({ thing_id: thingObject.id })
                                        .then((hists) => {
                                            hists.length.should.eql(0);
                                            addToApiDoc({ ...infos, result: res });
                                            done();
                                        });
                                });
                        });
                });
        });

        it("Return Error if the Thing does not exist", (done) => {
            chai.request(server)
                .delete(`/test/v1.0/${entity.name}(${BigInt(Number.MAX_SAFE_INTEGER)})`)
                .set("Cookie", `${keyTokenName}=${token}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(404);
                    res.type.should.equal("application/json");
                    docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4).replace(Number.MAX_SAFE_INTEGER.toString(), myId);
                    generateApiDoc(docs, `apiDoc${entity.name}.js`);
                    writeAddToFile();
                    done();
                });
        });
    });
});
