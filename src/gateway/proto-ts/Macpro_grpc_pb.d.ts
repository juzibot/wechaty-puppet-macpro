// package: MacproRequestProto
// file: Macpro.proto

/* tslint:disable */

import * as grpc from "grpc";
import * as Macpro_pb from "./Macpro_pb";

interface IMacproRequestService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    request: IMacproRequestService_IRequest;
    notify: IMacproRequestService_INotify;
}

interface IMacproRequestService_IRequest extends grpc.MethodDefinition<Macpro_pb.RequestObject, Macpro_pb.ResponseObject> {
    path: string; // "/MacproRequestProto.MacproRequest/Request"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<Macpro_pb.RequestObject>;
    requestDeserialize: grpc.deserialize<Macpro_pb.RequestObject>;
    responseSerialize: grpc.serialize<Macpro_pb.ResponseObject>;
    responseDeserialize: grpc.deserialize<Macpro_pb.ResponseObject>;
}
interface IMacproRequestService_INotify extends grpc.MethodDefinition<Macpro_pb.RequestObject, Macpro_pb.MessageStream> {
    path: string; // "/MacproRequestProto.MacproRequest/Notify"
    requestStream: boolean; // false
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<Macpro_pb.RequestObject>;
    requestDeserialize: grpc.deserialize<Macpro_pb.RequestObject>;
    responseSerialize: grpc.serialize<Macpro_pb.MessageStream>;
    responseDeserialize: grpc.deserialize<Macpro_pb.MessageStream>;
}

export const MacproRequestService: IMacproRequestService;

export interface IMacproRequestServer {
    request: grpc.handleUnaryCall<Macpro_pb.RequestObject, Macpro_pb.ResponseObject>;
    notify: grpc.handleServerStreamingCall<Macpro_pb.RequestObject, Macpro_pb.MessageStream>;
}

export interface IMacproRequestClient {
    request(request: Macpro_pb.RequestObject, callback: (error: grpc.ServiceError | null, response: Macpro_pb.ResponseObject) => void): grpc.ClientUnaryCall;
    request(request: Macpro_pb.RequestObject, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Macpro_pb.ResponseObject) => void): grpc.ClientUnaryCall;
    request(request: Macpro_pb.RequestObject, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Macpro_pb.ResponseObject) => void): grpc.ClientUnaryCall;
    notify(request: Macpro_pb.RequestObject, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Macpro_pb.MessageStream>;
    notify(request: Macpro_pb.RequestObject, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Macpro_pb.MessageStream>;
}

export class MacproRequestClient extends grpc.Client implements IMacproRequestClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public request(request: Macpro_pb.RequestObject, callback: (error: grpc.ServiceError | null, response: Macpro_pb.ResponseObject) => void): grpc.ClientUnaryCall;
    public request(request: Macpro_pb.RequestObject, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Macpro_pb.ResponseObject) => void): grpc.ClientUnaryCall;
    public request(request: Macpro_pb.RequestObject, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Macpro_pb.ResponseObject) => void): grpc.ClientUnaryCall;
    public notify(request: Macpro_pb.RequestObject, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Macpro_pb.MessageStream>;
    public notify(request: Macpro_pb.RequestObject, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Macpro_pb.MessageStream>;
}
