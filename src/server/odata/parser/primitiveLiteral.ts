/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-namespace */
import Utils from "./utils";
import Lexer from "./lexer";
import NameOrIdentifier from "./nameOrIdentifier";

namespace PrimitiveLiteral {
    export function nullValue(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        if (Utils.equals(value, index, "null")) return Lexer.tokenize(value, index, index + 4, "null", Lexer.TokenType.Literal);
    }
    export function booleanValue(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        if (Utils.equals(value, index, "true")) return Lexer.tokenize(value, index, index + 4, "Edm.Boolean", Lexer.TokenType.Literal);
        if (Utils.equals(value, index, "false")) return Lexer.tokenize(value, index, index + 5, "Edm.Boolean", Lexer.TokenType.Literal);
    }
    export function guidValue(value: any, index: number): Lexer.Token | undefined {
        if (
            Utils.required(value, index, Lexer.HEEDING, 8, 8) &&
            value[index + 8] === 0x2d &&
            Utils.required(value, index + 9, Lexer.HEEDING, 4, 4) &&
            value[index + 13] === 0x2d &&
            Utils.required(value, index + 14, Lexer.HEEDING, 4, 4) &&
            value[index + 18] === 0x2d &&
            Utils.required(value, index + 19, Lexer.HEEDING, 4, 4) &&
            value[index + 23] === 0x2d &&
            Utils.required(value, index + 24, Lexer.HEEDING, 12)
        )
            return Lexer.tokenize(value, index, index + 36, "Edm.Guid", Lexer.TokenType.Literal);
    }
    export function lbyteValue(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        const start = index;
        const sign = Lexer.SIGN(value, index);
        if (sign) index = sign;

        const next = Utils.required(value, index, Lexer.DIGIT, 1, 3);
        if (next) {
            if (Lexer.DIGIT(value[next])) return;
            const val = parseInt(Utils.stringify(value, start, next), 10);
            if (val >= -128 && val <= 127) return Lexer.tokenize(value, start, next, "Edm.SByte", Lexer.TokenType.Literal);
        }
    }
    export function byteValue(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        const next = Utils.required(value, index, Lexer.DIGIT, 1, 3);
        if (next) {
            if (Lexer.DIGIT(value[next])) return;
            const val = parseInt(Utils.stringify(value, index, next), 10);
            if (val >= 0 && val <= 255) return Lexer.tokenize(value, index, next, "Edm.Byte", Lexer.TokenType.Literal);
        }
    }
    export function int16Value(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        const start = index;
        const sign = Lexer.SIGN(value, index);
        if (sign) index = sign;

        const next = Utils.required(value, index, Lexer.DIGIT, 1, 5);
        if (next) {
            if (Lexer.DIGIT(value[next])) return;
            const val = parseInt(Utils.stringify(value, start, next), 10);
            if (val >= -32768 && val <= 32767) return Lexer.tokenize(value, start, next, "Edm.Int16", Lexer.TokenType.Literal);
        }
    }
    export function int32Value(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        const start = index;
        const sign = Lexer.SIGN(value, index);
        if (sign) index = sign;

        const next = Utils.required(value, index, Lexer.DIGIT, 1, 10);
        if (next) {
            if (Lexer.DIGIT(value[next])) return;
            const val = parseInt(Utils.stringify(value, start, next), 10);
            if (val >= -2147483648 && val <= 2147483647) return Lexer.tokenize(value, start, next, "Edm.Int32", Lexer.TokenType.Literal);
        }
    }
    export function int64Value(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        const start = index;
        const sign = Lexer.SIGN(value, index);
        if (sign) index = sign;

        const next = Utils.required(value, index, Lexer.DIGIT, 1, 19);
        if (next) {
            if (Lexer.DIGIT(value[next])) return;
            const val = Utils.stringify(value, index, next);
            if (val >= "0" && val <= (value[start] === 0x2d ? "9223372036854775808" : "9223372036854775807"))
                return Lexer.tokenize(value, start, next, "Edm.Int64", Lexer.TokenType.Literal);
        }
    }
    export function decimalValue(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        const start = index;
        const sign = Lexer.SIGN(value, index);
        if (sign) index = sign;

        const intNext = Utils.required(value, index, Lexer.DIGIT, 1);
        if (!intNext) return;

        let end = intNext;
        if (value[intNext] === 0x2e) {
            end = Utils.required(value, intNext + 1, Lexer.DIGIT, 1);
            if (!end || end === intNext + 1) return;
        } else return;

        // TODO: detect only decimal value, no double/single detection here
        if (value[end] === 0x65) return;

        return Lexer.tokenize(value, start, end, "Edm.Decimal", Lexer.TokenType.Literal);
    }
    export function doubleValue(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        const start = index;
        let end = index;
        const nanInfLen = Lexer.nanInfinity(value, index);
        if (nanInfLen) {
            end += nanInfLen;
        } else {
            // TODO: use decimalValue function
            // var token = decimalValue(value, index);
            const sign = Lexer.SIGN(value, index);
            if (sign) index = sign;

            const intNext = Utils.required(value, index, Lexer.DIGIT, 1);
            if (!intNext) return;

            let decimalNext = intNext;
            if (value[intNext] === 0x2e) {
                decimalNext = Utils.required(value, intNext + 1, Lexer.DIGIT, 1);
                if (decimalNext === intNext + 1) return;
            } else return;

            if (value[decimalNext] === 0x65) {
                let next = decimalNext + 1;
                const sign = Lexer.SIGN(value, next);
                if (sign) next = sign;

                const digitNext = Utils.required(value, next, Lexer.DIGIT, 1);
                if (digitNext) {
                    end = digitNext;
                }
            } else end = decimalNext;
        }

        return Lexer.tokenize(value, start, end, "Edm.Double", Lexer.TokenType.Literal);
    }
    export function singleValue(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        const token = PrimitiveLiteral.doubleValue(value, index);
        if (token) {
            token.value = "Edm.Single";
        }
        return token;
    }
    export function stringValue(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        const start = index;
        let quote = Lexer.SQUAT(value, start);
        if (quote) {
            index = quote;
            while (index < value.length) {
                quote = Lexer.SQUAT(value, index);
                if (quote) {
                    index = quote;
                    quote = Lexer.SQUAT(value, index);
                    if (!quote) {
                        const close = Lexer.CLOSE(value, index);
                        const comma = Lexer.COMMA(value, index);
                        const amp = value[index] === 0x26;
                        const temp = Lexer.pcarNoSQUOTE(value, index);
                        if (typeof temp == "number" && temp > index && !amp && !close && !comma && Lexer.RWS(value, index) === index) return;
                        break;
                    } else {
                        index = quote;
                    }
                } else {
                    const temp = Lexer.RWS(value, index);
                    const temp2 = Lexer.pcarNoSQUOTE(value, index);
                    if (temp != undefined && temp2 != undefined) {
                        const nextIndex = Math.max(temp, temp2);
                        if (nextIndex === index) return;
                        index = nextIndex;
                    }
                }
            }

            quote = Lexer.SQUAT(value, index - 1) || Lexer.SQUAT(value, index - 3);
            if (!quote) return;
            index = quote;

            return Lexer.tokenize(value, start, index, "Edm.String", Lexer.TokenType.Literal);
        }
    }
    export function durationValue(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        if (!Utils.equals(value, index, "duration")) return;
        const start = index;
        index += 8;

        let square = Lexer.SQUAT(value, index);
        if (!square) return;
        index = square;

        const sign = Lexer.SIGN(value, index);
        if (sign) index = sign;

        if (value[index] !== 0x50) return;
        index++;
        const dayNext = Utils.required(value, index, Lexer.DIGIT, 1);
        if (dayNext === index && value[index + 1] !== 0x54) return;
        index = dayNext;
        if (value[index] === 0x44) index++;
        let end = index;
        if (value[index] === 0x54) {
            index++;
            const parseTimeFn = function (): any {
                const quote = Lexer.SQUAT(value, index);
                if (quote) return index;
                const digitNext = Utils.required(value, index, Lexer.DIGIT, 1);
                if (digitNext === index) return;
                index = digitNext;
                if (value[index] === 0x53) {
                    end = index + 1;
                    return end;
                } else if (value[index] === 0x2e) {
                    index++;
                    const fractionalSecondsNext = Utils.required(value, index, Lexer.DIGIT, 1);
                    if (fractionalSecondsNext === index || value[fractionalSecondsNext] !== 0x53) return;
                    end = fractionalSecondsNext + 1;
                    return end;
                } else if (value[index] === 0x48) {
                    index++;
                    end = index;
                    return parseTimeFn();
                } else if (value[index] === 0x4d) {
                    index++;
                    end = index;
                    return parseTimeFn();
                }
            };
            const next = parseTimeFn();
            if (!next) return;
        }

        square = Lexer.SQUAT(value, end);
        if (!square) return;
        end = square;

        return Lexer.tokenize(value, start, end, "Edm.Duration", Lexer.TokenType.Literal);
    }
    export function binaryValue(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        const start = index;
        if (!Utils.equals(value, index, "binary")) return;
        index += 6;

        let squat = Lexer.SQUAT(value, index);
        if (!squat) return;
        index = squat;

        // const valStart = index;
        while (index < value.length && !(squat = Lexer.SQUAT(value, index))) {
            const temp = Lexer.base64b16(value, index);
            const temp2 = Lexer.base64b8(value, index);
            if (temp && temp2) {
                const end = Math.max(temp, temp2);
                if (end > index) index = end;
                else if (
                    Lexer.base64char(value[index]) &&
                    Lexer.base64char(value[index + 1]) &&
                    Lexer.base64char(value[index + 2]) &&
                    Lexer.base64char(value[index + 3])
                )
                    index += 4;
                else index++;
            }
        }
        if (squat) index = squat;

        return Lexer.tokenize(value, start, index, "Edm.Binary", Lexer.TokenType.Literal);
    }
    export function dateValue(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        const yearNext = Lexer.year(value, index);
        if (!yearNext) return;
        if (yearNext === index || value[yearNext] !== 0x2d) return;
        const monthNext = Lexer.month(value, yearNext + 1);
        if (!monthNext) return;
        if (monthNext === yearNext + 1 || value[monthNext] !== 0x2d) return;
        const dayNext = Lexer.day(value, monthNext + 1);
        // TODO: join dateValue and dateTimeOffsetValue for optimalization
        if (!dayNext) return;
        if (dayNext === monthNext + 1 || value[dayNext] === 0x54) return;
        return Lexer.tokenize(value, index, dayNext, "Edm.Date", Lexer.TokenType.Literal);
    }
    export function dateTimeOffsetValue(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        const yearNext = Lexer.year(value, index);
        if (!yearNext) return;
        if (yearNext === index || value[yearNext] !== 0x2d) return;
        const monthNext = Lexer.month(value, yearNext + 1);
        if (!monthNext) return;
        if (monthNext === yearNext + 1 || value[monthNext] !== 0x2d) return;
        const dayNext = Lexer.day(value, monthNext + 1);
        if (!dayNext) return;
        if (dayNext === monthNext + 1 || value[dayNext] !== 0x54) return;
        const hourNext = Lexer.hour(value, dayNext + 1);
        if (!hourNext) return;
        let colon = Lexer.COLON(value, hourNext);
        if (hourNext === colon || !colon) return;
        const minuteNext = Lexer.minute(value, hourNext + 1);
        if (minuteNext === hourNext + 1) return;
        if (!minuteNext) return;

        let end = minuteNext;
        colon = Lexer.COLON(value, minuteNext);
        if (colon) {
            const secondNext = Lexer.second(value, colon);
            if (secondNext) {
                if (secondNext === colon) return;
                if (value[secondNext] === 0x2e) {
                    const fractionalSecondsNext = Lexer.fractionalSeconds(value, secondNext + 1);
                    if (fractionalSecondsNext === secondNext + 1) return;
                    if (fractionalSecondsNext) end = fractionalSecondsNext;
                } else end = secondNext;
            }
        }

        const sign = Lexer.SIGN(value, end);
        if (value[end] === 0x5a) {
            end++;
        } else if (sign) {
            const zHourNext = Lexer.hour(value, sign);
            if (!zHourNext) return;

            const colon = Lexer.COLON(value, zHourNext);
            if (zHourNext === sign || !colon) return;
            const zMinuteNext = Lexer.minute(value, colon);
            if (!zMinuteNext || zMinuteNext === colon) return;
            end = zMinuteNext;
        } else return;

        return Lexer.tokenize(value, index, end, "Edm.DateTimeOffset", Lexer.TokenType.Literal);
    }
    export function timeOfDayValue(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        const hourNext = Lexer.hour(value, index);
        if (!hourNext) return;

        let colon = Lexer.COLON(value, hourNext);
        if (hourNext === index || !colon) return;
        const minuteNext = Lexer.minute(value, colon);
        if (!minuteNext || minuteNext === colon) return;

        let end = minuteNext;
        colon = Lexer.COLON(value, minuteNext);
        if (colon) {
            const secondNext = Lexer.second(value, colon);
            if (!secondNext || secondNext === colon) return;

            if (value[secondNext] === 0x2e) {
                const fractionalSecondsNext = Lexer.fractionalSeconds(value, secondNext + 1);
                if (!fractionalSecondsNext || fractionalSecondsNext === secondNext + 1) return;
                end = fractionalSecondsNext;
            } else end = secondNext;
        }

        return Lexer.tokenize(value, index, end, "Edm.TimeOfDay", Lexer.TokenType.Literal);
    }

