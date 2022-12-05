/**
 * Constants for DataBase.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

/* eslint-disable quotes */

// For odata parser

import { Knex } from "knex";
import koa from "koa";
import { _CONFIGFILE } from "../configuration";
import { _ENV_VERSION } from "../constants";
import { getEntityName, isTest } from "../helpers";
import { PgVisitor } from "../odata";
import {  IEntity } from "../types";
import { RELATIONS } from "../types/entity";

export const isSingular = (input: string): boolean => {
    const entityName = getEntityName(input);
    return entityName ? (_DBDATAS[entityName].singular == input) : false;
}
export const isGraph = (input: PgVisitor) =>  input.resultFormat.name.startsWith("GRAPH");
export const rootBase = (ctx: koa.Context) => (isTest() ? `proxy/${ctx._version}/` : `${ctx._linkBase}/${ctx._version}/`);
// export const limit = (ctx: koa.Context, args: PgVisitor) => args.limit && args.limit > 0 ? args.limit : args.resultFormat.name === "JSON" ? +_CONFIGFILE[ctx._configName].nb_page : 0;
// export const skip = (args: PgVisitor) => (args.skip && args.skip > 0 ? args.skip : 0);


// Get date by Database usefull to have the TimeZone
export const getDateNow = async (conn: Knex | Knex.Transaction): Promise<string> => {
    const temp = await conn.raw("select current_timestamp;");
    return temp["rows"][0]["current_timestamp"];
}

const makeIDAlias = (table: string) => `"${table}"."id" AS "@iot.id"`;
const _DATEFORMAT = 'YYYY-MM-DD"T"HH24:MI:SSZ';


export const _DBADMIN: { [key: string]: IEntity } = {
    Users: {
        name: "Users",
        singular: "User",
        table: "user",
        order: -1, // exclude
        columns: {
            id: {
                create: "BIGINT GENERATED ALWAYS AS IDENTITY",
                comment: "A unique bigSerial."
            },
            username: {
                create: "text NOT NULL UNIQUE",
                comment: "Name of the user."
            },
            email: {
                create: "text NOT NULL",
                comment: "Mail fo the user."
            },
            password: {
                create: "text NOT NULL",
                comment: "Password."
            },
            database: {
                create: "text NOT NULL",
                comment: "Database."
            },
            canPost: {
                create: "bool NULL",
                comment: "canPost or Not."
            },
            canDelete: {
                create: "bool NULL",
                comment: "canDelete or Not."
            },
            canCreateUser: {
                create: "bool NULL",
                comment: "canCreateUser or Not."
            },
            canCreateDb: {
                create: "bool NULL",
                comment: "canCreateDb or Not."
            },
            admin: {
                create: "bool NULL",
                comment: "Admin or Not."
            },
            superAdmin: {
                create: "bool NULL",
                comment: "Super Admin or Not."
            }
        },
        migrationTest: true,
        relations: {}
    },

    Logs_request: {
        name: "Logs_request",
        singular: "Log_request",
        table: "log_request",
        order: -1,
        columns: {
            id: {
                create: "BIGINT GENERATED ALWAYS AS IDENTITY",
                alias: makeIDAlias("log_request"),
                comment: "A unique bigSerial.",
                form: {type : "number"}
            },
            date: {
                create: "timestamptz DEFAULT CURRENT_TIMESTAMP",
                comment: "The time of the operation.",
                form: {type : "datetime-local"}
            },
            user_id: {
                create: "BIGINT",
                comment: "User id.",
                form: {type : "number"}
            },
            method: {
                create: "text",
                comment: "Method of request.",
                form: {type : "text"}
            },
            code: {
                create: "text",
                comment: "code return.",
                form: {type : "text"}
            },
            url: {
                create: "text NOT NULL",
                comment: "Url of the request.",
                form: {type : "text"}
            },
            datas: {
                create: "jsonb NULL",
                comment: "Datas send.",
                form: {type : "textarea"}
            },
            port: {
                create: "INT NULL",
                comment: "port.",
                form: {type : "number"}
            },
            database: {
                create: "text NULL",
                comment: "database.",
                form: {type : "text"}
            },
            query: {
                create: "text NULL",
                comment: "Query generated.",
                form: {type : "textarea"}
            },
            return: {
                create: "text NULL",
                comment: "return result / error receive.",
                form: {type : "textarea"}
            },
            error: {
                create: "text NULL",
                comment: "Error message.",
                form: {type : "text"}
            }
        },
        migrationTest: true,
        relations: {}
    }
};

