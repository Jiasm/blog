// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// Copyright 2015 gRPC authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
'use strict';
var grpc = require('@infra-node/grpc');
var test_pb = require('./test_pb.js');

function serialize_helloworld_AAARequest(arg) {
  if (!(arg instanceof test_pb.AAARequest)) {
    throw new Error('Expected argument of type helloworld.AAARequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_helloworld_AAARequest(buffer_arg) {
  return test_pb.AAARequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_helloworld_AAAResponse(arg) {
  if (!(arg instanceof test_pb.AAAResponse)) {
    throw new Error('Expected argument of type helloworld.AAAResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_helloworld_AAAResponse(buffer_arg) {
  return test_pb.AAAResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_helloworld_HelloReply(arg) {
  if (!(arg instanceof test_pb.HelloReply)) {
    throw new Error('Expected argument of type helloworld.HelloReply');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_helloworld_HelloReply(buffer_arg) {
  return test_pb.HelloReply.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_helloworld_HelloRequest(arg) {
  if (!(arg instanceof test_pb.HelloRequest)) {
    throw new Error('Expected argument of type helloworld.HelloRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_helloworld_HelloRequest(buffer_arg) {
  return test_pb.HelloRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


// The greeting service definition.
var GreeterService = exports.GreeterService = {
  // Sends a greeting
sayHello: {
    path: '/helloworld.Greeter/SayHello',
    requestStream: false,
    responseStream: false,
    requestType: test_pb.HelloRequest,
    responseType: test_pb.HelloReply,
    requestSerialize: serialize_helloworld_HelloRequest,
    requestDeserialize: deserialize_helloworld_HelloRequest,
    responseSerialize: serialize_helloworld_HelloReply,
    responseDeserialize: deserialize_helloworld_HelloReply,
  },
};

exports.GreeterClient = grpc.makeGenericClientConstructor(GreeterService);
var TestServiceService = exports.TestServiceService = {
  // One request followed by one response.
unaryCall: {
    path: '/helloworld.TestService/UnaryCall',
    requestStream: false,
    responseStream: false,
    requestType: test_pb.AAARequest,
    responseType: test_pb.AAAResponse,
    requestSerialize: serialize_helloworld_AAARequest,
    requestDeserialize: deserialize_helloworld_AAARequest,
    responseSerialize: serialize_helloworld_AAAResponse,
    responseDeserialize: deserialize_helloworld_AAAResponse,
  },
};

exports.TestServiceClient = grpc.makeGenericClientConstructor(TestServiceService);
