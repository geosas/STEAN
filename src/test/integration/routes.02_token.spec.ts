process.env.NODE_ENV = "test";

import chai from "chai";
import chaiHttp from "chai-http";
import fs from "fs";
import path from "path";
import { IApiDoc, prepareToApiDoc, IApiInput, identification, generateApiDoc } from "./constant";

chai.use(chaiHttp);

const should = chai.should();

import { server } from "../../server/index";

const docs: IApiDoc[] = [];

const addToApiDoc = (input: IApiInput) => {
    docs.push(prepareToApiDoc(input, "Token"));
};

fs.mkdirSync(path.resolve(__dirname, "../apiDocs/"), {
    recursive: true
});

addToApiDoc({
    api: `{infos} /Identification Infos`,
    apiName: `InfosToken`,
    apiDescription: `<hr>
    <div class="text">
      <p>You have to be registered to be able to POST PUT OR DELETE datas.</p>
    </div>`,
    result: ""
});

describe("Identification : Token", () => {
    describe("GET a token", () => {
        it("should return JWT Identification", (done) => {
            const infos = {
                api: `{post} login get a new token`,
                apiName: `TokenLogin`,
                apiDescription: "Get a new token.",
                apiExample: {
                    http: `/v1.0/login`,
                    curl: `curl -X POST KEYHTTP/login -H 'cache-control: no-cache' -H 'content-type: application/x-www-form-urlencoded' -d 'username=sensorapi&password=mario29'`
                },
                apiParamExample: { "username": "myUserName", "password": "*************" }
            };
            chai.request(server)
                .post(`/test${infos.apiExample.http}`)
                .type("form")
                .send(identification)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.body.should.include.keys("token");
                    res.body.should.include.keys("message");
                    res.body.message.should.eql("login succeeded");
                    res.status.should.equal(200);
                    addToApiDoc({ ...infos, result: res });
                    done();
                });
        });
        it("Return Error if the identification wrong", (done) => {
            const infos = {
                api: `{post} login Post basic`,
                apiName: `TokenError`,
                apiDescription: "Identification failed.",
                apiExample: {
                    http: `/v1.0/login`,
                    curl: `curl -X POST KEYHTTP/login -H 'cache-control: no-cache' -H 'content-type: application/x-www-form-urlencoded' -d 'username=sensorapi&password=mario29'`
                },
                apiParamExample: { "username": identification.username, "password": "nowhere" }
            };
            chai.request(server)
                .post(`/test${infos.apiExample.http}`)
                .type("form")
                .send(infos.apiParamExample)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.status.should.equal(401);
                    res.body.should.include.keys("message");
                    res.body.message.should.eql("Unauthorized");
                    const myError = JSON.stringify(res.body, null, 4);
                    docs[docs.length - 1].apiErrorExample = myError;
                    done();
                });
        });
        it("should logout", (done) => {
            const infos = {
                api: `{get} logout logout actual connection.`,
                apiName: `TokenLogout`,
                apiDescription: "Logout actual connection.",
                apiExample: {
                    http: `/v1.0/logout`,
                    curl: `curl -X GET KEYHTTP/logout`
                }
            };
            chai.request(server)
                .get(`/test${infos.apiExample.http}`)
                .end((err: any, res: any) => {
                    should.not.exist(err);
                    res.body.should.include.keys("message");
                    res.body.message.should.eql("Logout succeeded");
                    res.status.should.equal(200);
                    addToApiDoc({ ...infos, result: res });
                    generateApiDoc(docs, `apiDocToken.js`);
                    done();
                });
        });
    });
});
