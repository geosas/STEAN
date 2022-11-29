/**
 * decodeRHF1S001.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */



import { Knex } from "knex";
import { _DBDATAS } from "../db/constants";
import { logDebug } from "../logger";
import { IKeyString } from "../types";
import { IDecoderInfos, IDecoderInfosMessage } from "./types";
import util from "util";

export const nomenclature: IKeyString = {
    "voltage": "battery voltage",
    "period": "periods",
    "0110": "air temperature",
    "0210": "air humidity",
    "0310": "light intensity",
    "0410": "humidity",
    "0510": "barometric pressure",
    "0610": "soil temperature",
    "0700": "battery",
    "0710": "soil moisture"
};

export const decodeLoraPayload = async (knexInstance: Knex | Knex.Transaction, loraDeveui: string, input: string): Promise<IKeyString> => {
    const returnValue: IKeyString = {};
    const temp = decoder(input.match(/.{1,2}/g));    
    if (temp.valid == true) {
        temp.messages.forEach((elem: IDecoderInfosMessage) => {
            if (elem.measurementName) returnValue[elem.measurementName] = elem.measurementValue ? elem.measurementValue?.toString() : "null";
        });
    } else {
        return await knexInstance(_DBDATAS.Decoders.table).select("code").whereRaw(`id = (SELECT "decoder_id" FROM "${_DBDATAS.Loras.table}" WHERE "deveui" = '${loraDeveui}')`).first().then((res: any) => {
            try {
                const F = new Function (String(res.code).replace("DATAINPUT", input).replace("NOMENCLATURE", util.inspect(nomenclature, { showHidden: false, depth: null})));
                return F();
            } catch (error) {
                logDebug(error);           
            }
        });
    }
    return returnValue;
};
    
    const decoder = (bytes: any): IDecoderInfos => {
        // init
        const bytesString = bytes2HexString(bytes).toLocaleUpperCase();
        const decoded: IDecoderInfos = {
            // valid
            valid: true,
            err: 0,
            // bytes
            payload: bytesString,
            // messages array
            messages: []
        };
        
        // CRC check
        if (!crc16Check(bytesString)) {
            decoded["valid"] = false;
            decoded["err"] = -1; // "crc check fail."
            return decoded;
        }
        
        // Length Check
        if ((bytesString.length / 2 - 2) % 7 !== 0) {
            decoded["valid"] = false;
            decoded["err"] = -2; // "length check fail."
            return decoded;
    }
    
    // Cache sensor id
    let sensorEuiLowBytes;
    let sensorEuiHighBytes;
    
    // Handle each frame
    const frameArray = divideBy7Bytes(bytesString);
    for (let forFrame = 0; forFrame < frameArray.length; forFrame++) {
        const frame = frameArray[forFrame];
        // Extract key parameters
        const dataIDHex = frame.substring(2, 6);
        const dataIDBase10 = strTo10SysNub(dataIDHex);
        const dataValue = frame.substring(6, 14);
        const realDataValue = isSpecialDataId(dataIDBase10) ? ttnDataSpecialFormat(dataIDBase10, dataValue) : ttnDataFormat(dataValue);
        
        if (checkDataIdIsMeasureUpload(dataIDBase10)) {
            // if telemetry.
            decoded.messages.push({
                type: "report_telemetry",
                measurementName: nomenclature[dataIDHex],
                measurementId: dataIDBase10,
                measurementValue: realDataValue
            });
        } else if (isSpecialDataId(dataIDBase10) || dataIDBase10 === 5 || dataIDBase10 === 6) {
            // if special order, except "report_sensor_id".
            switch (dataIDBase10) {
                case 0x00:
                    // node version
                    const versionData = sensorAttrForVersion(realDataValue);
                    decoded.messages.push({
                        type: "upload_version",
                        hardwareVersion: versionData.ver_hardware,
                        softwareVersion: versionData.ver_software
                    });
                    break;
                    case 1:
                        // sensor version
                        break;
                        case 2:
                            // sensor eui, low bytes
                            sensorEuiLowBytes = realDataValue;
                            break;
                            case 3:
                                // sensor eui, high bytes
                                sensorEuiHighBytes = realDataValue;
                                break;
                                case 7:
                                    // battery power && interval
                    if (realDataValue)
                    decoded.messages.push(
                        {
                            type: "upload_battery",
                            measurementName: `${nomenclature[dataIDHex]} power`,
                            measurementId: dataIDBase10,
                            measurementValue: realDataValue["power"]
                        },
                        {
                            type: "upload_interval",
                            measurementName: `${nomenclature[dataIDHex]} interval`,
                            measurementId: dataIDBase10,
                            measurementValue: parseInt(realDataValue["interval"]) * 60
                        }
                        );
                        break;
                        case 0x120:
                            // remove sensor
                            decoded.messages.push({
                                type: "report_remove_sensor",
                                measurementId: 1
                            });
                            break;
                            default:
                                break;
                            }
                        } else {
                            decoded.messages.push({
                                type: "unknown_message",
                                measurementId: dataIDBase10,
                                measurementValue: dataValue
                            });
                        }
    }
    
    // if the complete id received, as "upload_sensor_id"
    if (sensorEuiHighBytes && sensorEuiLowBytes) {
        decoded.messages.unshift({
            type: "upload_sensor_id",
            measurementId: 1,
            measurementName: `${sensorEuiHighBytes}${sensorEuiLowBytes}`
        });
    }
    
    // return
    return decoded;
};