    // geography and geometry literals
    export function positionLiteral(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        const longitude = PrimitiveLiteral.doubleValue(value, index);
        if (!longitude) return;

        const next = Lexer.RWS(value, longitude.next);
        if (!next || next === longitude.next) return;

        const latitude = PrimitiveLiteral.doubleValue(value, next);
        if (!latitude) return;

        return Lexer.tokenize(value, index, latitude.next, { longitude, latitude }, Lexer.TokenType.Literal);
    }
    export function pointData(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        const open = Lexer.OPEN(value, index);
        if (!open) return;
        const start = index;
        index = open;

        const position = PrimitiveLiteral.positionLiteral(value, index);
        if (!position) return;
        index = position.next;

        const close = Lexer.CLOSE(value, index);
        if (!close) return;
        index = close;

        return Lexer.tokenize(value, start, index, position, Lexer.TokenType.Literal);
    }
    export function lineStringData(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.multiGeoLiteralFactory(value, index, "", PrimitiveLiteral.positionLiteral);
    }
    export function ringLiteral(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.multiGeoLiteralFactory(value, index, "", PrimitiveLiteral.positionLiteral);
        // Within each ringLiteral, the first and last positionLiteral elements MUST be an exact syntactic match to each other.
        // Within the polygonData, the ringLiterals MUST specify their points in appropriate winding order.
        // In order of traversal, points to the left side of the ring are interpreted as being in the polygon.
    }
    export function polygonData(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.multiGeoLiteralFactory(value, index, "", PrimitiveLiteral.ringLiteral);
    }
    export function sridLiteral(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        if (!Utils.equals(value, index, "SRID")) return;
        const start = index;
        index += 4;

        const eq = Lexer.EQ(value, index);
        if (!eq) return;
        index++;

        const digit = Utils.required(value, index, Lexer.DIGIT, 1, 5);
        if (!digit) return;
        index = digit;

        const semi = Lexer.SEMI(value, index);
        if (!semi) return;
        index = semi;

        return Lexer.tokenize(value, start, index, "SRID", Lexer.TokenType.Literal);
    }
    export function pointLiteral(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        if ( !( Utils.equals(value, index, 'Point') || Utils.equals(value, index, 'POINT') ) ) return;
        const start = index;
        index += 5;
        const data = PrimitiveLiteral.pointData(value, index);
        if (!data) return;

        return Lexer.tokenize(value, start, data.next, data, Lexer.TokenType.Literal);
    }
    export function polygonLiteral(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        if ( !( Utils.equals(value, index, 'Polygon') || Utils.equals(value, index, 'POLYGON') ) ) return;
        const start = index;
        index += 7;

        const data = PrimitiveLiteral.polygonData(value, index);
        if (!data) return;

        return Lexer.tokenize(value, start, data.next, data, Lexer.TokenType.Literal);
    }
    export function collectionLiteral(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.multiGeoLiteralFactory(value, index, "Collection", PrimitiveLiteral.geoLiteral);
    }
    export function lineStringLiteral(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        if ( !( Utils.equals(value, index, 'LineString') || Utils.equals(value, index, 'LINESTRING') ) ) return;
        const start = index;
        index += 10;

        const data = PrimitiveLiteral.lineStringData(value, index);
        if (!data) return;
        index = data.next;

        return Lexer.tokenize(value, start, index, data, Lexer.TokenType.Literal);
    }
    export function multiLineStringLiteral(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.multiGeoLiteralOptionalFactory(value, index, "MultiLineString", PrimitiveLiteral.lineStringData);
    }
    export function multiPointLiteral(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.multiGeoLiteralOptionalFactory(value, index, "MultiPoint", PrimitiveLiteral.pointData);
    }
    export function multiPolygonLiteral(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.multiGeoLiteralOptionalFactory(value, index, "MultiPolygon", PrimitiveLiteral.polygonData);
    }
    export function multiGeoLiteralFactory(value: Utils.SourceArray, index: number, prefix: string, itemLiteral: Function): Lexer.Token | undefined {
        if (!Utils.equals(value, index, prefix + "(")) return;
        const start = index;
        index += prefix.length + 1;

        const items = [];
        let geo = itemLiteral(value, index);
        if (!geo) return;
        index = geo.next;

        while (geo) {
            items.push(geo);

            const close = Lexer.CLOSE(value, index);
            if (close) {
                index = close;
                break;
            }

            const comma = Lexer.COMMA(value, index);
            if (!comma) return;
            index = comma;

            geo = itemLiteral(value, index);
            if (!geo) return;
            index = geo.next;
        }

        return Lexer.tokenize(value, start, index, { items }, Lexer.TokenType.Literal);
    }
    export function multiGeoLiteralOptionalFactory(value: Utils.SourceArray, index: number, prefix: string, itemLiteral: Function): Lexer.Token | undefined {
        if (!Utils.equals(value, index, prefix + "(")) return;
        const start = index;
        index += prefix.length + 1;

        const items = [];
        let close = Lexer.CLOSE(value, index);
        if (!close) {
            let geo = itemLiteral(value, index);
            if (!geo) return;
            index = geo.next;

            while (geo) {
                items.push(geo);

                close = Lexer.CLOSE(value, index);
                if (close) {
                    index = close;
                    break;
                }

                const comma = Lexer.COMMA(value, index);
                if (!comma) return;
                index = comma;

                geo = itemLiteral(value, index);
                if (!geo) return;
                index = geo.next;
            }
        } else index++;

        return Lexer.tokenize(value, start, index, { items }, Lexer.TokenType.Literal);
    }
    export function geoLiteral(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return (
            PrimitiveLiteral.collectionLiteral(value, index) ||
            PrimitiveLiteral.lineStringLiteral(value, index) ||
            PrimitiveLiteral.multiPointLiteral(value, index) ||
            PrimitiveLiteral.multiLineStringLiteral(value, index) ||
            PrimitiveLiteral.multiPolygonLiteral(value, index) ||
            PrimitiveLiteral.pointLiteral(value, index) ||
            PrimitiveLiteral.polygonLiteral(value, index)
        );
    }
    export function fullPointLiteral(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.fullGeoLiteralFactory(value, index, PrimitiveLiteral.pointLiteral);
    }
    export function fullCollectionLiteral(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.fullGeoLiteralFactory(value, index, PrimitiveLiteral.collectionLiteral);
    }
    export function fullLineStringLiteral(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.fullGeoLiteralFactory(value, index, PrimitiveLiteral.lineStringLiteral);
    }
    export function fullMultiLineStringLiteral(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.fullGeoLiteralFactory(value, index, PrimitiveLiteral.multiLineStringLiteral);
    }
    export function fullMultiPointLiteral(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.fullGeoLiteralFactory(value, index, PrimitiveLiteral.multiPointLiteral);
    }
    export function fullMultiPolygonLiteral(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.fullGeoLiteralFactory(value, index, PrimitiveLiteral.multiPolygonLiteral);
    }
    export function fullPolygonLiteral(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.fullGeoLiteralFactory(value, index, PrimitiveLiteral.polygonLiteral);
    }
    export function fullGeoLiteralFactory(value: Utils.SourceArray, index: number, literal: Function): Lexer.Token | undefined {
        const srid = PrimitiveLiteral.sridLiteral(value, index);
        if (!srid) return;

        const token = literal(value, srid.next);
        if (!token) return;

        return Lexer.tokenize(value, index, token.next, { srid, value: token }, Lexer.TokenType.Literal);
    }

