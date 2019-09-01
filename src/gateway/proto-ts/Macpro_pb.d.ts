// package: MacproRequestProto
// file: Macpro.proto

/* tslint:disable */

import * as jspb from "google-protobuf";

export class RequestObject extends jspb.Message { 
    getApiname(): string;
    setApiname(value: string): void;

    getToken(): string;
    setToken(value: string): void;

    getData(): string;
    setData(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RequestObject.AsObject;
    static toObject(includeInstance: boolean, msg: RequestObject): RequestObject.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RequestObject, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RequestObject;
    static deserializeBinaryFromReader(message: RequestObject, reader: jspb.BinaryReader): RequestObject;
}

export namespace RequestObject {
    export type AsObject = {
        apiname: string,
        token: string,
        data: string,
    }
}

export class ResponseObject extends jspb.Message { 
    getToken(): string;
    setToken(value: string): void;

    getData(): string;
    setData(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ResponseObject.AsObject;
    static toObject(includeInstance: boolean, msg: ResponseObject): ResponseObject.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ResponseObject, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ResponseObject;
    static deserializeBinaryFromReader(message: ResponseObject, reader: jspb.BinaryReader): ResponseObject;
}

export namespace ResponseObject {
    export type AsObject = {
        token: string,
        data: string,
    }
}

export class MessageStream extends jspb.Message { 
    getCode(): string;
    setCode(value: string): void;

    getData(): string;
    setData(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MessageStream.AsObject;
    static toObject(includeInstance: boolean, msg: MessageStream): MessageStream.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MessageStream, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MessageStream;
    static deserializeBinaryFromReader(message: MessageStream, reader: jspb.BinaryReader): MessageStream;
}

export namespace MessageStream {
    export type AsObject = {
        code: string,
        data: string,
    }
}