function crc16Check(data: any) {
    const crc16tab = [
        0x0000, 0x1189, 0x2312, 0x329b, 0x4624, 0x57ad, 0x6536, 0x74bf, 0x8c48, 0x9dc1, 0xaf5a, 0xbed3, 0xca6c, 0xdbe5, 0xe97e, 0xf8f7, 0x1081, 0x0108, 0x3393,
        0x221a, 0x56a5, 0x472c, 0x75b7, 0x643e, 0x9cc9, 0x8d40, 0xbfdb, 0xae52, 0xdaed, 0xcb64, 0xf9ff, 0xe876, 0x2102, 0x308b, 0x0210, 0x1399, 0x6726, 0x76af,
        0x4434, 0x55bd, 0xad4a, 0xbcc3, 0x8e58, 0x9fd1, 0xeb6e, 0xfae7, 0xc87c, 0xd9f5, 0x3183, 0x200a, 0x1291, 0x0318, 0x77a7, 0x662e, 0x54b5, 0x453c, 0xbdcb,
        0xac42, 0x9ed9, 0x8f50, 0xfbef, 0xea66, 0xd8fd, 0xc974, 0x4204, 0x538d, 0x6116, 0x709f, 0x0420, 0x15a9, 0x2732, 0x36bb, 0xce4c, 0xdfc5, 0xed5e, 0xfcd7,
        0x8868, 0x99e1, 0xab7a, 0xbaf3, 0x5285, 0x430c, 0x7197, 0x601e, 0x14a1, 0x0528, 0x37b3, 0x263a, 0xdecd, 0xcf44, 0xfddf, 0xec56, 0x98e9, 0x8960, 0xbbfb,
        0xaa72, 0x6306, 0x728f, 0x4014, 0x519d, 0x2522, 0x34ab, 0x0630, 0x17b9, 0xef4e, 0xfec7, 0xcc5c, 0xddd5, 0xa96a, 0xb8e3, 0x8a78, 0x9bf1, 0x7387, 0x620e,
        0x5095, 0x411c, 0x35a3, 0x242a, 0x16b1, 0x0738, 0xffcf, 0xee46, 0xdcdd, 0xcd54, 0xb9eb, 0xa862, 0x9af9, 0x8b70, 0x8408, 0x9581, 0xa71a, 0xb693, 0xc22c,
        0xd3a5, 0xe13e, 0xf0b7, 0x0840, 0x19c9, 0x2b52, 0x3adb, 0x4e64, 0x5fed, 0x6d76, 0x7cff, 0x9489, 0x8500, 0xb79b, 0xa612, 0xd2ad, 0xc324, 0xf1bf, 0xe036,
        0x18c1, 0x0948, 0x3bd3, 0x2a5a, 0x5ee5, 0x4f6c, 0x7df7, 0x6c7e, 0xa50a, 0xb483, 0x8618, 0x9791, 0xe32e, 0xf2a7, 0xc03c, 0xd1b5, 0x2942, 0x38cb, 0x0a50,
        0x1bd9, 0x6f66, 0x7eef, 0x4c74, 0x5dfd, 0xb58b, 0xa402, 0x9699, 0x8710, 0xf3af, 0xe226, 0xd0bd, 0xc134, 0x39c3, 0x284a, 0x1ad1, 0x0b58, 0x7fe7, 0x6e6e,
        0x5cf5, 0x4d7c, 0xc60c, 0xd785, 0xe51e, 0xf497, 0x8028, 0x91a1, 0xa33a, 0xb2b3, 0x4a44, 0x5bcd, 0x6956, 0x78df, 0x0c60, 0x1de9, 0x2f72, 0x3efb, 0xd68d,
        0xc704, 0xf59f, 0xe416, 0x90a9, 0x8120, 0xb3bb, 0xa232, 0x5ac5, 0x4b4c, 0x79d7, 0x685e, 0x1ce1, 0x0d68, 0x3ff3, 0x2e7a, 0xe70e, 0xf687, 0xc41c, 0xd595,
        0xa12a, 0xb0a3, 0x8238, 0x93b1, 0x6b46, 0x7acf, 0x4854, 0x59dd, 0x2d62, 0x3ceb, 0x0e70, 0x1ff9, 0xf78f, 0xe606, 0xd49d, 0xc514, 0xb1ab, 0xa022, 0x92b9,
        0x8330, 0x7bc7, 0x6a4e, 0x58d5, 0x495c, 0x3de3, 0x2c6a, 0x1ef1, 0x0f78
    ];
    let returnValue = false;
    let crc = 0;
    const dataArray = [];
    for (let i = 0; i < data.length; i += 2) {
        dataArray.push(data.substring(i, i + 2));
    }
    
    for (let j = 0; j < dataArray.length; j++) {
        const item = dataArray[j];
        crc = (crc >> 8) ^ crc16tab[(crc ^ parseInt(item, 16)) & 0xff];
    }
    if (crc === 0) {
        returnValue = true;
    }
    return returnValue;
}

