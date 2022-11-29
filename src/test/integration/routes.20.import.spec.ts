/**
 * TDD for ultime tests API.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */
process.env.NODE_ENV = "test";

import chai from "chai";
import chaiHttp from "chai-http";
import { IApiDoc, IApiInput, prepareToApiDoc, generateApiDoc, identification, keyTokenName } from "./constant";

import { server } from "../../server/index";
import { dbTest } from "../dbTest";
import { _DBDATAS } from "../../server/db/constants";
import { getBigIntFromString } from "../../server/helpers";

chai.use(chaiHttp);

const should = chai.should();

const docs: IApiDoc[] = [];



const addToApiDoc = (input: IApiInput) => {
    docs.push(prepareToApiDoc(input, "Import"));
};

const simple = {
    "header": false,
    "nan": true,
    "columns": {
        "1": {
            "datastream": "1",
            "featureOfInterest": "1"
        }
    }
};

const multi = {
    "header": true,
    "nan": true,
    "columns": {
        "1": {
            "datastream": "1",
            "featureOfInterest": "1"
        },
        "2": {
            "datastream": "4",
            "featureOfInterest": "1"
        }
    }
};

addToApiDoc({
    api: `{infos} /Import Infos.`,
    apiName: "InfosImport",
    apiDescription: `<hr>
    <div class="text">
      <p>
      You can import a csv file in observations. with one or multiple columns
      </p>
    </div>`,
    result: ""
});

describe("CSV Import", function () {
    this.timeout(5000);
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
    it("should return 12 observations added from csv file", (done) => {
        const infos = {
            api: `{post} CreateObservations with simple csv attached file`,
            apiName: "PostImportSimple",
            apiDescription: "Import simple csv file",
            apiExample: { http: "/v1.0/CreateObservations" },
            apiParamExample: simple
        };
        chai.request(server)
            .post(`/test${infos.apiExample.http}`)
            .field("Content-Type", "multipart/form-data")
            .field("datas", JSON.stringify(infos.apiParamExample))
            .field("method", "POST")
            .field("nb", "1")
            .attach("file", "./src/test/integration/files/simple.csv")
            .set("Cookie", `${keyTokenName}=${token}`)
            .end(function (err, res) {
                if (err) console.log(err);
                else {
                    res.should.have.status(201);
                    res.body.length.should.eql(12);
                }
                should.not.exist(err);
                addToApiDoc({ ...infos, result: res });
                done();
            });
    });

    it("should insert 0 observations for duplicates values", (done) => {
        const infos = {
            api: `{post} CreateObservations with simple csv attached file`,
            apiName: "PostImportSimpleDuplicates",
            apiDescription: "Import simple csv file",
            apiExample: { http: "/v1.0/CreateObservations" },
            apiParamExample: simple
        };
        chai.request(server)
            .post(`/test${infos.apiExample.http}`)
            .field("Content-Type", "multipart/form-data")
            .field("datas", JSON.stringify(infos.apiParamExample))
            .field("method", "POST")
            .field("nb", "1")
            .attach("file", "./src/test/integration/files/simple.csv")
            .set("Cookie", `${keyTokenName}=${token}`)
            .end((err: any, res: any) => {
                if (err) console.log(err);
                else {
                    res.should.have.status(201);
                    res.body.length.should.eql(0);
                }
                should.not.exist(err);
                docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4);
                done();
            });
    });

    it("should return 10 observations added from csv file", (done) => {
        const infos = {
            api: `{post} CreateObservations with multi csv attached file`,
            apiName: "PostImportMulti",
            apiDescription: "Import multi csv file",
            apiExample: { http: "/v1.0/CreateObservations" },
            apiParamExample: multi
        };

        chai.request(server)
            .post(`/test${infos.apiExample.http}`)
            .field("Content-Type", "multipart/form-data")
            .field("datas", JSON.stringify(infos.apiParamExample))
            .field("method", "POST")
            .field("nb", "1")
            .attach("file", "./src/test/integration/files/multi.csv")
            .set("Cookie", `${keyTokenName}=${token}`)
            .end((err: any, res: any) => {
                if (err) console.log(err);
                else {
                    should.not.exist(err);
                    res.should.have.status(201);
                    res.body.length.should.eql(10);
                    const ids: BigInt[] = [];
                    res.body.forEach((element: string) => {
                        const temp = getBigIntFromString(element);
                        if (temp) ids.push(temp);
                    });
                    dbTest(_DBDATAS.Observations.table)
                        .whereIn("id", ids)
                        .orderBy("id")
                        .then((test) => {
                            test[0].resultnumber.should.eql(13.1);
                            test[0].datastream_id.should.eql("1");
                            test[0].featureofinterest_id.should.eql("1");
                            test[5].resultnumber.should.eql(20.1);
                            test[5].datastream_id.should.eql("4");
                            test[5].featureofinterest_id.should.eql("1");
                            addToApiDoc({ ...infos, result: res });
                            done();
                        })
                        .catch((err) => console.log(err));
                }
            });
    });

    it("should insert 0 observations for duplicates values", (done) => {
        const infos = {
            api: `{post} CreateObservations with multi csv attached file`,
            apiName: "PostImportMultiDuplicates",
            apiDescription: "Import multi csv file",
            apiExample: { http: "/v1.0/CreateObservations" },
            apiParamExample: multi
        };
        chai.request(server)
            .post(`/test${infos.apiExample.http}`)
            .field("Content-Type", "multipart/form-data")
            .field("datas", JSON.stringify(infos.apiParamExample))
            .field("method", "POST")
            .field("nb", "1")
            .attach("file", "./src/test/integration/files/multi.csv")
            .set("Cookie", `${keyTokenName}=${token}`)
            .end(function (err, res) {
                if (err) console.log(err);
                else {
                    res.should.have.status(201);
                    res.body.length.should.eql(0);
                }
                should.not.exist(err);
                docs[docs.length - 1].apiErrorExample = JSON.stringify(res.body, null, 4);
                generateApiDoc(docs, "Import.js");
                
                done();
            });
    });
});
