// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var Macpro_pb = require('./Macpro_pb.js');

function serialize_MacproRequestProto_MessageStream(arg) {
  if (!(arg instanceof Macpro_pb.MessageStream)) {
    throw new Error('Expected argument of type MacproRequestProto.MessageStream');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_MacproRequestProto_MessageStream(buffer_arg) {
  return Macpro_pb.MessageStream.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_MacproRequestProto_RequestObject(arg) {
  if (!(arg instanceof Macpro_pb.RequestObject)) {
    throw new Error('Expected argument of type MacproRequestProto.RequestObject');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_MacproRequestProto_RequestObject(buffer_arg) {
  return Macpro_pb.RequestObject.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_MacproRequestProto_ResponseObject(arg) {
  if (!(arg instanceof Macpro_pb.ResponseObject)) {
    throw new Error('Expected argument of type MacproRequestProto.ResponseObject');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_MacproRequestProto_ResponseObject(buffer_arg) {
  return Macpro_pb.ResponseObject.deserializeBinary(new Uint8Array(buffer_arg));
}


// 定义请求服务
var MacproRequestService = exports.MacproRequestService = {
  // 普通长连接请求，请求->响应
  request: {
    path: '/MacproRequestProto.MacproRequest/Request',
    requestStream: false,
    responseStream: false,
    requestType: Macpro_pb.RequestObject,
    responseType: Macpro_pb.ResponseObject,
    requestSerialize: serialize_MacproRequestProto_RequestObject,
    requestDeserialize: deserialize_MacproRequestProto_RequestObject,
    responseSerialize: serialize_MacproRequestProto_ResponseObject,
    responseDeserialize: deserialize_MacproRequestProto_ResponseObject,
  },
  // 流式长连接请求 请求->响应流 （所有回调的处理，设置回调地址这块可以直接就在消息转发服务器设置好，不需要puppet发送请求来处理此消息）
  // 回调分为两种：1. 预设的回调链接 2. 某些API场景触发到的回调链接
  notify: {
    path: '/MacproRequestProto.MacproRequest/Notify',
    requestStream: false,
    responseStream: true,
    requestType: Macpro_pb.RequestObject,
    responseType: Macpro_pb.MessageStream,
    requestSerialize: serialize_MacproRequestProto_RequestObject,
    requestDeserialize: deserialize_MacproRequestProto_RequestObject,
    responseSerialize: serialize_MacproRequestProto_MessageStream,
    responseDeserialize: deserialize_MacproRequestProto_MessageStream,
  },
};

exports.MacproRequestClient = grpc.makeGenericClientConstructor(MacproRequestService);
