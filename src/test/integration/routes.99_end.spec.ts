/**
 * TDD for cases API.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

process.env.NODE_ENV = "test";


// import { db } from "../../server/db";
import { _DBDATAS } from "../../server/db/constants";

describe("Delete test Database", function () {
    it("Destroy", async (done) => {
        // await db["admin"].raw("DROP DATABASE test");
        done();
    });
});