    export function geographyCollection(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        const prefix = Lexer.geographyPrefix(value, index);
        if (!prefix || prefix === index) return;
        const start = index;
        index = prefix;

        let quoted = Lexer.SQUAT(value, index);
        if (!quoted) return;
        index = quoted;

        const point = PrimitiveLiteral.fullCollectionLiteral(value, index);
        if (!point) return;
        index = point.next;

        quoted = Lexer.SQUAT(value, index);
        if (!quoted) return;
        index = quoted;

        return Lexer.tokenize(value, start, index, "Edm.GeographyCollection", Lexer.TokenType.Literal);
    }
    export function geographyLineString(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.geoLiteralFactory(value, index, "Edm.GeographyLineString", Lexer.geographyPrefix, PrimitiveLiteral.fullLineStringLiteral);
    }
    export function geographyMultiLineString(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.geoLiteralFactory(
            value,
            index,
            "Edm.GeographyMultiLineString",
            Lexer.geographyPrefix,
            PrimitiveLiteral.fullMultiLineStringLiteral
        );
    }
    export function geographyMultiPoint(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return geoLiteralFactory(value, index, 'Edm.GeographyPoint', Lexer.geographyPrefix, fullPointLiteral)
            || geoLiteralFactory(value, index, 'Edm.GeographyPoint', Lexer.geographyPrefix, pointLiteral);
    }
    export function geographyMultiPolygon(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.geoLiteralFactory(value, index, "Edm.GeographyMultiPolygon", Lexer.geographyPrefix, PrimitiveLiteral.fullMultiPolygonLiteral);
    }
    export function geographyPoint(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.geoLiteralFactory(value, index, "Edm.GeographyPoint", Lexer.geographyPrefix, PrimitiveLiteral.fullPointLiteral);
    }
    export function geographyPolygon(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.geoLiteralFactory(value, index, "Edm.GeographyPolygon", Lexer.geographyPrefix, PrimitiveLiteral.fullPolygonLiteral);
    }
    export function geometryCollection(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.geoLiteralFactory(value, index, "Edm.GeometryCollection", Lexer.geometryPrefix, PrimitiveLiteral.fullCollectionLiteral);
    }
    export function geometryLineString(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.geoLiteralFactory(value, index, "Edm.GeometryLineString", Lexer.geometryPrefix, PrimitiveLiteral.fullLineStringLiteral);
    }
    export function geometryMultiLineString(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.geoLiteralFactory(
            value,
            index,
            "Edm.GeometryMultiLineString",
            Lexer.geometryPrefix,
            PrimitiveLiteral.fullMultiLineStringLiteral
        );
    }
    export function geometryMultiPoint(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.geoLiteralFactory(value, index, "Edm.GeometryMultiPoint", Lexer.geometryPrefix, PrimitiveLiteral.fullMultiPointLiteral);
    }
    export function geometryMultiPolygon(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.geoLiteralFactory(value, index, "Edm.GeometryMultiPolygon", Lexer.geometryPrefix, PrimitiveLiteral.fullMultiPolygonLiteral);
    }
    export function geometryPoint(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.geoLiteralFactory(value, index, "Edm.GeometryPoint", Lexer.geometryPrefix, PrimitiveLiteral.fullPointLiteral);
    }
    export function geometryPolygon(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return PrimitiveLiteral.geoLiteralFactory(value, index, "Edm.GeometryPolygon", Lexer.geometryPrefix, PrimitiveLiteral.fullPolygonLiteral);
    }
    export function geoLiteralFactory(value: Utils.SourceArray, index: number, type: string, prefix: Function, literal: Function): Lexer.Token | undefined {
        const prefixNext = prefix(value, index);
        if (prefixNext === index) return;
        const start = index;
        index = prefixNext;

        let quote = Lexer.SQUAT(value, index);
        if (!quote) return;
        index = quote;

        const data = literal(value, index);
        if (!data) return;
        index = data.next;

        quote = Lexer.SQUAT(value, index);
        if (!quote) return;
        index = quote;

        return Lexer.tokenize(value, start, index, type, Lexer.TokenType.Literal);
    }

