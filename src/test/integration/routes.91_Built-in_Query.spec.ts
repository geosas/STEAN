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
import { IApiDoc, generateApiDoc, IApiInput, prepareToApiDoc, defaultGet } from "./constant";
import { server } from "../../server/index";


chai.use(chaiHttp);

const should = chai.should();

const docs: IApiDoc[] = [];

const addToApiDoc = (input: IApiInput) => {
    docs.push(prepareToApiDoc(input, "BuiltInQuery"));
};

addToApiDoc({
    api: `{infos} /BuiltInQuery Infos`,
    apiName: "InfosBuiltInQuery",
    apiDescription: `The OGC SensorThings API supports a set of functions that can be used with the $filter or $orderby query operations. The following table lists the available functions and they follows the OData Canonical function definitions listed in Section 5.1.1.4 of the [OData Version 4.0 Part 2: URL Conventions] and the syntax rules for these functions are defined in [OData Version 4.0 ABNF].`,
          apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
    result: ""
});
   
describe("Odata BuiltInQuery", () => {

    it("substringof('name', '1') eq true", (done) => {
        const infos = {
            api: "{get} Things(:id) substringof",
            apiName: "BuiltInQuerySubstringof",
            apiDescription: "This string function filters all the records that contain with string in property.",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Things?$filter=substringof('name', '1') eq true",
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
                res.body.value.length.should.eql(4);
                res.body["value"][0]["@iot.id"].should.eql(1);
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    it("substringof('name', '1')", (done) => {
        chai.request(server)
            .get(`/test/v1.0/Things?$filter=substringof('name', '1')`)
            .end((err: any, res: any) => {
                should.not.exist(err);
                res.status.should.equal(200);
                res.type.should.equal("application/json");
                res.body.value.length.should.eql(4);
                res.body["value"][0]["@iot.id"].should.eql(1);
                done();
            });
    });

    it("substringof(name, '1')", (done) => {
        chai.request(server)
            .get(`/test/v1.0/Things?$filter=substringof(name, '1') `)
            .end((err: any, res: any) => {
                should.not.exist(err);
                res.status.should.equal(200);
                res.type.should.equal("application/json");
                res.body.value.length.should.eql(4);
                res.body["value"][0]["@iot.id"].should.eql(1);
                done();
            });
    });
 
    it("startswith('name', 'Temperature') eq true", (done) => {
        const infos = {
            api: "{get} Things(:id) startswith",
            apiName: "BuiltInQueryStartswith",
            apiDescription: "This string function filters all the records that starts with the string in the property.",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Things?$filter=startswith('name', 'Temperature') eq true",
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
                res.body.value.length.should.eql(2);
                res.body["value"][0]["@iot.id"].should.eql(22);
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    it("startswith('name', 'Temperature')", (done) => {
        chai.request(server)
            .get(`/test/v1.0/Things?$filter=startswith('name', 'Temperature')`)
            .end((err: any, res: any) => {
                should.not.exist(err);
                res.status.should.equal(200);
                res.type.should.equal("application/json");
                res.body.value.length.should.eql(2);
                res.body["value"][0]["@iot.id"].should.eql(22);
                done();
            });
    });

    it("startswith(name, 'Temperature')", (done) => {
        chai.request(server)
            .get(`/test/v1.0/Things?$filter=startswith(name, 'Temperature')`)
            .end((err: any, res: any) => {
                should.not.exist(err);
                res.status.should.equal(200);
                res.type.should.equal("application/json");
                res.body.value.length.should.eql(2);
                res.body["value"][0]["@iot.id"].should.eql(22);
                done();
            });
    });

    it("endwith('description', 'one') eq true", (done) => {
        const infos = {
            api: "{get} Things(:id) endwith",
            apiName: "BuiltInQueryEndwith",
            apiDescription: "This string function filters all the records that column name ends with the string in the property.",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Things?$filter=endswith('description', 'one')  eq true",
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
                res.body.value.length.should.eql(2);
                res.body["value"][0]["@iot.id"].should.eql(1);
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    it("endwith('description', 'one')", (done) => {
        chai.request(server)
            .get(`/test/v1.0/Things?$filter=endswith('description', 'one')`)
            .end((err: any, res: any) => {
                should.not.exist(err);
                res.status.should.equal(200);
                res.type.should.equal("application/json");
                res.body.value.length.should.eql(2);
                res.body["value"][0]["@iot.id"].should.eql(1);
                done();
            });
    });

    it("endwith(description, 'one')", (done) => {
        chai.request(server)
            .get(`/test/v1.0/Things?$filter=endswith(description, 'one')`)
            .end((err: any, res: any) => {
                should.not.exist(err);
                res.status.should.equal(200);
                res.type.should.equal("application/json");
                res.body.value.length.should.eql(2);
                res.body["value"][0]["@iot.id"].should.eql(1);
                done();
            });
    });

    it("length(name) le 15", (done) => {
        const infos = {
            api: "{get} Things(:id) Length",
            apiName: "BuiltInQueryLength",
            apiDescription: "This string function return the length of the parameters to be test in filter.",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Things?$filter=length(name) le 15",
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
                res.body.value.length.should.eql(2);
                res.body["value"][0]["@iot.id"].should.eql(21);
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    it("indexof('name', 'Temperature') eq 1", (done) => {
        const infos = {
            api: "{get} indexof",
            apiName: "BuiltInQueryIndexOf",
            apiDescription: "This string function return the index of the parameters in the column.",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Things?$filter=indexof('name', 'Temperature') eq 1",
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
                res.body.value.length.should.eql(2);
                res.body["value"][0]["@iot.id"].should.eql(22);
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    it("substring('name', 1) eq 'ensorWebThing'", (done) => {
        const infos = {
            api: "{get} Things substring",
            apiName: "BuiltInQuerySubstringOne",
            apiDescription: "This string function filters all the records that contain with part of the string extract all characters from a particular position of a column name .",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Things?$filter=substring('name', 1) eq 'ensorWebThing'",
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
                res.body.value.length.should.eql(2);
                res.body["value"][0]["@iot.id"].should.eql(21);
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });
    
    it("substring('name', 12, 10) eq 'Monitoring'", (done) => {
        const infos = {
            api: "{get} Things substringTwo",
            apiName: "BuiltInQuerySubstringTwo",
            apiDescription: "This string function filters all the records that contain with part of the string extract by specific number of characters from a particular position of a column name .",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Things?$filter=substring('name', 12, 10) eq 'Monitoring'",
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
                res.body.value.length.should.eql(2);
                res.body["value"][0]["@iot.id"].should.eql(22);
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    it("tolower('name') eq 'sensorwebthing 2'", (done) => {
        const infos = {
            api: "{get} Things toLower",
            apiName: "BuiltInQueryTolower",
            apiDescription: "This string function return string whose characters are going to be converted to lowercase.",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Things?$filter=tolower('name') eq 'sensorwebthing 2'",
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
                res.body.value.length.should.eql(1);
                res.body["value"][0]["@iot.id"].should.eql(2);
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });
    
    it("toupper('name') eq 'SENSORWEBTHING 2'", (done) => {
        const infos = {
            api: "{get} Things toUpper",
            apiName: "BuiltInQueryToUpper",
            apiDescription: "This string function return string whose characters are going to be converted to uppercase.",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Things?$filter=toupper('name') eq 'SENSORWEBTHING 2'",
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
                res.body.value.length.should.eql(1);
                res.body["value"][0]["@iot.id"].should.eql(2);
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    it("trim('name') eq 'MultiDatastreams SensorWebThing 10'", (done) => {
        const infos = {
            api: "{get} Things trim",
            apiName: "BuiltInQueryTrim",
            apiDescription: "This string function return string with removed spaces from both side from a string.",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Things?$filter=trim('name') eq 'MultiDatastreams SensorWebThing 10'",
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
                res.body.value.length.should.eql(1);
                res.body["value"][0]["@iot.id"].should.eql(20);
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    it("trim('name', 'SensorWebThing ') eq '2'", (done) => {
        const infos = {
            api: "{get} Things trimParams",
            apiName: "BuiltInQueryTrimWithParams",
            apiDescription: "This string function return string with removed spaces from both side from a string.",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Things?$filter=trim('name', 'SensorWebThing ') eq '2'",
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
                res.body.value.length.should.eql(1);
                res.body["value"][0]["@iot.id"].should.eql(2);
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    it("concat('name', 'test') eq 'MultiDatastreams SensorWebThing 10test'", (done) => {
        const infos = {
            api: "{get} Things concat",
            apiName: "BuiltInQueryConcat",
            apiDescription: " 	The concat function returns a string that appends the second input parameter string value to the first.",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Things?$filter=concat('name', 'test') eq 'MultiDatastreams SensorWebThing 10test'",
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
                res.body.value.length.should.eql(1);
                res.body["value"][0]["@iot.id"].should.eql(20);
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    it("Save and write apiDoc", (done) => {
        generateApiDoc(docs, "apiDocBuiltInQuery.js");
        done();
    });
});
