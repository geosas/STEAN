/**
 * create Database for demo qnd apidoc.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

const numberStr = ["one", "two", "three", "four", "five", "six", "seven", "height", "nine", "ten"];
const om = "http://www.opengis.net/def/observationType/OGC-OM/2.0/";

// Institut Agro Rennes-Angers 48.1140652783794, -1.7062956999598533 
const geoPos: { [key: string]: number[] }  = {
    "Centre commercial Grand Quartier" : [48.13765198324515, -1.6956051932646596],
    "Polyclinic Saint Laurent" : [48.139101133693764, -1.6571222811169917],
    "Golf municipal de Cesson-Sévigné": [48.12552590922048, -1.5889906727727678],
    "Glaz Arena": [48.11472599868096, -1.594679622929148],
    "Brin Herbe": [48.08416909630583, -1.601486946802519],
    "E.Leclerc VERN SUR SEICHE": [48.06467042196109, -1.623116279666956],
    "Écomusée du pays de Rennes": [48.07908248444603, -1.6664475955447595],
    "Castorama": [48.089982264765595, -1.7050636226736864],
    "The Mem": [48.089982264765595, -1.7050636226736864],
    "Kenedy": [48.123242161802274, -1.7127016234011674],
    "Institut Agro Rennes-Angers": [48.1140652783794, -1.7062956999598533 ]
}
const positions = Object.values(geoPos);


const lora = (nb: number) => `8cf9574000002d${nb + 1}d`;

const featureofinterest = (nb: number) =>
    `WITH featureofinterest as (insert into "featureofinterest" ("description", "encodingType", "feature", "name") values ('This is the weather station Number ${
        numberStr[nb]
    }', 'application/vnd.geo+json', '{"type":"Point","coordinates":["${positions[nb][0]}","${positions[nb][1]}"]}', 'Weather Station ${
        nb + 1
    }') RETURNING *)SELECT * FROM featureofinterest;`;

const sensor = (nb: number) =>
    `WITH sensor as (insert into "sensor" ("description", "encodingType", "metadata", "name") values ('PM sensor Number ${
        numberStr[nb]
    }', 'application/pdf', 'http://particle-sensor.com/', 'PM ${nb + 1} sensor') RETURNING *)SELECT * FROM sensor;`;

const thing = (nb: number) =>
    nb < 5
        ? `WITH thing as (insert into "thing" ("description", "name", "properties") values ('A SensorThingWeb thing Number ${numberStr[nb]}', 'SensorWebThing ${
              nb + 1
          }', '{"owner":"Mozilla version ${numberStr[nb]}","organization":"Mozilla"}') RETURNING *)SELECT * FROM thing;`
        : `WITH thing as (insert into "thing" ("description", "name", "properties") values ('A SensorWeb thing Number ${numberStr[nb]}', 'SensorWebThing ${
              nb + 1
          }', '{"owner":"Mozilla version ${
              numberStr[nb]
          }","organization":"Mozilla"}') RETURNING *), location1 AS (insert into "location" ("_default_foi", "description", "encodingType", "location", "name") values (2, '${Object.keys(geoPos)[nb]}', 'application/vnd.geo+json', '{"type":"Point","coordinates":["${positions[nb][0]}","${positions[nb][1]}"]}', 'UofC Number ${
              numberStr[nb]
          }')RETURNING id), thing_location AS (insert into "thing_location" ("location_id", "thing_id") values ((select location1.id from location1), (select thing.id from thing))RETURNING thing_id)SELECT * FROM thing;`;

const thingMulti = (nb: number) =>
    `WITH thing as (insert into "thing" ("description", "name", "properties") values ('A SensorWeb lora For MultiDatastreams Number ${
        numberStr[nb]
    }', 'MultiDatastreams SensorWebThing ${nb + 1}', '{"essai":"${lora(nb)}","sensor_id":"zzz${lora(
        nb
    )}"}') RETURNING *), location1 AS (insert into "location" ("_default_foi", "description", "encodingType", "location", "name") values (2, '${Object.keys(geoPos)[nb]}', 'application/vnd.geo+json', '{"type":"Point","coordinates":["${positions[nb][0]}","${positions[nb][1]}"]}', 'UofC (Created new location) Number one')RETURNING id), thing_location AS (insert into "thing_location" ("location_id", "thing_id") values ((select location1.id from location1), (select thing.id from thing))RETURNING thing_id)SELECT * FROM thing;`;

const observedproperty = (nb: number) =>
    `WITH observedproperty as (insert into "observedproperty" ("definition", "description", "name") values ('https://airnow.gov/index.cfm?action=aqibasics.particle', 'PM something Number ${
        numberStr[nb]
    }', 'PM ${nb + 1} observedProperties') RETURNING *) SELECT * FROM observedproperty;`;

const datastream = (nb: number) =>
    `WITH datastream as (insert into "datastream" ("description", "name", "observationType", "observedproperty_id", "sensor_id", "thing_id", "unitOfMeasurement") values ('Air quality Number ${
        numberStr[nb]
    }', 'air_quality_readings${nb + 1}', 'http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement', ${
        ["3, 1, 4", "2, 1, 5", "2, 3, 5", "4, 3, 1", "3, 2, 2", "1, 3, 4", "1, 3, 1", "8, 5, 6", "8, 5, 6", "8, 5, 6"][nb]
    }, '{"symbol":"μg/m³","name":"PM 2.5 Particulates (ug/m3)","definition":"http://unitsofmeasure.org/ucum.html"}') RETURNING *)SELECT * FROM datastream;`;

const multiDatastream = (nb: number) =>
    `WITH multidatastream as (insert into "multidatastream" ("description", "name", "sensor_id", "thing_id", "multiObservationDataTypes", "unitOfMeasurements") values ('Air quality Number ${
        numberStr[nb]
    }', 'air_quality_readings${nb + 1}', ${["3, 12", "1, 12", "3, 10", "3, 14", "3, 13", "4, 13", "1, 10", "5, 15", "5, 15", "5, 15"][nb]}, '{"${om}OM_Measurement", "${om}OM_Measurement", "${om}OM_CategoryObservation"}', '[{"name":"Humidity","symbol":"%","definition":"http://unitsofmeasure.org/humidity.html"},{"name":"Temperature","symbol":"°","definition":"http://unitsofmeasure.org/temperature.html"},{"name":"Battery","symbol":"%","definition":"http://unitsofmeasure.org/percentage.html"}]') RETURNING *), observedproperty3 AS (insert into "observedproperty" ("definition", "name") values ('Battery', 'Battery')RETURNING id), observedproperty2 AS (insert into "observedproperty" ("definition", "name") values ('Temperature', 'Temperature')RETURNING id), observedproperty1 AS (insert into "observedproperty" ("definition", "name") values ('humidity', 'humidity')RETURNING id), multi_datastream_observedproperty AS (insert into "multi_datastream_observedproperty" ("multidatastream_id", "observedproperty_id") values ((select multidatastream.id from multidatastream), (select observedproperty1.id from observedproperty1))RETURNING multidatastream_id), multi_datastream_observedproperty1 AS (insert into "multi_datastream_observedproperty" ("multidatastream_id", "observedproperty_id") values ((select multidatastream.id from multidatastream), (select observedproperty3.id from observedproperty3))RETURNING multidatastream_id)SELECT * FROM multidatastream;`;


const loras = (nb: number) =>
    `WITH lora as (insert into "lora" ("sensor_id", "deveui", "decoder_id") values ( ${[3, 1, 4, 5][nb]}, '${lora(
        nb 
    )}',1)RETURNING *)SELECT * FROM lora;`;

const datas = [
    `WITH observation as (insert into "observation" ("datastream_id", "featureofinterest_id", "phenomenonTime", "resultTime", "validTime", "resultnumber") values (1, 2, '2016-11-18T06:15:15.790Z','2016-11-18T06:15:15.790Z', '2016-11-18T18:30:30.790Z', '17.5') RETURNING *, resultnumber AS result)SELECT * FROM observation;`,
    `WITH observation as (insert into "observation" ("datastream_id", "featureofinterest_id", "phenomenonTime", "resultTime", "validTime", "resultnumber") values (2, 1, '2016-11-18T03:15:15.790Z','2016-11-18T03:15:15.790Z', '2016-11-18T15:30:30.790Z', '11.666666666666666') RETURNING *, resultnumber AS result)SELECT * FROM observation;`,
    `WITH observation as (insert into "observation" ("datastream_id", "featureofinterest_id", "phenomenonTime", "resultTime", "validTime", "resultnumber") values (3, 3, '2016-11-18T01:15:15.790Z','2016-11-18T01:15:15.790Z', '2016-11-18T11:30:30.790Z', '8.75') RETURNING *, resultnumber AS result)SELECT * FROM observation;`,
    `WITH observation as (insert into "observation" ("datastream_id", "featureofinterest_id", "phenomenonTime", "resultTime", "validTime", "resultnumber") values (4, 1, '2016-11-18T08:15:15.790Z','2016-11-18T08:15:15.790Z', '2016-11-18T15:30:30.790Z', '17.5') RETURNING *, resultnumber AS result)SELECT * FROM observation;`,
    `WITH observation as (insert into "observation" ("datastream_id", "featureofinterest_id", "phenomenonTime", "resultTime", "validTime", "resultnumber") values (1, 4, '2016-11-18T02:15:15.790Z','2016-11-18T02:15:15.790Z', '2016-11-18T15:30:30.790Z', '11.666666666666666') RETURNING *, resultnumber AS result)SELECT * FROM observation;`,
    `WITH observation as (insert into "observation" ("datastream_id", "featureofinterest_id", "phenomenonTime", "resultTime", "validTime", "resultnumber") values (3, 4, '2016-11-18T05:15:15.790Z','2016-11-18T05:15:15.790Z', '2016-11-18T16:30:30.790Z', '8.75') RETURNING *, resultnumber AS result)SELECT * FROM observation;`,
    `WITH observation as (insert into "observation" ("datastream_id", "featureofinterest_id", "phenomenonTime", "resultTime", "validTime", "resultnumber") values (2, 2, '2016-11-18T02:15:15.790Z','2016-11-18T02:15:15.790Z', '2016-11-18T18:30:30.790Z', '17.5') RETURNING *, resultnumber AS result)SELECT * FROM observation;`,
    `WITH observation as (insert into "observation" ("datastream_id", "featureofinterest_id", "phenomenonTime", "resultTime", "validTime", "resultnumber") values (10, 4, '2016-11-18T02:15:15.790Z', '2016-11-18T02:15:15.790Z', '2016-11-18T17:30:30.790Z', '45') RETURNING *, resultnumber AS result)SELECT * FROM observation;`,
    `WITH observation as (insert into "observation" ("datastream_id", "featureofinterest_id", "phenomenonTime", "resultTime", "validTime", "resultnumber") values (10, 1, '2016-11-18T07:15:15.790Z', '2016-11-18T07:15:15.790Z', '2016-11-18T18:30:30.790Z', '45') RETURNING *, resultnumber AS result)SELECT * FROM observation;`,
    `WITH observation as (insert into "observation" ("datastream_id", "featureofinterest_id", "phenomenonTime", "resultTime", "validTime", "resultnumber") values (10, 2, '2016-11-18T02:15:15.790Z', '2016-11-18T02:15:15.790Z', '2016-11-18T18:30:30.790Z', '45') RETURNING *, resultnumber AS result)SELECT * FROM observation;`,
    `WITH "log_request" as (select srid FROM "spatial_ref_sys" LIMIT 1), featureofinterest1 AS (select coalesce((select "id" from "featureofinterest" where "id" = 2), 2) AS id), multidatastream1 AS (select coalesce((select "id" from "multidatastream" where "id" = 2), 2) AS id), observation AS (insert into "observation" ("featureofinterest_id", "multidatastream_id", "phenomenonTime", "resultTime", "resultnumbers") values ((select featureofinterest1.id from featureofinterest1), (select multidatastream1.id from multidatastream1), '2016-11-18T01:15:15.790Z', '2016-11-18T12:30:30.790Z', '{"35","35","35"}')RETURNING *, resultnumber AS result)SELECT * FROM observation;`,
    `WITH "log_request" as (select srid FROM "spatial_ref_sys" LIMIT 1), featureofinterest1 AS (select coalesce((select "id" from "featureofinterest" where "id" = 2), 2) AS id), multidatastream1 AS (select coalesce((select "id" from "multidatastream" where "id" = 2), 2) AS id), observation AS (insert into "observation" ("featureofinterest_id", "multidatastream_id", "phenomenonTime", "resultTime", "resultnumbers") values ((select featureofinterest1.id from featureofinterest1), (select multidatastream1.id from multidatastream1), '2016-11-18T04:15:15.790Z', '2016-11-18T14:30:30.790Z', '{"17.5","35","17.5"}')RETURNING *, resultnumber AS result)SELECT * FROM observation;`,
    `WITH "log_request" as (select srid FROM "spatial_ref_sys" LIMIT 1), featureofinterest1 AS (select coalesce((select "id" from "featureofinterest" where "id" = 4), 4) AS id), multidatastream1 AS (select coalesce((select "id" from "multidatastream" where "id" = 1), 1) AS id), observation AS (insert into "observation" ("featureofinterest_id", "multidatastream_id", "phenomenonTime", "resultTime", "resultnumbers") values ((select featureofinterest1.id from featureofinterest1), (select multidatastream1.id from multidatastream1), '2016-11-18T03:15:15.790Z', '2016-11-18T15:30:30.790Z', '{"8.75","17.5","8.75"}')RETURNING *, resultnumber AS result)SELECT * FROM observation;`,
    `WITH "log_request" as (select srid FROM "spatial_ref_sys" LIMIT 1), featureofinterest1 AS (select coalesce((select "id" from "featureofinterest" where "id" = 3), 3) AS id), multidatastream1 AS (select coalesce((select "id" from "multidatastream" where "id" = 4), 4) AS id), observation AS (insert into "observation" ("featureofinterest_id", "multidatastream_id", "phenomenonTime", "resultTime", "resultnumbers") values ((select featureofinterest1.id from featureofinterest1), (select multidatastream1.id from multidatastream1), '2016-11-18T06:15:15.790Z', '2016-11-18T11:30:30.790Z', '{"8.75","11.666666666666666","17.5"}')RETURNING *, resultnumber AS result)SELECT * FROM observation;`,
    `WITH "log_request" as (select srid FROM "spatial_ref_sys" LIMIT 1), featureofinterest1 AS (select coalesce((select "id" from "featureofinterest" where "id" = 1), 1) AS id), multidatastream1 AS (select coalesce((select "id" from "multidatastream" where "id" = 1), 1) AS id), observation AS (insert into "observation" ("featureofinterest_id", "multidatastream_id", "phenomenonTime", "resultTime", "resultnumbers") values ((select featureofinterest1.id from featureofinterest1), (select multidatastream1.id from multidatastream1), '2016-11-18T06:15:15.790Z', '2016-11-18T12:30:30.790Z', '{"17.5","35","35"}')RETURNING *, resultnumber AS result)SELECT * FROM observation;`,
    `WITH "log_request" as (select srid FROM "spatial_ref_sys" LIMIT 1), featureofinterest1 AS (select coalesce((select "id" from "featureofinterest" where "id" = 3), 3) AS id), multidatastream1 AS (select coalesce((select "id" from "multidatastream" where "id" = 1), 1) AS id), observation AS (insert into "observation" ("featureofinterest_id", "multidatastream_id", "phenomenonTime", "resultTime", "resultnumbers") values ((select featureofinterest1.id from featureofinterest1), (select multidatastream1.id from multidatastream1), '2016-11-18T08:15:15.790Z', '2016-11-18T14:30:30.790Z', '{"35","17.5","11.666666666666666"}')RETURNING *, resultnumber AS result)SELECT * FROM observation;`,
    `WITH "log_request" as (select srid FROM "spatial_ref_sys" LIMIT 1), featureofinterest1 AS (select coalesce((select "id" from "featureofinterest" where "id" = 2), 2) AS id), multidatastream1 AS (select coalesce((select "id" from "multidatastream" where "id" = 4), 4) AS id), observation AS (insert into "observation" ("featureofinterest_id", "multidatastream_id", "phenomenonTime", "resultTime", "resultnumbers") values ((select featureofinterest1.id from featureofinterest1), (select multidatastream1.id from multidatastream1), '2016-11-18T03:15:15.790Z', '2016-11-18T12:30:30.790Z', '{"11.666666666666666","17.5","11.666666666666666"}')RETURNING *, resultnumber AS result)SELECT * FROM observation;`,
    `WITH "log_request" as (select srid FROM "spatial_ref_sys" LIMIT 1), featureofinterest1 AS (select coalesce((select "id" from "featureofinterest" where "id" = 3), 3) AS id), multidatastream1 AS (select coalesce((select "id" from "multidatastream" where "id" = 10), 10) AS id), observation AS (insert into "observation" ("featureofinterest_id", "multidatastream_id", "phenomenonTime", "resultTime", "resultnumbers") values ((select featureofinterest1.id from featureofinterest1), (select multidatastream1.id from multidatastream1), '2016-11-18T05:15:15.790Z', '2016-11-18T13:30:30.790Z', '{"45","50","55"}')RETURNING *, resultnumber AS result)SELECT * FROM observation;`,
    `WITH "log_request" as (select srid FROM "spatial_ref_sys" LIMIT 1), featureofinterest1 AS (select coalesce((select "id" from "featureofinterest" where "id" = 4), 4) AS id), multidatastream1 AS (select coalesce((select "id" from "multidatastream" where "id" = 10), 10) AS id), observation AS (insert into "observation" ("featureofinterest_id", "multidatastream_id", "phenomenonTime", "resultTime", "resultnumbers") values ((select featureofinterest1.id from featureofinterest1), (select multidatastream1.id from multidatastream1), '2016-11-18T02:15:15.790Z', '2016-11-18T15:30:30.790Z', '{"45","50","55"}')RETURNING *, resultnumber AS result)SELECT * FROM observation;`,
    `WITH "log_request" as (select srid FROM "spatial_ref_sys" LIMIT 1), featureofinterest1 AS (select coalesce((select "id" from "featureofinterest" where "id" = 1), 1) AS id), multidatastream1 AS (select coalesce((select "id" from "multidatastream" where "id" = 10), 10) AS id), observation AS (insert into "observation" ("featureofinterest_id", "multidatastream_id", "phenomenonTime", "resultTime", "resultnumbers") values ((select featureofinterest1.id from featureofinterest1), (select multidatastream1.id from multidatastream1), '2016-11-18T07:15:15.790Z', '2016-11-18T17:30:30.790Z', '{"45","50","55"}')RETURNING *, resultnumber AS result)SELECT * FROM observation;`,
    `WITH "log_request" as (select srid FROM "spatial_ref_sys" LIMIT 1), thing1 AS (select coalesce((select "id" from "thing" where "id" = 5), 5) AS id), featureofinterest1 AS (select coalesce((select "id" from "featureofinterest" where "id" = 4), 4) AS id), location AS (insert into "location" ("_default_foi", "description", "encodingType", "location", "name") values ((select featureofinterest1.id from featureofinterest1), '${Object.keys(geoPos)[6]}', 'application/vnd.geo+json', '{"type":"Point","coordinates":["${positions[6][0]}","${positions[6][1]}"]}', 'My Location 6')RETURNING *), thing_location AS (insert into "thing_location" ("location_id", "thing_id") values ((select location.id from location), (select thing1.id from thing1))RETURNING thing_id)SELECT * FROM location;`,
    `WITH "log_request" as (select srid FROM "spatial_ref_sys" LIMIT 1), thing1 AS (select coalesce((select "id" from "thing" where "id" = 5), 5) AS id), featureofinterest1 AS (select coalesce((select "id" from "featureofinterest" where "id" = 1), 1) AS id), location AS (insert into "location" ("_default_foi", "description", "encodingType", "location", "name") values ((select featureofinterest1.id from featureofinterest1), '${Object.keys(geoPos)[7]}', 'application/vnd.geo+json', '{"type":"Point","coordinates":["${positions[7][0]}","${positions[7][1]}"]}', 'My Location 7')RETURNING *), thing_location AS (insert into "thing_location" ("location_id", "thing_id") values ((select location.id from location), (select thing1.id from thing1))RETURNING thing_id)SELECT * FROM location;`,
    `WITH "log_request" as (select srid FROM "spatial_ref_sys" LIMIT 1), thing1 AS (select coalesce((select "id" from "thing" where "id" = 5), 5) AS id), featureofinterest1 AS (select coalesce((select "id" from "featureofinterest" where "id" = 3), 3) AS id), location AS (insert into "location" ("_default_foi", "description", "encodingType", "location", "name") values ((select featureofinterest1.id from featureofinterest1), '${Object.keys(geoPos)[8]}', 'application/vnd.geo+json', '{"type":"Point","coordinates":["${positions[8][0]}","${positions[8][1]}"]}', 'My Location 8')RETURNING *), thing_location AS (insert into "thing_location" ("location_id", "thing_id") values ((select location.id from location), (select thing1.id from thing1))RETURNING thing_id)SELECT * FROM location;`,
    `WITH "log_request" as (select srid FROM "spatial_ref_sys" LIMIT 1), thing1 AS (select coalesce((select "id" from "thing" where "id" = 5), 5) AS id), featureofinterest1 AS (select coalesce((select "id" from "featureofinterest" where "id" = 4), 4) AS id), location AS (insert into "location" ("_default_foi", "description", "encodingType", "location", "name") values ((select featureofinterest1.id from featureofinterest1), '${Object.keys(geoPos)[9]}', 'application/vnd.geo+json', '{"type":"Point","coordinates":["${positions[9][0]}","${positions[9][1]}"]}', 'My Location 9')RETURNING *), thing_location AS (insert into "thing_location" ("location_id", "thing_id") values ((select location.id from location), (select thing1.id from thing1))RETURNING thing_id)SELECT * FROM location;`,
    `WITH "log_request" as (select srid FROM "spatial_ref_sys" LIMIT 1), thing1 AS (select coalesce((select "id" from "thing" where "id" = 5), 5) AS id), featureofinterest1 AS (select coalesce((select "id" from "featureofinterest" where "id" = 1), 1) AS id), location AS (insert into "location" ("_default_foi", "description", "encodingType", "location", "name") values ((select featureofinterest1.id from featureofinterest1), '${Object.keys(geoPos)[10]}', 'application/vnd.geo+json', '{"type":"Point","coordinates":["${positions[10][0]}","${positions[10][1]}"]}', 'My Location 10')RETURNING *), thing_location AS (insert into "thing_location" ("location_id", "thing_id") values ((select location.id from location), (select thing1.id from thing1))RETURNING thing_id)SELECT * FROM location;`,
    `WITH historical_location as (insert into "historical_location" ("thing_id", "time") values (2, '2014-12-11T14:59:59.00+08:00') RETURNING *)SELECT * FROM historical_location;`,
    `WITH historical_location as (insert into "historical_location" ("thing_id", "time") values (2, '2014-12-21T12:59:59.00+08:00') RETURNING *)SELECT * FROM historical_location;`,
    `WITH historical_location as (insert into "historical_location" ("thing_id", "time") values (7, '2014-12-21T16:59:59.00+08:00') RETURNING *)SELECT * FROM historical_location;`,
    `WITH historical_location as (insert into "historical_location" ("thing_id", "time") values (2, '2014-12-11T17:59:59.00+08:00') RETURNING *)SELECT * FROM historical_location;`,
    `WITH historical_location as (insert into "historical_location" ("thing_id", "time") values (7, '2014-12-11T17:59:59.00+08:00') RETURNING *)SELECT * FROM historical_location;`,
    `WITH historical_location as (insert into "historical_location" ("thing_id", "time") values (5, '2014-12-11T16:59:59.00+08:00') RETURNING *)SELECT * FROM historical_location;`,
    `WITH historical_location as (insert into "historical_location" ("thing_id", "time") values (1, '2014-12-21T15:59:59.00+08:00') RETURNING *)SELECT * FROM historical_location;`,
    `WITH historical_location as (insert into "historical_location" ("thing_id", "time") values (4, '2014-12-11T15:59:59.00+08:00') RETURNING *)SELECT * FROM historical_location;`,
    `WITH historical_location as (insert into "historical_location" ("thing_id", "time") values (6, '2014-12-21T15:59:59.00+08:00') RETURNING *)SELECT * FROM historical_location;`,
    `WITH historical_location as (insert into "historical_location" ("thing_id", "time") values (7, '2014-12-11T13:59:59.00+08:00') RETURNING *)SELECT * FROM historical_location;`
];

export const datasDemo = (): string[] => {
    const result: string[] = [    `WITH decoder as (insert into "decoder" ("name", "code") values ('RHF1S001', '{const input = "DATAINPUT"; const nomenclature = NOMENCLATURE; const decoded = { valid: true, err: 0, payload: input, messages: [] }; const temp = input.match(/.{1,2}/g); if (temp != null) { if (temp[0] == "01" || temp[0] == "81") { decoded.messages.push({ type: "report_telemetry", measurementName: nomenclature["0610"], measurementValue: (parseInt(String(temp[2]) + String(temp[1]), 16) * 175.72) / 65536 - 46.85 }); decoded.messages.push({ type: "report_telemetry", measurementName: nomenclature["0710"], measurementValue: (parseInt(temp[3], 16) * 125) / 256 - 6 }); decoded.messages.push({ type: "upload_battery", measurementName: nomenclature["period"], measurementValue: parseInt(String(temp[5]) + String(temp[4]), 16) * 2 }); decoded.messages.push({ type: "upload_battery", measurementName: nomenclature["voltage"], measurementValue: (parseInt(temp[8], 16) + 150) * 0.01 }); return decoded; } } decoded["valid"] = false; decoded["err"] = -1; return decoded;}')RETURNING *)SELECT * FROM decoder;`
];
    for (let i = 0; i < 5; i++) {
        result.push(featureofinterest(i));
    }
    result.push("COMMIT;");

    for (let i = 0; i < 7; i++) {
        result.push(sensor(i));
    }
    result.push("COMMIT;");

    for (let i = 0; i < 10; i++) {
        result.push(thing(i));
    }
    result.push("COMMIT;");

    for (let i = 0; i < 10; i++) {
        result.push(thingMulti(i));
    }
    result.push("COMMIT;");

    for (let i = 0; i < 10; i++) {
        result.push(observedproperty(i));
    }
    result.push("COMMIT;");

    for (let i = 0; i < 10; i++) {
        result.push(datastream(i));
    }
    result.push("COMMIT;");

    for (let i = 0; i < 10; i++) {
        result.push(multiDatastream(i));
    }
    result.push("COMMIT;");

    for (let i = 0; i < 4; i++) {
        result.push(loras(i));
    }
    result.push("COMMIT;");

    datas.forEach((elem: string) => result.push(elem));
    result.push("COMMIT;");
     
    return result;
};
