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
import { IApiDoc, generateApiDoc, IApiInput, prepareToApiDoc } from "./constant";
import { server } from "../../server/index";

chai.use(chaiHttp);

const should = chai.should();

const docs: IApiDoc[] = [];

const addToApiDoc = (input: IApiInput) => {
    docs.push(prepareToApiDoc(input, "TimeSeries"));
};

addToApiDoc({
    api: `{infos} /TimeSeries Infos`,
    apiName: "InfosTimeSeries",
    apiDescription: `TimeSeries with resultFormat=CSv you have result tab like that
    .<br><img src="./assets/timeseries.jpg" alt="timeseries result">`,
    result: ""
});

describe("TimeSeries", () => {
    // http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#25

    describe("{get} TimeSeries Year", () => {
        it("Get Year Time Series Observations with result greater than 11 AND smaller than 14.", (done) => {
            const infos = {
                api: "{get} TimeSeries by Year",
                apiName: "TimeSeriesYear",
                apiDescription: "Use $series=year for shown result average by year",
                apiExample: { http: "/v1.0/Datastreams(1)/Observations?$filter=result gt 11 and result lt 14&$timeSeries=year" }
            };
            chai.request(server)
                .get(`/test${infos.apiExample.http}`)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.value.length.should.eql(2);
                    res.body.value[0].year.should.eql("2000");
                    res.body.value[0].result.should.eql(13.3);
                    res.body.value[1].year.should.eql("2016");
                    res.body.value[1].result.should.eql(11.6666666666667);
                    res.body.value = [res.body.value[0], res.body.value[1], "..."];
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });
    });

    describe("{get} TimeSeries Full Year", () => {
        it("Get Full Year Time Series Observations with result greater than 11 AND smaller than 14.", (done) => {
            chai.request(server)
                .get("/test/v1.0/Datastreams(1)/Observations?$filter=result gt 11 and result lt 14&$timeSeries=fullyear")
                .end((err, res) => {                
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.value.length.should.eql(18);
                    res.body.value[0].year.should.eql("2000");
                    res.body.value[0].result.should.eql(13.3);
                    res.body.value[16].year.should.eql("2016");
                    res.body.value[16].result.should.eql(11.6666666666667);
                    done();
                });
        });

        it("Save and write apiDoc", (done) => {
            generateApiDoc(docs, "apiDocTimeSeries.js");
            done();
        });
    });

    describe("{get} TimeSeries Month", () => {
        it("Get Month Time Series Observations with result greater than 11 AND smaller than 14.", (done) => {
            const infos = {
                api: "{get} TimeSeries by Month",
                apiName: "TimeSeriesMonth",
                apiDescription: "Use $series=month for shown result average by month",
                apiExample: { http: "/v1.0/Datastreams(1)/Observations?$filter=result gt 11 and result lt 14&$timeSeries=month" }
            };
            chai.request(server)
                .get(`/test${infos.apiExample.http}`)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.value.length.should.eql(2);
                    res.body.value[0].year.should.eql(2000);
                    res.body.value[0].may.should.eql(13.3);
                    res.body.value[1].year.should.eql(2016);
                    res.body.value[1].november.should.eql(11.6666666666667);
                    res.body.value = [res.body.value[0], res.body.value[1], "..."];
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });

        it("Save and write apiDoc", (done) => {
            generateApiDoc(docs, "apiDocTimeSeries.js");
            done();
        });
    });

    describe("{get} FullTimeSeries Full Month", () => {
        it("Get Full Month Time Series Observations with result greater than 11 AND smaller than 14.", (done) => {
            chai.request(server)
                .get("/test/v1.0/Datastreams(1)/Observations?$filter=result gt 11 and result lt 14&$timeSeries=fullmonth")
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.value.length.should.eql(17);
                    res.body.value[0].year.should.eql(2000);
                    res.body.value[0].may.should.eql(13.3);
                    res.body.value[16].year.should.eql(2016);
                    res.body.value[16].november.should.eql(11.6666666666667);
                    done();
                });
        });
    });

    describe("{get} TimeSeries Week", () => {
        it("Get Week Time Series Observations with result greater than 11 AND smaller than 14.", (done) => {
            const infos = {
                api: "{get} TimeSeries by Week",
                apiName: "TimeSeriesWeek",
                apiDescription: "Use $series=week for shown result average by week",
                apiExample: { http: "/v1.0/Datastreams(1)/Observations?$filter=result gt 11 and result lt 14&$timeSeries=week" }
            };
            chai.request(server)
                .get(`/test${infos.apiExample.http}`)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.value.length.should.eql(2);
                    res.body.value[0].year.should.eql(2000);
                    res.body.value[0]["18"].should.eql(13.3);
                    res.body.value[1].year.should.eql(2016);
                    res.body.value[1]["46"].should.eql(11.6666666666667);
                    res.body.value = [res.body.value[0], res.body.value[1], "..."];
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });
    });

    describe("{get} TimeSeries Full Week", () => {
        it("Get Week Time Series Observations with result greater than 11 AND smaller than 14.", (done) => {
            chai.request(server)
                .get("/test/v1.0/Datastreams(1)/Observations?$filter=result gt 11 and result lt 14&$timeSeries=fullweek")
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.value.length.should.eql(17);
                    res.body.value[0].year.should.eql(2000);
                    res.body.value[0]["18"].should.eql(13.3);
                    res.body.value[16].year.should.eql(2016);
                    res.body.value[16]["46"].should.eql(11.6666666666667);
                    done();
                });
        });
    });
    
    describe("{get} TimeSeries Day", () => {
        it("Get Day Time Series Observations with result greater than 11 AND smaller than 14.", (done) => {
            const infos = {
                api: "{get} TimeSeries by Day",
                apiName: "TimeSeriesDay",
                apiDescription: "Use $series=day for shown result average by day",
                apiExample: { http: "/v1.0/Datastreams(1)/Observations?$filter=result gt 11 and result lt 14&$timeSeries=day" }
            };
            chai.request(server)
                .get(`/test${infos.apiExample.http}`)
                .end((err, res) => {                   
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.value.length.should.eql(2);
                    res.body.value[0].year.should.eql(2000);
                    res.body.value[0]["122"].should.eql(13.1);
                    res.body.value[1].year.should.eql(2016);
                    res.body.value[1]["323"].should.eql(11.6666666666667);
                    res.body.value = [res.body.value[0], res.body.value[1], "..."];
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });
    });

    describe("{get} TimeSeries Full Day", () => {
        it("Get Full Day Time Series Observations with result greater than 11 AND smaller than 14.", (done) => {
            chai.request(server)
                .get("/test/v1.0/Datastreams(1)/Observations?$filter=result gt 11 and result lt 14&$timeSeries=fullday")
                .end((err, res) => {                 
                    should.not.exist(err);
                    res.status.should.equal(200);
                    res.type.should.equal("application/json");
                    res.body.value.length.should.eql(17);
                    res.body.value[0].year.should.eql(2000);
                    res.body.value[0]["122"].should.eql(13.1);
                    res.body.value[16].year.should.eql(2016);
                    // res.body.value[16]["323"].should.eql(11.6666666666667);
                    done();
                });
        });

        it("Save and write apiDoc", (done) => {
            generateApiDoc(docs, "apiDocTimeSeries.js");
            done();
        });
    });
});
