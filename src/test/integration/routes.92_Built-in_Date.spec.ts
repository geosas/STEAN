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
    docs.push(prepareToApiDoc(input, "BuiltInDate"));
};

addToApiDoc({
    api: `{infos} /BuiltInDate Infos`,
    apiName: "InfosBuiltInDate",
    apiDescription: `The OGC SensorThings API supports a set of functions that can be used with the $filter or $orderby query operations. The following table lists the available functions and they follows the OData Canonical function definitions listed in Section 5.1.1.4 of the [OData Version 4.0 Part 2: URL Conventions] and the syntax rules for these functions are defined in [OData Version 4.0 ABNF].`,
          apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
    result: ""
});
   
describe("Odata BuiltInDate", () => {

    it("year(resultTime) eq 2000", (done) => {
        const infos = {
            api: "{get} Observations Year",
            apiName: "BuiltInDateYear",
            apiDescription: "The year function returns the year component of the Date or DateTimeOffset parameter value, evaluated in the time zone of the DateTimeOffset parameter value.",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Observations?$filter=year(resultTime) eq 2000",
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
                res.body.value.length.should.eql(10);
                res.body["value"][0]["@iot.id"].should.eql(44);
                res.body.value = [res.body.value[0], res.body.value[1], "..."];
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    it("month(resultTime) eq 12", (done) => {
        const infos = {
            api: "{get} Observations Month",
            apiName: "BuiltInDateMonth",
            apiDescription: "The month function returns the month component of the Date or DateTimeOffset parameter value, evaluated in the time zone of the DateTimeOffset parameter value.",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Observations?$filter=month(resultTime) eq 12",
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
                res.body["value"][0]["@iot.id"].should.eql(43);
                res.body.value = [res.body.value[0], res.body.value[1], "..."];
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    it("day(resultTime) eq 11", (done) => {
        const infos = {
            api: "{get} Observations Day",
            apiName: "BuiltInDateDay",
            apiDescription: "The day function returns the day component Date or DateTimeOffset parameter value, evaluated in the time zone of the DateTimeOffset parameter value.",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Observations?$filter=day(resultTime) eq 11",
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
                res.body["value"][0]["@iot.id"].should.eql(42);
                res.body.value = [res.body.value[0], res.body.value[1], "..."];
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    it("hour(resultTime) eq 12", (done) => {
        const infos = {
            api: "{get} Observations Hour",
            apiName: "BuiltInDateHour",
            apiDescription: "The hour function returns the hour component of the DateTimeOffset or TimeOfDay parameter value, evaluated in the time zone of the DateTimeOffset parameter value.",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Observations?$filter=hour(resultTime) eq 12",
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
                res.body.value.length.should.eql(3);
                res.body["value"][0]["@iot.id"].should.eql(1);
                res.body.value = [res.body.value[0], res.body.value[1], "..."];
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    it("minute(resultTime) eq 50", (done) => {
        const infos = {
            api: "{get} Observations minute",
            apiName: "BuiltInDateMinute",
            apiDescription: "The minute function returns the minute component of the DateTimeOffset or TimeOfDay parameter value, evaluated in the time zone of the DateTimeOffset parameter value.",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Observations?$filter=minute(resultTime) eq 50",
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
                res.body["value"][0]["@iot.id"].should.eql(44);
                res.body.value = [res.body.value[0], res.body.value[1], "..."];
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    it("second(resultTime) ge 40", (done) => {
        const infos = {
            api: "{get} Observations second",
            apiName: "BuiltInDateSecond",
            apiDescription: "The second function returns the second component (without the fractional part) of the DateTimeOffset or TimeOfDay parameter value.",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Observations?$filter=second(resultTime) ge 40",
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
                res.body["value"][0]["@iot.id"].should.eql(30);
                res.body.value = [res.body.value[0], res.body.value[1], "..."];
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    it("date(resultTime) eq date(validTime)", (done) => {
        const infos = {
            api: "{get} Observations date",
            apiName: "BuiltInDateDate",
            apiDescription: "The date function returns the date part of the DateTimeOffset parameter value, evaluated in the time zone of the DateTimeOffset parameter value.",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Observations?$filter=date(resultTime) eq date(validTime)",
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
                res.body.value.length.should.eql(9);
                res.body["value"][0]["@iot.id"].should.eql(2);
                res.body.value = [res.body.value[0], res.body.value[1], "..."];
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    it("time(resultTime) ne time(phenomenonTime)", (done) => {
        const infos = {
            api: "{get} Observations time",
            apiName: "BuiltInDateTime",
            apiDescription: "The time function returns the time part of the DateTimeOffset parameter value, evaluated in the time zone of the DateTimeOffset parameter value.",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Observations?$filter=time(resultTime) ne time(phenomenonTime)",
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
                res.body.value.length.should.eql(14);
                res.body["value"][0]["@iot.id"].should.eql(11);
                res.body.value = [res.body.value[0], res.body.value[1], "..."];
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    it("resultTime le now()", (done) => {
        const infos = {
            api: "{get} Observations Now()",
            apiName: "BuiltInDateNow",
            apiDescription: "The now function returns the current point in time (date and time with time zone) as a DateTimeOffset value.",
            apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
            apiExample: {   http: "/v1.0/Observations?$filter=resultTime le now()",
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
                res.body.value.length.should.eql(52);
                res.body["value"][0]["@iot.id"].should.eql(1);
                res.body.value = [res.body.value[0], res.body.value[1], "..."];
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    // it("fractionalseconds(resultTime) ne 0", (done) => {
    //     const infos = {
    //         api: "{get} Observations fractionalseconds",
    //         apiName: "BuiltInDateFractionalseconds",
    //         apiDescription: "The fractionalseconds function returns the fractional seconds component of the DateTimeOffset or TimeOfDay parameter value as a non-negative decimal value less than 1.",
    //         apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
    //         apiExample: {   http: "/v1.0/Observations?$filter=fractionalseconds(resultTime) ne 0",
    //                         curl: defaultGet("curl", "KEYHTTP"),
    //                         javascript: defaultGet("javascript", "KEYHTTP"),
    //                         python: defaultGet("python", "KEYHTTP") 
    //                     }
    //     };
    //     chai.request(server)
    //         .get(`/test${infos.apiExample.http}`)
    //         .end((err: any, res: any) => {
    //             should.not.exist(err);
    //             res.status.should.equal(200);
    //             res.type.should.equal("application/json");
    //             res.body.value.length.should.eql(52);
    //             res.body["value"][0]["@iot.id"].should.eql(1);
    //             res.body.value = [res.body.value[0], res.body.value[1], "..."];
    //             addToApiDoc({ ...infos, result: res });
    //             done();
    //         });
    // });

    // it("mindatetime(resultTime) ne 0", (done) => {
    //     const infos = {
    //         api: "{get} Observations mindatetime",
    //         apiName: "BuiltInDateMindatetime",
    //         apiDescription: "The mindatetime function returns the earliest possible point in time as a DateTimeOffset value.",
    //         apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
    //         apiExample: {   http: "/v1.0/Observations?$filter=resultTime gt mindatetime()",
    //                         curl: defaultGet("curl", "KEYHTTP"),
    //                         javascript: defaultGet("javascript", "KEYHTTP"),
    //                         python: defaultGet("python", "KEYHTTP") 
    //                     }
    //     };
    //     chai.request(server)
    //         .get(`/test${infos.apiExample.http}`)
    //         .end((err: any, res: any) => {
    //             should.not.exist(err);
    //             res.status.should.equal(200);
    //             res.type.should.equal("application/json");
    //             res.body.value.length.should.eql(52);
    //             res.body["value"][0]["@iot.id"].should.eql(1);
    //             res.body.value = [res.body.value[0], res.body.value[1], "..."];
    //             addToApiDoc({ ...infos, result: res });
    //             done();
    //         });
    // });

    // it("totaloffsetminutes(resultTime) eq 330", (done) => {
    //     const infos = {
    //         api: "{get} Observations Now",
    //         apiName: "BuiltInDateTotaloffsetminutes",
    //         apiDescription: "The totaloffsetminutes function returns the signed number of minutes in the time zone offset part of the DateTimeOffset parameter value, evaluated in the time zone of the DateTimeOffset parameter value.",
    //         apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#56",
    //         apiExample: {   http: "/v1.0/Observations?$filter=totaloffsetminutes(resultTime) eq 330",
    //                         curl: defaultGet("curl", "KEYHTTP"),
    //                         javascript: defaultGet("javascript", "KEYHTTP"),
    //                         python: defaultGet("python", "KEYHTTP") 
    //                     }
    //     };
    //     chai.request(server)
    //         .get(`/test${infos.apiExample.http}`)
    //         .end((err: any, res: any) => {
    //             should.not.exist(err);
    //             res.status.should.equal(200);
    //             res.type.should.equal("application/json");
    //             res.body.value.length.should.eql(52);
    //             res.body["value"][0]["@iot.id"].should.eql(1);
    //             res.body.value = [res.body.value[0], res.body.value[1], "..."];
    //             addToApiDoc({ ...infos, result: res });
    //             done();
    //         });
    // });    

    it("Save and write apiDoc", (done) => {
        generateApiDoc(docs, "apiDocBuiltInDate.js");
        done();
    });
});
