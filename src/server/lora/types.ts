/**
 * Lora Types.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */
export interface IDecoderInfosMessage {
    type: string;
    measurementName?: string;
    measurementId?: number;
    measurementValue?: number;
    hardwareVersion?: string;
    softwareVersion?: string;
}

export interface IDecoderInfos {
    valid: boolean;
    err: number;
    payload: string;
    messages: IDecoderInfosMessage[];
}
