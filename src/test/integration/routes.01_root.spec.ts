process.env.NODE_ENV = "test";

import chai from "chai";
import chaiHttp from "chai-http";
import fs from "fs";
import path from "path";
import { IApiDoc, prepareToApiDoc, generateApiDoc, IApiInput } from "./constant";

chai.use(chaiHttp);

const should = chai.should();

import { server } from "../../server/index";

const docs: IApiDoc[] = [];

const addToApiDoc = (input: IApiInput) => {
    docs.push(prepareToApiDoc(input, "SensorThings"));
};

fs.mkdirSync(path.resolve(__dirname, "../apiDocs/"), {
    recursive: true
});

addToApiDoc({
    api: `{infos} /SensorThings Infos`,
    apiName: `InfosSensorThings`,
    apiDescription: `<hr>
    <div class="text">
      <p>Welcome to API documentation for the Open Geospatial Consortium (OGC) SensorThings international standard. This
        API provides an open and unified way to interconnect Internet of Things (IoT) devices over the Web as well as
        interfaces to interact with and analyze their observations. Part 1:Sensing was released in 2016 and allowed
        management and reception of observations or measurements made by IoT sensors. Part 2: Tasking Core, which was
        released in 2019, provides a mechanism to tell the sensor/actuator what to do.</p>
        <br>
      <p>The foundation of the SensorThings API are the relational connections between entities in the system and the way
        they are used to model systems in the real world. The entities have a natural relationship which enables any IoT
        sensing device from any vertical industry to be modelled in the system. An IoT device or system is modelled as a
        Thing. A Thing has a Location with one or more Datastreams. Each Datastream observes one ObservedProperty with one
        Sensor and has many Observations from the Sensor. Each Observation read by the Sensor observes one particular
        FeatureOfInterest. Together, these relationships provide a flexible standard way to describe and model any sensing
        system. It allows SensorThings to be a single data exchange system for heterogeneous devices within any
        organization.</p>
    </div> <br> <img src="./assets/entities.jpg" alt="Model">`,
    apiReference: "https://docs.ogc.org/is/15-078r6/15-078r6.html",
    result: ""
});

describe("endpoint : index", () => {
    describe("GET /v1.0/ [9.2.1]", () => {
        // http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#36

        it("should return json", (done) => {
            const infos = {
                api: "{get}  resource path",
                apiName: "rootSensorThings",
                apiDescription: `Access to all resources begins at the base resource path.`,
                apiReference: "http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#36",
                apiExample: { http: "/v1.0/" },
                apiSuccess: [
                    "{relation} Datastreams Get all datastreams.",
                    "{relation} MultiDatastreams Get all multidatastreams.",
                    "{relation} FeaturesOfInterest Get all features of interest.",
                    "{relation} HistoricalLocation Get all historical locations.",
                    "{relation} Locations Get all locations.",
                    "{relation} Observations Get all observations.",
                    "{relation} ObservedProperties Get all observed property.",
                    "{relation} Sensors Get all sensors.",
                    "{relation} Things Get all things."
                ]
            };

            chai.request(server)
                .get(`/test/${infos.apiExample.http}`)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(200);
                    res.type.should.eql("application/json");
                    res.body.value[0].url.should.contain("/Datastreams");
                    res.body.value[1].url.should.contain("/MultiDatastreams");
                    res.body.value[2].url.should.contain("/FeaturesOfInterest");
                    res.body.value[3].url.should.contain("/HistoricalLocation");
                    res.body.value[4].url.should.contain("/Locations");
                    res.body.value[5].url.should.contain("/Observations");
                    res.body.value[6].url.should.contain("/ObservedProperties");
                    res.body.value[7].url.should.contain("/Sensors");
                    res.body.value[8].url.should.contain("/Things");
                    docs.push(prepareToApiDoc({ ...infos, result: res }, "SensorThings"));
                    generateApiDoc(docs, "apiSensorThings.js");

                    done();
                });
        });
    });
});