export const _DBDATAS: { [key: string]: IEntity } = {
    Things: {
        name: "Things",
        singular: "Thing",
        table: "thing",
        order: 10,
        columns: {
            id: {
                create: "BIGINT GENERATED ALWAYS AS IDENTITY",
                comment: "A unique bigSerial.",
                alias: makeIDAlias("thing"),
                form: {type : "number"}
            },
            name: {
                create: "text NOT NULL DEFAULT 'no name'::text",
                comment: "This is a short description of the corresponding Thing entity.",
                form: {type : "text"}
            },
            description: {
                create: "text NOT NULL",
                comment: "A property provides a label for Thing entity, commonly a descriptive name.",
                form: {type : "text"}
            },
            properties: {
                create: "jsonb NULL",
                comment: "A JSON Object containing user-annotated properties as key-value pairs.",
                form: {type : "textarea"}
            }
        },
        constraints: {
            thing_pkey: 'PRIMARY KEY ("id")'
        },
        migrationTest: true,
        relations: {
            Locations: {
                type: RELATIONS.belongsToMany,
                expand: `"location"."id" in (select "thing_location"."location_id" from "thing_location" where "thing_location"."thing_id" = "thing"."id")`,
                link: `"location"."id" in (select "thing_location"."location_id" from "thing_location" where "thing_location"."thing_id" = $ID)`,
                entityName: "Locations",
                tableName: "thing_location",
                relationKey: "location_id",
                entityColumn: "thing_id",
                tableKey: "thing_id"
            },
            HistoricalLocations: {
                type: RELATIONS.hasMany,
                expand: `"historical_location"."id" in (select "historical_location"."id" from "historical_location" where "historical_location"."thing_id" = "thing"."id")`,
                link: `"historical_location"."id" in (select "historical_location"."id" from "historical_location" where "historical_location"."thing_id" = $ID)`,
                entityName: "HistoricalLocation",
                tableName: "historicalLocation",
                relationKey: "thing_id",
                entityColumn: "id",
                tableKey: "id"
            },
            Datastreams: {
                type: RELATIONS.hasMany,
                expand: `"datastream"."id" in (select "datastream"."id" from "datastream" where "datastream"."thing_id" = "thing"."id")`,
                link: `"datastream"."id" in (select "datastream"."id" from "datastream" where "datastream"."thing_id" =  $ID)`,

                entityName: "Datastreams",
                tableName: "datastream",
                relationKey: "thing_id",
                entityColumn: "id",
                tableKey: "id"
            },
            MultiDatastreams: {
                type: RELATIONS.hasMany,
                expand: `"multidatastream"."id" in (select "multidatastream"."id" from "multidatastream" where "multidatastream"."thing_id" = "thing"."id")`,
                link: `"multidatastream"."id" in (select "multidatastream"."id" from "multidatastream" where "multidatastream"."thing_id" = $ID)`,

                entityName: "MultiDatastreams",
                tableName: "multidatastream",
                relationKey: "thing_id",
                entityColumn: "id",
                tableKey: "id"
            }
        }
    },

    FeaturesOfInterest: {
        name: "FeaturesOfInterest",
        singular: "FeatureOfInterest",
        table: "featureofinterest",
        order: 4,
        columns: {
            id: {
                create: "BIGINT GENERATED ALWAYS AS IDENTITY",
                comment: "A unique bigSerial.",
                alias: '"featureofinterest"."id" AS "@iot.id"',
                form: {type : "number"}
            },
            name: {
                create: "text NOT NULL DEFAULT 'no name'::text",
                comment: "A property provides a label for FeatureOfInterest entity, commonly a descriptive name.",
                form: {type : "text"}
            },
            description: {
                create: "text NOT NULL DEFAULT 'description'::text",
                comment: "The description about the FeatureOfInterest.",
                form: {type : "text"}
            },
            encodingType: {
                create: "text NOT NULL",
                comment: "The encoding type of the feature property.",
                form: {type : "text"}
            },
            feature: {
                create: "jsonb NOT NULL",
                comment: "The detailed description of the feature. The data type is defined by encodingType.",
                form: {type : "textarea"},
                test: "encodingType"
            }
        },
        migrationTest: true,
        relations: {
            Observations: {
                type: RELATIONS.hasMany,
                expand: `"observation"."id" in (select "observation"."id" from "observation" where "observation"."featureofinterest_id" = "featureofinterest"."id")`,
                link: `"observation"."id" in (select "observation"."id" from "observation" where "observation"."featureofinterest_id" = $ID)`,

                entityName: "Observations",
                tableName: "observation",
                relationKey: "featureofinterest_id",
                entityColumn: "id",
                tableKey: "id"
            },
            Locations: {
                type: RELATIONS.belongsTo,
                expand: `"location"."id" in (select "location"."id" from "location" where "location"."_default_foi" = "featureofinterest"."id")`,
                link: "err: 404 : Not a valid Path.",

                entityName: "Locations",
                tableName: "location",
                // hide all relations start with "_"
                relationKey: "_default_foi",
                entityColumn: "id",
                tableKey: "id"
            }
        },
        constraints: {
            featureofinterest_pkey: 'PRIMARY KEY ("id")'
        },
        after: "INSERT INTO featureofinterest (name, description, \"encodingType\", feature) VALUES ('Default Feature of Interest', 'Default Feature of Interest', 'application/vnd.geo+json', '{}');"
    },

    Locations: {
        name: "Locations",
        singular: "Location",
        table: "location",
        order: 6,
        columns: {
            id: {
                create: "BIGINT GENERATED ALWAYS AS IDENTITY",
                comment: "A unique bigSerial.",
                alias: makeIDAlias("location"),
                form: {type : "number"},
            },
            name: {
                create: "text NOT NULL DEFAULT 'no name'::text",
                comment: "A property provides a label for Location entity, commonly a descriptive name.",
                form: {type : "text"}
            },
            description: {
                create: "text NOT NULL DEFAULT 'no description'::text",
                comment: "The description about the location.",
                form: {type : "text"}
            },
            encodingType: {
                create: "text NOT NULL",
                comment: "The encoding type of the location.",
                dataList: {
                    "GeoJSON": "application/vnd.geo+json"
                },
                form: {type : "select"}
            },
            location: {
                create: "jsonb NOT NULL",
                comment: "The location type is defined by encodingType.",
                form: {type : "textarea"},
                test: "encodingType"
            },
            _default_foi: {
                create: "BIGINT",
                comment: "Default feature of interest."
            },
            geom: {
                // Not in Sensor 1.1
                create: "geometry NULL",
                comment: "Geom.",
                form: {type : "textarea"}
            },
            properties: {
                // Not in Sensor 1.1
                create: "jsonb NULL",
                comment: "Properties of the location.",
                form: {type : "textarea"}
            }
        },
        constraints: {
            location_pkey: 'PRIMARY KEY ("id")'
        },
        migrationTest: true,
        relations: {
            Things: {
                type: RELATIONS.belongsToMany,
                expand: `"thing"."id" in (select "thing_location"."thing_id" from "thing_location" where "thing_location"."location_id" = "location"."id")`,
                link: `"thing"."id" in (select "thing_location"."thing_id" from "thing_location" where "thing_location"."location_id" = $ID)`,

                entityName: "Things",
                tableName: "thing_location",
                relationKey: "location_id",
                entityColumn: "thing_id",
                tableKey: "thing_id"
            },
            HistoricalLocations: {
                type: RELATIONS.belongsToMany,
                expand: `"historical_location"."id" in (select "historical_location"."id" from "historical_location" where "historical_location"."thing_id" in (select "thing_location"."thing_id" from "thing_location" where "thing_location"."location_id" = "location"."id"))`,
                link: `"historical_location"."id" in (select "historical_location"."id" from "historical_location" where "historical_location"."thing_id" in (select "thing_location"."thing_id" from "thing_location" where "thing_location"."location_id" = $ID))`,

                entityName: "HistoricalLocation",
                tableName: "location_historical_location",
                relationKey: "location_id",
                // entityColumn: "location_id",
                entityColumn: "id",
                tableKey: "id"
            },
            FeatureOfInterest: {
                //TODO VERIF
                type: RELATIONS.belongsTo,
                expand: `"featureofinterest"."id" = "location"."_default_foi"`,
                // link: "err: 404 : Path is not valid.",
                link: `"featureofinterest"."id" = (select "location"."_default_foi" from "location" where "location"."id" = $ID)`,

                entityName: "FeaturesOfInterest",
                tableName: "featureofinterest",
                // hide all relations start with "_"²
                relationKey: "_default_foi",
                entityColumn: "id",
                tableKey: "id"
            }
        }
    },

    HistoricalLocations: {
        name: "HistoricalLocations",
        singular: "HistoricalLocation",
        table: "historical_location",
        order: 5,
        columns: {
            id: {
                create: "BIGINT GENERATED ALWAYS AS IDENTITY",
                comment: "A unique bigSerial.",
                alias: makeIDAlias("historical_location")
            },
            time: {
                create: "timestamptz NULL",
                comment: "The time when the Thing is known at the Location."
            },
            thing_id: {
                create: "BIGINT NOT NULL",
                comment: "A unique bigSerial for thing."
            }
        },
        constraints: {
            historical_location_pkey: 'PRIMARY KEY ("id")',
            historical_location_thing_id_fkey: 'FOREIGN KEY ("thing_id") REFERENCES "thing"("id") ON UPDATE CASCADE ON DELETE CASCADE'
        },
        indexes: {
            historical_location_thing_id: 'ON public."historical_location" USING btree ("thing_id")'
        },
        migrationTest: true,
        relations: {
            // TODO NOT GOOD
            Things: {
                type: RELATIONS.belongsTo,
                expand: `"thing"."id" = "historical_location"."thing_id"`,
                link: `"thing"."id" = (select "historical_location"."thing_id" from "historical_location" where "historical_location"."id" = $ID)`,

                entityName: "Things",
                tableName: "thing",
                relationKey: "thing_id",
                entityColumn: "id",
                tableKey: "id"
            },
            Locations: {
                type: RELATIONS.belongsToMany,
                expand: `"location"."id" in (select "location"."id" from "location" where "location"."id" in (select "thing_location"."location_id" from "thing_location" where "thing_location"."thing_id" = "historical_location"."thing_id"))`,
                link: `"location"."id" in (select "location"."id" from "location" where "location"."id" in (select "thing_location"."location_id" from "thing_location" where "thing_location"."thing_id" in (select "historical_location"."thing_id" from "historical_location" where "historical_location"."id" = $ID)))`,

                entityName: "locationsHistoricalLocations",
                tableName: "location_historical_location",
                relationKey: "historical_location_id",
                entityColumn: "location_id",
                tableKey: "location_id"
            }
        }
    },

    locationsHistoricalLocations: {
        name: "locationsHistoricalLocations",
        singular: "locationHistoricalLocation",
        table: "location_historical_location",
        order: -1,
        columns: {
            location_id: {
                create: "BIGINT NOT NULL",
                comment: "A unique bigSerial for location."
            },
            historical_location_id: {
                create: "BIGINT NOT NULL",
                comment: "A unique bigSerial for historical location."
            }
        },
        constraints: {
            location_historical_location_pkey: 'PRIMARY KEY ("location_id", "historical_location_id")',
            location_historical_location_historical_location_id_fkey:
                'FOREIGN KEY ("historical_location_id") REFERENCES "historical_location"("id") ON UPDATE CASCADE ON DELETE CASCADE',
            location_historical_location_location_id_fkey: 'FOREIGN KEY ("location_id") REFERENCES "location"("id") ON UPDATE CASCADE ON DELETE CASCADE'
        },
        indexes: {
            location_historical_location_historical_location_id: 'ON public."location_historical_location" USING btree ("historical_location_id")',
            location_historical_location_location_id: 'ON public."location_historical_location" USING btree ("location_id")'
        },
        migrationTest: true,
        relations: {}
    },

    ObservedProperties: {
        name: "ObservedProperties",
        singular: "ObservedProperty",
        table: "observedproperty",
        order: 8,
        columns: {
            id: {
                create: "BIGINT GENERATED ALWAYS AS IDENTITY",
                comment: "A unique bigSerial.",
                alias: makeIDAlias("observedproperty"),
                form: {type : "number"}
            },
            name: {
                create: "text NOT NULL DEFAULT 'no name'::text",
                comment: "A property provides a label for ObservedProperty entity, commonly a descriptive name.",
                form: {type : "text"}
            },
            definition: {
                create: "text NOT NULL DEFAULT 'definition'::text",
                comment: "The URI of the ObservedProperty. Dereferencing this URI SHOULD result in a representation of the definition of the ObservedProperty.",
                form: {type : "text"}
            },
            description: {
                create: "text NOT NULL DEFAULT 'description'::text",
                comment: "A description about the ObservedProperty.",
                form: {type : "text"}
            },
            properties: {
                // Not in Sensor 1.1
                create: "jsonb NULL",
                comment: "The detailed properties of the observed property.",
                form: {type : "textarea"}
            }
        },
        constraints: {
            observedproperty_pkey: 'PRIMARY KEY ("id")'
        },
        migrationTest: true,
        relations: {
            Datastreams: {
                type: RELATIONS.hasMany,
                // expand: "err: 501 : Not Implemented.",
                expand: `"datastream"."id" in (select "datastream"."id" from "datastream" where "datastream"."observedproperty_id" = "observedproperty"."id")`,
                link: `"datastream"."id" in (SELECT "datastream"."id" FROM "datastream" WHERE "datastream"."observedproperty_id" = $ID)`,

                entityName: "Datastreams",
                tableName: "datastream",
                relationKey: "observedproperty_id",
                entityColumn: "id",
                tableKey: "id"
            },
            MultiDatastreams: {
                type: RELATIONS.hasMany,
                expand: `"multidatastream"."id" in (SELECT "multi_datastream_observedproperty"."multidatastream_id" FROM "multi_datastream_observedproperty" WHERE "multi_datastream_observedproperty"."observedproperty_id" = "observedproperty"."id")`,
                link: `"multidatastream"."id" in (SELECT "multi_datastream_observedproperty"."multidatastream_id" FROM "multi_datastream_observedproperty" WHERE "multi_datastream_observedproperty"."observedproperty_id" = $ID)`,

                entityName: "MultiDatastreams",
                tableName: "multi_datastream_observedproperty",
                relationKey: "observedproperty_id",
                entityColumn: "multidatastream_id",
                tableKey: "multidatastream_id"
            }
        }
    },

    Sensors: {
        name: "Sensors",
        singular: "Sensor",
        table: "sensor",
        order: 9,
        columns: {
            id: {
                create: "BIGINT GENERATED ALWAYS AS IDENTITY",
                comment: "A unique bigSerial.",
                alias: makeIDAlias("sensor"),
                form: {type : "number"}
            },
            name: {
                create: "text NOT NULL DEFAULT 'no name'::text",
                comment: "A property provides a label for FeatureOfInterest entity, commonly a descriptive name.",
                form: {type : "text"}
            },
            description: {
                create: "text NOT NULL DEFAULT 'no description'::text",
                comment: "The definition of the observed property.",
                form: {type : "text"}
            },
            encodingType: {
                create: "text NOT NULL",
                comment: "The encoding type of the feature property.",
                dataList: {
                    "PDF": "application/pdf",
                    "SensorML": "http://www.opengis.net/doc/IS/SensorML/2.0"
                },
                form: {type : "select"}
            },
            metadata: {
                create: "text NOT NULL",
                comment: "The encoding type of the feature property.",
                form: {type : "text"}
            },
            properties: {
                // Not in Sensor 1.1
                create: "jsonb NULL",
                comment: "The detailed description of the feature. The data type is defined by encodingType.",
                form: {type : "textarea"}
            }
        },
        constraints: {
            sensor_pkey: 'PRIMARY KEY ("id")'
        },
        migrationTest: true,
        relations: {
            Datastreams: {
                type: RELATIONS.hasMany,
                expand: `"datastream"."id" in (select "datastream"."id" from "datastream" where "datastream"."id" = "sensor"."id")`,
                link: `"datastream"."id" in (select "datastream"."id" from "datastream" where "datastream"."sensor_id" = $ID)`,

                entityName: "Datastreams",
                tableName: "datastream",
                relationKey: "sensor_id",
                entityColumn: "id",
                tableKey: "id"
            },
            MultiDatastreams: {
                type: RELATIONS.hasMany,
                expand: `"multidatastream"."id" in (select "multidatastream"."id" from "multidatastream" where "multidatastream"."id" = "sensor"."id")`,
                link: `"multidatastream"."id" in (select "multidatastream"."id" from "multidatastream" where "multidatastream"."sensor_id" = $ID)`,

                entityName: "MultiDatastreams",
                tableName: "multidatastream",
                relationKey: "sensor_id",
                entityColumn: "id",
                tableKey: "id"
            },
            Loras: {
                type: RELATIONS.belongsTo,
                expand: `"lora"."id" = (select "lora"."id" from "lora" where "lora"."sensor_id" = "sensor"."id")`,
                link: `"lora"."id" = (select "lora"."id" from "lora" where "lora"."sensor_id" = $ID)`,
                entityName: "Loras",
                tableName: "lora",
                relationKey: "sensor_id",
                entityColumn: "id",
                tableKey: "id"
            }
        }
    },

    Datastreams: {
        name: "Datastreams",
        singular: "Datastream",
        table: "datastream",
        order: 1,
        columns: {
            id: {
                create: "BIGINT GENERATED ALWAYS AS IDENTITY",
                comment: "A unique bigSerial.",
                alias: makeIDAlias("datastream"),
                form: {type : "number"}
            },
            name: {
                create: "text NOT NULL DEFAULT 'no name'::text",
                comment: "A property provides a label for Datastream entity, commonly a descriptive name.",
                form: {type : "text"}
            },
            description: {
                create: "text NOT NULL DEFAULT 'no description'::text",
                comment: "The description of the Datastream entity.",
                form: {type : "text"}
            },
            observationType: {
                create: "text NULL",
                comment: "The type of Observation (with unique result type), which is used by the service to encode observations.",
                form: {type : "text"}
            },
            unitOfMeasurement: {
                create: "jsonb NOT NULL",
                comment: "The encoding type of the feature property.",
                form: {type : "textarea"}
            },
            observedArea: {
                create: "geometry NULL",
                comment:
                    "The spatial bounding box of the spatial extent of all FeaturesOfInterest that belong to the Observations associated with this Datastream.",
                    form: {type : "textarea"}
            },
            phenomenonTime: {
                create: "",
                comment: "The temporal interval of the phenomenon times of all observations belonging to this Datastream.",
                alias: `CONCAT(\n\t\tto_char((SELECT min("observation"."phenomenonTime") from "observation" where "observation"."datastream_id" = "datastream"."id"),\n\t\t'${_DATEFORMAT}'),\n\t\t'/',\n\t\tto_char((SELECT max("observation"."phenomenonTime") from "observation" where "observation"."datastream_id" = "datastream"."id"),\n\t\t'${_DATEFORMAT}')\n\t) AS "phenomenonTime"`,
                form: {type : "text"}              
            },
            resultTime: {
                create: "",
                comment: "The temporal interval of the phenomenon times of all observations belonging to this Datastream.",
                alias: `CONCAT(\n\t\tto_char((SELECT min("observation"."resultTime") from "observation" where "observation"."datastream_id" = "datastream"."id"),\n\t\t'${_DATEFORMAT}'),\n\t\t'/',\n\t\tto_char((SELECT max("observation"."resultTime") from "observation" where "observation"."datastream_id" = "datastream"."id"),\n\t\t'${_DATEFORMAT}')\n\t) AS "resultTime"`,
                form: {type : "text"}
            },
            thing_id: {
                create: "BIGINT NOT NULL",
                comment: "A unique bigSerial for thing.",
                form: {type : "entity", entity: "Things"}
            },
            observedproperty_id: {
                create: "BIGINT NOT NULL",
                comment: "A unique bigSerial for observedproperty.",
                form: {type : "entity", entity: "ObservedProperties"}
            },
            sensor_id: {
                create: "BIGINT NOT NULL",
                comment: "A unique bigSerial for sensor.",
                form: {type : "entity", entity: "Sensor"}
            },
            properties: {
                create: "jsonb NULL",
                comment: "The detailed description of the feature. The data type is defined by encodingType.",
                form: {type : "textarea"}
            }
        },
        migrationTest: true,
        relations: {
            Thing: {
                type: RELATIONS.belongsTo,
                expand: `"thing"."id" = "datastream"."thing_id"`,
                link: `"thing"."id" = (select "datastream"."thing_id" from "datastream" where "datastream"."id" =$ID)`,
                entityName: "Things",
                tableName: "datastream",
                relationKey: "id",
                entityColumn: "thing_id",
                tableKey: "id"
            },
            Sensor: {
                type: RELATIONS.belongsTo,
                expand: `"sensor"."id" = "datastream"."sensor_id"`,
                link: `"sensor"."id" = (select "datastream"."sensor_id" from "datastream" where "datastream"."id" =$ID)`,

                entityName: "Sensors",
                tableName: "datastream",
                relationKey: "id",
                entityColumn: "sensor_id",
                tableKey: "id"
            },
            ObservedProperty: {
                type: RELATIONS.belongsTo,
                expand: `"observedproperty"."id" = "datastream"."observedproperty_id"`,
                link: `"observedproperty"."id" = (select "datastream"."observedproperty_id" from "datastream" where "datastream"."id" =$ID)`,
                entityName: "ObservedProperties",
                tableName: "datastream",
                relationKey: "id",
                entityColumn: "observedproperty_id",
                tableKey: "id"
            },
            Observations: {
                type: RELATIONS.hasMany,
                expand: `"observation"."id" in (select "observation"."id" from "observation" where "observation"."datastream_id" = "datastream"."id" ORDER BY "observation"."resultTime" ASC)`,
                link: `"observation"."id" in (select "observation"."id" from "observation" where "observation"."datastream_id" = $ID ORDER BY "observation"."resultTime" ASC)`,
                entityName: "Observations",
                tableName: "observation",
                relationKey: "datastream_id",
                entityColumn: "id",
                tableKey: "id"
            }
        },
        constraints: {
            datastream_pkey: 'PRIMARY KEY ("id")',
            // datastream_deveui: 'UNIQUE ("deveui")',
            datastream_observedproperty_id_fkey: 'FOREIGN KEY ("observedproperty_id") REFERENCES "observedproperty"("id") ON UPDATE CASCADE ON DELETE CASCADE',
            datastream_sensor_id_fkey: 'FOREIGN KEY ("sensor_id") REFERENCES "sensor"("id") ON UPDATE CASCADE ON DELETE CASCADE',
            datastream_thing_id_fkey: 'FOREIGN KEY ("thing_id") REFERENCES "thing"("id") ON UPDATE CASCADE ON DELETE CASCADE'
        },
        indexes: {
            datastream_observedproperty_id: 'ON public."datastream" USING btree ("observedproperty_id")',
            datastream_sensor_id: 'ON public."datastream" USING btree ("sensor_id")',
            datastream_thing_id: 'ON public."datastream" USING btree ("thing_id")'
        }
    },

    MultiDatastreams: {
        name: "MultiDatastreams",
        singular: "MultiDatastream",
        table: "multidatastream",
        order: 2,
        columns: {
            id: {
                create: "BIGINT GENERATED ALWAYS AS IDENTITY",
                comment: "A unique bigSerial.",
                alias: makeIDAlias("multidatastream"),
                form: {type : "number"}
            },
            name: {
                create: "text NOT NULL DEFAULT 'no name'::text",
                comment: "A property provides a label for MultiDatastream entity, commonly a descriptive name.",
                form: {type : "text"}
            },
            description: {
                create: "text NULL",
                comment: "The description of the MultiDatastream entity.",
                form: {type : "text"}
            },
            unitOfMeasurements: {
                create: "jsonb NOT NULL",
                comment:
                    "A JSON array of JSON objects that containing three key-value pairs. The name property presents the full name of the unitOfMeasurement; the symbol property shows the textual form of the unit symbol; and the definition contains the URI defining the unitOfMeasurement. (see Req 42 for the constraints between unitOfMeasurement, multiObservationDataType and result)",
                    form: {type : "textarea"}
            },
            observationType: {
                create: "text NULL",
                comment: "The type of Observation (with unique result type), which is used by the service to encode observations.",
                form: {type : "text"}
            },
            multiObservationDataTypes: {
                create: "text[] NULL",
                comment: "This property defines the observationType of each element of the result of a complex Observation.",
                form: {type : "text"}
            },
            observedArea: {
                create: "geometry NULL",
                comment:
                    "The spatial bounding box of the spatial extent of all FeaturesOfInterest that belong to the Observations associated with this MultiDatastream.",
                    form: {type : "textarea"}
            },
            phenomenonTime: {
                create: "",
                comment: "The temporal interval of the phenomenon times of all observations belonging to this MultiDatastream.",
                alias: `CONCAT(to_char((SELECT min("observation"."phenomenonTime") from "observation" where "observation"."multidatastream_id" = "multidatastream"."id"),'${_DATEFORMAT}'),'/', to_char((SELECT max("observation"."phenomenonTime") from "observation" where "observation"."multidatastream_id" = "multidatastream"."id"),'${_DATEFORMAT}')) AS "phenomenonTime"`,
                form: {type : "text"}
            },
            resultTime: {
                create: "",
                comment: "The temporal interval of the resultTime times of all observations belonging to this MultiDatastream.",
                alias: `CONCAT(to_char((SELECT min("observation"."resultTime") from "observation" where "observation"."multidatastream_id" = "multidatastream"."id"),'${_DATEFORMAT}'),'/', to_char((SELECT max("observation"."resultTime") from "observation" where "observation"."multidatastream_id" = "multidatastream"."id"),'${_DATEFORMAT}')) AS "resultTime"`,
                form: {type : "text"}
            },
            thing_id: {
                create: "BIGINT NOT NULL",
                comment: "A unique bigSerial for thing.",
                form: {type : "entity", entity: "Things"}
            },
            sensor_id: {
                create: "BIGINT NOT NULL",
                comment: "A unique bigSerial for sensor.",
                form: {type : "entity", entity: "Sensors"}
            },
            properties: {
                create: "jsonb NULL",
                comment: "The detailed description of the multi datastream. The data type is defined by encodingType.",
                form: {type : "textarea"}
            }
        },
    migrationTest: true,
        relations: {
            Thing: {
                type: RELATIONS.belongsTo,
                expand: `"thing"."id" = "multidatastream"."thing_id"`,
                link: `"thing"."id" = (select "multidatastream"."thing_id" from "multidatastream" where "multidatastream"."id" =$ID)`,

                entityName: "Things",
                tableName: "multidatastream",
                relationKey: "id",
                entityColumn: "thing_id",
                tableKey: "id"
            },
            Sensor: {
                type: RELATIONS.belongsTo,
                expand: `"sensor"."id" = "multidatastream"."sensor_id"`,
                link: `"sensor"."id" = (select "multidatastream"."sensor_id" from "multidatastream" where "multidatastream"."id" =$ID)`,

                entityName: "Sensors",
                tableName: "multidatastream",
                relationKey: "id",
                entityColumn: "sensor_id",
                tableKey: "id"
            },
            Observations: {
                type: RELATIONS.hasMany,
                expand: `"observation"."id" in (select "observation"."id" from "observation" where "observation"."multidatastream_id" = "multidatastream"."id")`,
                link: `"observation"."id" in (select "observation"."id" from "observation" where "observation"."multidatastream_id" = $ID)`,

                entityName: "Observations",
                tableName: "observation",
                relationKey: "multidatastream_id",
                entityColumn: "id",
                tableKey: "id"
            },
            ObservedProperties: {
                type: RELATIONS.belongsTo,
                expand: `"observedproperty"."id" in (SELECT "multi_datastream_observedproperty"."observedproperty_id" FROM "multi_datastream_observedproperty" WHERE "multi_datastream_observedproperty"."multidatastream_id" = "multidatastream"."id")`,
                link: `"observedproperty"."id" in (SELECT "multi_datastream_observedproperty"."observedproperty_id" FROM "multi_datastream_observedproperty" WHERE "multi_datastream_observedproperty"."multidatastream_id" = $ID)`,
                entityName: "ObservedProperties",
                tableName: "multi_datastream_observedproperty",
                relationKey: "observedproperty_id",
                entityColumn: "multidatastream_id",
                tableKey: "multidatastream_id"
            }
        },
        constraints: {
            multidatastream_pkey: 'PRIMARY KEY ("id")',
            multidatastream_sensor_id_fkey: 'FOREIGN KEY ("sensor_id") REFERENCES "sensor"("id") ON UPDATE CASCADE ON DELETE CASCADE',
            multidatastream_thing_id_fkey: 'FOREIGN KEY ("thing_id") REFERENCES "thing"("id") ON UPDATE CASCADE ON DELETE CASCADE'
        },
        indexes: {
            multidatastream_sensor_id: 'ON public."multidatastream" USING btree ("sensor_id")',
            multidatastream_thing_id: 'ON public."multidatastream" USING btree ("thing_id")'
        }
    },

    MultiDatastreamObservedProperties: {
        name: "MultiDatastreamObservedProperties",
        singular: "MultiDatastreamObservedProperty",
        table: "multi_datastream_observedproperty",
        order: -1,
        columns: {
            multidatastream_id: {
                create: "BIGINT NOT NULL",
                comment: "A unique bigSerial for multidatastream id."
            },
            observedproperty_id: {
                create: "BIGINT NOT NULL",
                comment: "A unique bigSerial for observedproperty id."
            }
            // rank: {
            //     create: "INT NOT NULL",
            //     comment: "?."
            // }
        },
        migrationTest: true,
        relations: {},
        constraints: {
            multi_datastream_observedproperty_pkey: 'PRIMARY KEY ("multidatastream_id", "observedproperty_id")',
            multi_datastream_observedproperty_multidatastream_id_fkey:
                'FOREIGN KEY ("multidatastream_id") REFERENCES "multidatastream"("id") ON UPDATE CASCADE ON DELETE CASCADE',
            multi_datastream_observedproperty_observedproperty_id_fkey:
                'FOREIGN KEY ("observedproperty_id") REFERENCES "observedproperty"("id") ON UPDATE CASCADE ON DELETE CASCADE'
        },
        indexes: {
            multi_datastream_observedproperty_multidatastream_id: 'ON public."multi_datastream_observedproperty" USING btree ("multidatastream_id")',
            multi_datastream_observedproperty_observedproperty_id: 'ON public."multi_datastream_observedproperty" USING btree ("observedproperty_id")'
        }
    },

    Observations: {
        // `case when multidatastream_id  is null then array_prepend(resultnumber, resultnumbers) else resultnumbers end AS mario`
        name: "Observations",
        singular: "Observation",
        table: "observation",
        order: 7,
        columns: {
            id: {
                create: "BIGINT GENERATED ALWAYS AS IDENTITY",
                comment: "A unique bigSerial.",
                alias: makeIDAlias("observation"),
                form: {type : "number"}
            },
            phenomenonTime: {
                create: "timestamptz NOT NULL",
                comment: "The time instant or period of when the Observation happens.",
                form: {type : "datetime-local"}
            },
            resultnumber: {
                create: "float8 NULL",
                comment: "The estimated value of an ObservedProperty from the Observation.",
                alias: ' CASE WHEN "observation"."datastream_id" is not null THEN "observation"."resultnumber" end as "result"',
                form: {alias: "result", type : "number"}
            },
            resultnumbers: {
                create: "float8[] NULL",
                comment: "The estimated value of an ObservedProperty from the Observation.",
                alias: ' CASE WHEN "observation"."multidatastream_id" is not null THEN "observation"."resultnumbers" end as "result"',
                form: {alias: "result", type : "datalist"}
            },
            resultTime: {
                create: "timestamptz NOT NULL",
                comment: "The time of the Observation result was generated.",
                form: {type : "datetime-local"}
                
            },
            resultQuality: {
                create: "jsonb NULL",
                comment: "Describes the quality of the result.",
                form: {type : "textarea"}
            },
            validTime: {
                create: "timestamptz DEFAULT CURRENT_TIMESTAMP",
                comment: "The time period during which the result may be used.",
                form: {type : "datetime-local"}
            },
            parameters: {
                create: "jsonb NULL",
                comment: "Key-value pairs showing the environmental conditions during measurement.",
                form: {type : "textarea"}
            },
            datastream_id: {
                create: "BIGINT NULL",
                comment: "The spatial.",
                form: {type : "entity", entity: "Datastreams"}
            },
            multidatastream_id: {
                create: "BIGINT NULL",
                comment: "The spatial.",
                form: {type : "entity", entity: "MultiDatastreams"}
            },
            featureofinterest_id: {
                create: "BIGINT NOT NULL DEFAULT 1",
                comment: "mandatory (If it is not provided it will be automatically created based on the Location of associated Thing)",
                form: {type : "entity", entity: "FeaturesOfInterest"}
            }
        },
        constraints: {
            observation_pkey: 'PRIMARY KEY ("id")',
            observation_datastream_id_fkey: 'FOREIGN KEY ("datastream_id") REFERENCES "datastream"("id") ON UPDATE CASCADE ON DELETE CASCADE',
            observation_multidatastream_id_fkey: 'FOREIGN KEY ("multidatastream_id") REFERENCES "multidatastream"("id") ON UPDATE CASCADE ON DELETE CASCADE',
            observation_featureofinterest_id_fkey:
                'FOREIGN KEY ("featureofinterest_id") REFERENCES "featureofinterest"("id") ON UPDATE CASCADE ON DELETE CASCADE'
        },
        indexes: {
            observation_datastream_id: 'ON public."observation" USING btree ("datastream_id")',
            observation_multidatastream_id: 'ON public."observation" USING btree ("multidatastream_id")',
            observation_featureofinterest_id: 'ON public."observation" USING btree ("featureofinterest_id")'
        },
        migrationTest: true,
        relations: {
            Datastream: {
                type: RELATIONS.belongsTo,
                expand: `"datastream"."id" = "observation"."datastream_id"`,
                link: `"datastream"."id" = (SELECT "observation"."datastream_id" FROM "observation" WHERE "observation"."id" = $ID)`,
                entityName: "Datastreams",
                tableName: "observation",
                relationKey: "id",
                entityColumn: "datastream_id",
                tableKey: "id"
            },
            MultiDatastream: {
                type: RELATIONS.belongsTo,
                expand: `"multidatastream"."id" = "observation"."multidatastream_id"`,
                link: `"multidatastream"."id" = (SELECT "observation"."multidatastream_id" FROM "observation" WHERE "observation"."id" = $ID)`,

                entityName: "MultiDatastreams",
                tableName: "observation",
                relationKey: "id",
                entityColumn: "multidatastream_id",
                tableKey: "id"
            },
            FeatureOfInterest: {
                type: RELATIONS.belongsTo,
                expand: `"featureofinterest"."id" = "observation"."featureofinterest_id"`,
                // link: "err: 501 : Not Implemented.",
                link: `"featureofinterest"."id" = (SELECT "observation"."featureofinterest_id" FROM "observation" WHERE "observation"."id" = $ID)`,


                entityName: "FeaturesOfInterest",
                tableName: "featureofinterest",
                relationKey: "id",
                entityColumn: "featureofinterest_id",
                tableKey: "id"
            }
        }
    },

    HistoricalObservations: {
        name: "HistoricalObservations",
        singular: "HistoricalObservation",
        table: "historical_observation",
        order: -1,
        columns: {
            id: {
                create: "BIGINT GENERATED ALWAYS AS IDENTITY",
                comment: "A unique bigSerial.",
                alias: makeIDAlias("historical_observation")
            },
            validTime: {
                create: "timestamptz DEFAULT CURRENT_TIMESTAMP",
                comment: "The time instant or period of when the Observation happens."
            },
            resultnumber: {
                create: "float8 NULL",
                comment: "The estimated value of an ObservedProperty from the Observation."
            },
            resultnumbers: {
                create: "float8[] NULL",
                comment: "The estimated value of an ObservedProperty from the Observation."
            },
            observation_id: {
                create: "BIGINT NULL",
                comment: "The Observations ID."
            }
        },
        constraints: {
            HistoricalObservations_pkey: 'PRIMARY KEY ("id")',
            HistoricalObservations_id_fkey: 'FOREIGN KEY ("observation_id") REFERENCES "observation"("id") ON UPDATE CASCADE ON DELETE CASCADE'
        },
        indexes: {
            HistoricalObservations_observation_id: 'ON public."historical_observation" USING btree ("observation_id")'
        },
        migrationTest: true,
        relations: {
            Observations: {
                type: RELATIONS.belongsTo,
                expand: `"observation"."id" = "historical_observation"."observation_id"`,
                link: "err: 501 : Not Implemented.",

                entityName: "Observations",
                tableName: "observation",
                relationKey: "observation_id",
                entityColumn: "id",
                tableKey: "id"
            }
        }
    },

    ThingsLocations: {
        name: "ThingsLocations",
        singular: "ThingLocation",
        table: "thing_location",
        order: -1,
        columns: {
            thing_id: {
                create: "BIGINT NOT NULL",
                comment: "A unique bigSerial for thing."
            },
            location_id: {
                create: "BIGINT NOT NULL",
                comment: "A unique bigSerial for location."
            }
        },
        migrationTest: true,
        relations: {},
        constraints: {
            thing_location_pkey: 'PRIMARY KEY ("thing_id", "location_id")',
            thing_location_location_id_fkey: 'FOREIGN KEY ("location_id") REFERENCES "location"("id") ON UPDATE CASCADE ON DELETE CASCADE',
            thing_location_thing_id_fkey: 'FOREIGN KEY ("thing_id") REFERENCES "thing"("id") ON UPDATE CASCADE ON DELETE CASCADE'
        },
        indexes: {
            thing_location_location_id: 'ON public."thing_location" USING btree ("location_id")',
            thing_location_thing_id: 'ON public."thing_location" USING btree ("thing_id")'
        }
    },

    Decoders: {
        name: "Decoders",
        singular: "Decoder",
        table: "decoder",
        order: 12,
        columns: {
            id: {
                create: "BIGINT GENERATED ALWAYS AS IDENTITY",
                comment: "A unique bigSerial.",
                form: {type : "number"}
            },
            name: {
                create: "text NOT NULL DEFAULT 'no name'::text",
                comment: "This is The name of decoder",
                form: {type : "text"}
            },
            description: {
                create: "text NOT NULL DEFAULT 'no description'::text",
                comment: "The definition of the observed property.",
                form: {type : "text"}
            },
            properties: {
                create: "jsonb NULL",
                comment: "The detailed description of the feature. The data type is defined by encodingType.",
                form: {type : "textarea"}
            },
            code: {
                create: "text NOT NULL",
                comment: "Javascript Code.",
                form: {type : "textarea"}
            }
        },
        constraints: {
            decoder_pkey: 'PRIMARY KEY ("id")'
        },
        migrationTest: true,
        relations: {
            Loras: {
                type: RELATIONS.hasMany,
                expand: `"lora"."id" in (select "lora"."id" from "lora" where "lora"."decoder_id" = "decoder"."id")`,
                link: `"lora"."id" in (select "lora"."id" from "lora" where "lora"."decoder_id" = $ID)`,
                entityName: "Loras",
                tableName: "lora",
                relationKey: "decoder_id",
                entityColumn: "id",
                tableKey: "id"
            }
        }
    },

    Loras: {
        name: "Loras",
        singular: "Lora",
        table: "lora",
        order: 11,
        columns: {
            id: {
                create: "BIGINT GENERATED ALWAYS AS IDENTITY",
                comment: "A unique bigSerial.",
                alias: makeIDAlias("lora"),
                form: {type : "number"}
            },
            deveui: {
                create: "text NOT NULL",
                comment: "The deveui of lora.",
                form: {type : "text"}
            },
            decoder_id: {
                create: "BIGINT NULL",
                comment: "Id of the decoder id",
                form: {type : "entity", entity: "Decoders"}
            },
            sensor_id: {
                create: "BIGINT NOT NULL",
                comment: "The sensor.",
                form: {type : "entity", entity: "Sensors"}
            }
        },
        constraints: {
            lora_pkey: 'PRIMARY KEY ("id")',
            lora_unik_deveui: 'UNIQUE ("deveui")',
            lora_sensor_id_fkey: 'FOREIGN KEY ("sensor_id") REFERENCES "sensor"("id") ON UPDATE CASCADE ON DELETE CASCADE',
            lora_decoder_id_fkey: 'FOREIGN KEY ("decoder_id") REFERENCES "decoder"("id") ON UPDATE CASCADE ON DELETE CASCADE'
        },
        indexes: {
            lora_sensor_id: 'ON public."lora" USING btree ("sensor_id")',
            lora_decoder_id: 'ON public."lora" USING btree ("decoder_id")'
        },
        migrationTest: true,
        relations: {
            Sensor: {
                type: RELATIONS.belongsTo,
                expand: `"sensor"."id" = "lora"."sensor_id"`,
                link: `"sensor"."id" = (SELECT "lora"."sensor_id" FROM "lora" WHERE "lora"."id" = $ID)`,
                entityName: "sensors",
                tableName: "sensor",
                relationKey: "id",
                entityColumn: "sensor_id",
                tableKey: "id"
            },
            Decoder: {
                type: RELATIONS.belongsTo,
                expand: `"decoder"."id" = "lora"."decoder_id"`,
                link: `"decoder"."id" = (SELECT "lora"."decoder_id" FROM "lora" WHERE "lora"."id" = $ID)`,
                entityName: "Decoders",
                tableName: "lora",
                relationKey: "id",
                entityColumn: "decoder_id",
                tableKey: "id"
            }
        }
    },

    CreateObservations: {
        name: "CreateObservations",
        singular: "CreateObservation",
        table: "",
        order: 0,
        columns: {},
        migrationTest: false,
        relations: {},
        constraints: {},
        indexes: {}
    },

    Config: {
        name: "Config",
        singular: "Config",
        table: "config",
        order: 0,
        columns: {
            version: {
                create: "text NOT NULL DEFAULT '1.0.0'::text",
                comment: "Api version."
            }
        },
        migrationTest: true,
        relations: {},
        constraints: {
            config_unik_version: 'UNIQUE ("version")',
        },
        indexes: {},
        after: `INSERT INTO config (version) VALUES ('${_ENV_VERSION}');`

    },

    Logs: {
        name: "Logs",
        singular: "Log",
        table: _DBADMIN.Logs_request.table,
        order: 0,
        columns: _DBADMIN.Logs_request.columns,
        migrationTest: false,
        relations: {},
        constraints: {},
        indexes: {}
    },    
};

export const _POSGRESTOJS:{[key:string]: string} = {
    "timestamptz": "timestamp",
    "text": "text",
    "bigint": "bigint",
    "jsonb": "jsonb",
    "text[]": "array",
    "float8[]": "array",
    "bigint[]": "array",
    "geometry": "user-defined",
    "float8": "double",
}

export type _ENTITIES =
    'Things' |
    'FeaturesOfInterest' |
    'Locations' |
    'HistoricalLocations' |
    'locationsHistoricalLocations' |
    'ObservedProperties' |
    'Sensors' |
    'Datastreams' |
    'MultiDatastreams' |
    'MultiDatastreamObservedProperties' |
    'Observations' |
    'HistoricalObservations' |
    'ThingsLocations' |
    'Decoders' |
    'Loras' |
    'CreateObservations' |
    'Logs';

