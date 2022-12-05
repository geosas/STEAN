/**
 * timeSeries Enum.
 *
 * @copyright 2020-present Inrae
 * @author strPeriod.adam@inrae.fr
 *
 */

import { Knex } from "knex";
import { message } from "../../logger";
import { PgVisitor } from "../../odata";
import { TimeSeriesType } from "../../types";
import { _DBDATAS } from "../constants";
import { knexQueryToSql } from "./knexQueryToSql";

/**
 *
 * @param input string or number search
 * @returns the bigint extractPeriod number
 */

export class TimeSeries {
    private querySrc: string;
    private adam: string;

    constructor(query: Knex.QueryBuilder | string) {
        message(true, "CLASS", this.constructor.name, "Constructor");
        this.querySrc =
            typeof query === "string" ? query : knexQueryToSql(query.clone().clear("order").clear("limit").clear("select").select("resultTime", "result"));           
    }

    createSql(main: PgVisitor): string | undefined {
        if (!main.timeSeries) return;
        const type: TimeSeriesType = main.timeSeries;
        this.adam =  main.parentEntity && main.parentEntity == _DBDATAS.MultiDatastreams.name ? `("result"->>'result')::float`: `"result"`;
        switch (Object.values(TimeSeriesType).indexOf(type)) {
            case TimeSeriesType.YEAR:
                return this.timeYear(false);
            case TimeSeriesType.FULLYEAR:
                return this.timeYear(true);
            case TimeSeriesType.WEEK:
                return this.timeWeek(false);
            case TimeSeriesType.FULLWEEK:
                return this.timeWeek(true);
            case TimeSeriesType.MONTH:
                return this.timeMonth(false);
            case TimeSeriesType.FULLMONTH:
                return this.timeMonth(true);
            case TimeSeriesType.DAY:
                return this.timeDay(false);
            case TimeSeriesType.FULLDAY:
                return this.timeDay(true);
            case TimeSeriesType.HOUR:
                // const columnName = "hour";
                // this.extractPeriod = "HOUR";
                // this.strPeriod = `TO_CHAR(month_range.${this.columnName}, 'YYYY MM DD HH24:MI:SS') `;
                break;
            default: 
                return `ERROR|Time Series : ${type} not implemented`;


        }
    }

    private timeYear(full: boolean): string {
        message(true, "HEAD", `class ${this.constructor.name} timeYear`);
        const returnValue = [
            `WITH src AS (${this.querySrc}),`,
            `range_values AS (SELECT min(src."resultTime") as minval, max(src."resultTime") as maxval FROM src),`,
            `time_range AS (SELECT generate_series(minval, maxval::date + interval '1 year', '1 year'::interval) as year FROM range_values),`,
            `result_values AS (SELECT EXTRACT(YEAR FROM "resultTime") as year, AVG(${this.adam}) as result from src group by EXTRACT(YEAR FROM "resultTime"))`,
            `SELECT TO_CHAR(time_range.year, 'YYYY')  as "year", result_values."result" FROM time_range ${
                full === true ? "LEFT" : "RIGHT"
            } JOIN result_values ON (EXTRACT(YEAR from time_range."year") = result_values."year") where time_range."year" is not NULL ORDER BY time_range."year"`,

        ];
        return returnValue.join("\n");
    }

    private timeMonth(full: boolean): string {
        message(true, "HEAD", `class ${this.constructor.name} timeMonth`);

        const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
        const returnValue = [
            `SELECT * FROM`,
            `CROSSTAB(`,
            `$$`,
            `WITH src AS (${this.querySrc}),`,
            `range_values AS (SELECT min(src."resultTime") AS minval, max(src."resultTime") AS maxval FROM src),`,
            `time_range AS (SELECT generate_series(minval, maxval, '1 month'::interval) AS month FROM range_values),`,
            `result_by_month AS (SELECT EXTRACT(MONTH FROM "resultTime") AS month, EXTRACT(YEAR FROM "resultTime") AS year, AVG(${this.adam}) AS result FROM src group by EXTRACT(MONTH FROM "resultTime"), EXTRACT(YEAR FROM "resultTime")),`,
            `result_serie AS (select EXTRACT(YEAR FROM time_range."month") AS year, EXTRACT(MONTH FROM time_range."month") AS month, result_by_month."result" `,
            `FROM time_range ${
                full === true ? "LEFT" : "RIGHT"
            } JOIN result_by_month ON (EXTRACT(MONTH FROM time_range."month") = result_by_month."month") AND (EXTRACT(YEAR FROM time_range."month") = result_by_month."year") WHERE time_range."month" IS NOT NULL ORDER BY time_range."month" )`,
            `SELECT * FROM result_serie $$,$$ VALUES ('1'), ('2'), ('3'), ('4'), ('5'), ('6'), ('7'), ('8'), ('9'), ('10'), ('11'), ('12') $$)`,
            `AS (year NUMERIC, ${months.join(" NUMERIC, ")} NUMERIC)`
        ];
        return returnValue.join("\n");
    }

