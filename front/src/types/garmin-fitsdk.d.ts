declare module '@garmin/fitsdk' {
  export class Encoder {
    constructor();
    onMesg(mesgNum: number, message: Record<string, unknown>): void;
    writeMesg(message: Record<string, unknown> & { mesgNum: number }): void;
    close(): Uint8Array;
  }

  export class Decoder {
    constructor(stream: Stream);
    static isFIT(stream: Stream): boolean;
    isFIT(): boolean;
    checkIntegrity(): boolean;
    read(options?: DecoderOptions): DecoderResult;
  }

  export class Stream {
    static fromByteArray(bytes: number[]): Stream;
    static fromArrayBuffer(buffer: ArrayBuffer): Stream;
    static fromBuffer(buffer: Buffer): Stream;
  }

  export interface DecoderOptions {
    mesgListener?: (messageNumber: number, message: Record<string, unknown>) => void;
    mesgDefinitionListener?: (mesgDefinition: unknown) => void;
    fieldDescriptionListener?: (
      key: string,
      developerDataIdMesg: unknown,
      fieldDescriptionMesg: unknown
    ) => void;
    applyScaleAndOffset?: boolean;
    expandSubFields?: boolean;
    expandComponents?: boolean;
    convertTypesToStrings?: boolean;
    convertDateTimesToDates?: boolean;
    includeUnknownData?: boolean;
    mergeHeartRates?: boolean;
    decodeMemoGlobs?: boolean;
  }

  export interface DecoderResult {
    messages: Record<string, unknown[]>;
    errors: Error[];
  }

  export const Profile: {
    MesgNum: {
      FILE_ID: number;
      WORKOUT: number;
      WORKOUT_STEP: number;
      WORKOUT_SESSION: number;
      RECORD: number;
      EVENT: number;
      DEVICE_INFO: number;
      SESSION: number;
      LAP: number;
      ACTIVITY: number;
      [key: string]: number;
    };
    types: {
      mesgNum: Record<number, string>;
      [key: string]: Record<number | string, string | number>;
    };
  };

  export const Utils: {
    convertDateTimeToDate(dateTime: number): Date;
  };
}
