/**
 * MultiDatastreams entity.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { Knex } from "knex";
import koa from "koa";
import { message } from "../../logger";
import { Common } from "./common";
import { IKeyValues } from "../../types";

export class MultiDatastreams extends Common {
    constructor(ctx: koa.Context, knexInstance?: Knex | Knex.Transaction) {
        super(ctx, knexInstance);
    }

    formatDataInput(input: IKeyValues[] | undefined): IKeyValues[] | undefined {
        message(true, "HEAD", `class ${this.constructor.name} override formatDataInput`);
        if (!input)
            this.ctx.throw(400, {
                detail: "No Data"
            });

        if (input["multiObservationDataTypes"] && input["unitOfMeasurements"] && input["ObservedProperties"]) {
            if (input["multiObservationDataTypes"].length != input["unitOfMeasurements"].length)
                this.ctx.throw(400, {
                    detail: `Size of list of unitOfMeasurements (${input["unitOfMeasurements"].length}) is not equal to size of multiObservationDataTypes (${input["multiObservationDataTypes"].length})`
                });

            if (input["multiObservationDataTypes"].length != input["ObservedProperties"].length)
                this.ctx.throw(400, {
                    detail: `Size of list of ObservedProperties (${input["ObservedProperties"].length}) is not equal to size of multiObservationDataTypes (${input["multiObservationDataTypes"].length})`
                });
        }
        if (input && input["multiObservationDataTypes"] && input["multiObservationDataTypes"] != null)
            input["multiObservationDataTypes"] = JSON.stringify(input["multiObservationDataTypes"]).replace("[", "{").replace("]", "}");

        return input;
    }
}