    private timeWeek(full: boolean): string {
        message(true, "HEAD", `class ${this.constructor.name} timeWeek`);
        const weeks: string[] = [];
        for (let pas = 1; pas < 53; pas++) {
            weeks.push(`${pas}`);
        }
        const returnValue = [
            `SELECT * FROM  CROSSTAB($$`,
            `WITH src AS (${this.querySrc}),`,
            `range_values AS (SELECT min(src."resultTime") as minval, max(src."resultTime") as maxval FROM src),`,
            `time_range AS (SELECT generate_series(minval, maxval, '1 week'::interval) as week FROM range_values),`,
            `time_extract as (select distinct EXTRACT(YEAR from time_range."week") as year, EXTRACT(WEEK from time_range."week") as week from time_range),`,
            `pre_result_values AS (SELECT EXTRACT(YEAR from src."resultTime") as year, EXTRACT(WEEK from src."resultTime") as week,  AVG(${this.adam})  as result from src group by "resultTime"),`,
            `result_values as (SELECT pre_result_values."year", pre_result_values."week", AVG(pre_result_values."result") as result FROM pre_result_values group by pre_result_values."year", pre_result_values."week"),`,
            `res as (SELECT DISTINCT time_extract."year", time_extract."week", result_values."result" FROM time_extract ${
                full === true ? "LEFT" : "RIGHT"
            } JOIN result_values ON result_values."year" = time_extract."year" and result_values."week" = time_extract."week")`,
            `SELECT * from res order by year, week;`,
            `$$, $$ VALUES ('${Array.from({ length: 52 }, (_, i) => i + 1).join("'),('")}') $$`,
            `) AS ("year" NUMERIC, "${weeks.join('" NUMERIC, "')}" NUMERIC )`
        ];
        return returnValue.join("\n");
    }

    private timeDay(full: boolean): string {
        message(true, "HEAD", `class ${this.constructor.name} timeWeek`);
        const days: string[] = [];
        for (let pas = 1; pas < 366; pas++) {
            days.push(`${pas}`);
        }
        const returnValue = [
            `SELECT * FROM  CROSSTAB($$`,
            `WITH src AS (${this.querySrc}),`,
            `range_values AS (SELECT min(src."resultTime") as minval, max(src."resultTime") as maxval FROM src),`,
            `time_range AS (SELECT generate_series(minval, maxval, '1 day'::interval) as day FROM range_values),`,
            `time_extract as (select distinct EXTRACT(YEAR from time_range."day") as year, EXTRACT(doy from time_range."day") as day from time_range),`,
            `pre_result_values AS (SELECT EXTRACT(YEAR from src."resultTime") as year, EXTRACT(doy from src."resultTime") as day,  AVG(${this.adam}) as result from src group by "resultTime"),`,
            `result_values as (SELECT pre_result_values."year", pre_result_values."day", AVG(pre_result_values."result") as result FROM pre_result_values group by pre_result_values."year", pre_result_values."day"),`,
            `res as (SELECT DISTINCT time_extract."year", time_extract."day", result_values."result" FROM time_extract ${
                full === true ? "LEFT" : "RIGHT"
            } JOIN result_values ON result_values."year" = time_extract."year" and result_values."day" = time_extract."day")`,
            `SELECT * from ${  full === true ? 'res': 'result_values' } order by year, day;`,
            `$$, $$ VALUES ('${Array.from({ length: 365 }, (_, i) => i + 1).join("'),('")}') $$`,
            `) AS ("year" NUMERIC, "${days.join('" NUMERIC, "')}" NUMERIC )`
        ];
        return returnValue.join("\n");
    }
}