// util
function bytes2HexString(arrBytes: any) {
    let str = "";
    for (let i = 0; i < arrBytes.length; i++) {
        let tmp;
        const num = arrBytes[i];
        if (num < 0) {
            tmp = (255 + num + 1).toString(16);
        } else {
            tmp = num.toString(16);
        }
        if (tmp.length === 1) {
            tmp = "0" + tmp;
        }
        str += tmp;
    }
    return str;
}

// util
function divideBy7Bytes(str: any) {
    const frameArray = [];
    for (let i = 0; i < str.length - 4; i += 14) {
        const data = str.substring(i, i + 14);
        frameArray.push(data);
    }
    return frameArray;
}

// util
function littleEndianTransform(data: any) {
    const dataArray = [];
    for (let i = 0; i < data.length; i += 2) {
        dataArray.push(data.substring(i, i + 2));
    }
    dataArray.reverse();
    return dataArray;
}

// util
function strTo10SysNub(str: string): number {
    const arr = littleEndianTransform(str);
    return parseInt(arr.toString().replace(/,/g, ""), 16);
}

function checkDataIdIsMeasureUpload(dataId: number | string): boolean {
    const temp: number = typeof dataId == "string" ? parseInt(dataId) : dataId;
    return temp > 4096;
}

function isSpecialDataId(dataID: number): boolean {
    switch (dataID) {
        case 0:
            case 1:
                case 2:
                    case 3:
                        case 4:
                            case 7:
                                case 0x120:
                                    return true;
                                    default:
                                        return false;
                                    }
                                }
                                
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                function ttnDataSpecialFormat(dataId: number, str: string): any {
                                    const strReverse = littleEndianTransform(str);
                                    if (dataId === 2 || dataId === 3) {
                                        return strReverse.join("");
                                    }
                                    
                                    // handle unsigned number
                                    const str2 = toBinary(strReverse);
                                    
                                    const dataArray = [];
                                    switch (dataId) {
                                        case 0: // DATA_BOARD_VERSION
                                        case 1: // DATA_SENSOR_VERSION
                                        // Using point segmentation
                                        for (let k = 0; k < str2.length; k += 16) {
                let tmp146 = str2.substring(k, k + 16);
                tmp146 = (parseInt(tmp146.substring(0, 8), 2) || 0) + "." + (parseInt(tmp146.substring(8, 16), 2) || 0);
                dataArray.push(tmp146);
            }
            return dataArray.join(",");
            case 4:
            for (let i = 0; i < str2.length; i += 8) {
                const item = parseInt(str2.substring(i, i + 8), 2);
                dataArray.push(item < 10 ? `0${item.toString()}` : item.toString());
            }
            return dataArray.join("");
            case 7:
                // battery && interval
            return {
                interval: parseInt(str2.substr(0, 16), 2),
                power: parseInt(str2.substr(-16, 16), 2)
            };
        }
    }
    
    function ttnDataFormat(str: string): number {
        const strReverse = littleEndianTransform(str);
        const str2 = toBinary(strReverse);
        if (str2.substring(0, 1) === "1") {
            const arr = str2.split("");
            const reverseArr = [];
            for (let forArr = 0; forArr < arr.length; forArr++) {
                const item = arr[forArr];
                if (parseInt(item) === 1) {
                    reverseArr.push(0);
                } else {
                    reverseArr.push(1);
                }
            }
            const temp = parseInt(reverseArr.join(""), 2) + 1;
            return parseFloat("-" + temp / 1000);
        }
        return parseInt(str2, 2) / 1000;
    }

function sensorAttrForVersion(dataValue: string) {
    const dataValueSplitArray = dataValue.split(",");
    return {
        ver_hardware: dataValueSplitArray[0],
        ver_software: dataValueSplitArray[1]
    };
}

function toBinary(arr: string[]): string {
    const binaryData: string[] = [];
    
    arr.forEach((item: string) => {
        let data = parseInt(item, 16).toString(2);
        const dataLength = data.length;
        if (data.length !== 8) {
            for (let i = 0; i < 8 - dataLength; i++) {
                data = "0" + data;
            }
        }
        binaryData.push(data);
    });
    return binaryData.toString().replace(/,/g, "");
}