    export function primitiveLiteral(value: Utils.SourceArray, index: number): Lexer.Token | undefined {
        return (
            PrimitiveLiteral.nullValue(value, index) ||
            PrimitiveLiteral.booleanValue(value, index) ||
            PrimitiveLiteral.guidValue(value, index) ||
            PrimitiveLiteral.dateValue(value, index) ||
            PrimitiveLiteral.dateTimeOffsetValue(value, index) ||
            PrimitiveLiteral.timeOfDayValue(value, index) ||
            PrimitiveLiteral.decimalValue(value, index) ||
            PrimitiveLiteral.doubleValue(value, index) ||
            PrimitiveLiteral.singleValue(value, index) ||
            PrimitiveLiteral.lbyteValue(value, index) ||
            PrimitiveLiteral.byteValue(value, index) ||
            PrimitiveLiteral.int16Value(value, index) ||
            PrimitiveLiteral.int32Value(value, index) ||
            PrimitiveLiteral.int64Value(value, index) ||
            PrimitiveLiteral.stringValue(value, index) ||
            PrimitiveLiteral.durationValue(value, index) ||
            PrimitiveLiteral.binaryValue(value, index) ||
            NameOrIdentifier.enumeration(value, index) ||
            PrimitiveLiteral.geographyCollection(value, index) ||
            PrimitiveLiteral.geographyLineString(value, index) ||
            PrimitiveLiteral.geographyMultiLineString(value, index) ||
            PrimitiveLiteral.geographyMultiPoint(value, index) ||
            PrimitiveLiteral.geographyMultiPolygon(value, index) ||
            PrimitiveLiteral.geographyPoint(value, index) ||
            PrimitiveLiteral.geographyPolygon(value, index) ||
            PrimitiveLiteral.geometryCollection(value, index) ||
            PrimitiveLiteral.geometryLineString(value, index) ||
            PrimitiveLiteral.geometryMultiLineString(value, index) ||
            PrimitiveLiteral.geometryMultiPoint(value, index) ||
            PrimitiveLiteral.geometryMultiPolygon(value, index) ||
            PrimitiveLiteral.geometryPoint(value, index) ||
            PrimitiveLiteral.geometryPolygon(value, index)
        );
    }
}

export default PrimitiveLiteral;
