/* eslint-disable @typescript-eslint/no-explicit-any */
process.env.NODE_ENV = "test";

import chai from "chai";
import chaiHttp from "chai-http";

chai.use(chaiHttp);

import { server } from "../../server/index";

const should = chai.should();

describe("Create Database.", function () {
    this.timeout(5000);
    it("Create Database", (done) => {
        chai.request(server)
            .get("/test/v1.0/createDB")
            .end((err: Error, res: any) => {                     
                if (err) console.error(err);
                should.not.exist(err);
                res.status.should.equal(201);
                done();
            });
    });
});
