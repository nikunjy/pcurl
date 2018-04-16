#!/usr/bin/env node
var protobuf = require("protobufjs");
var grpc = require('grpc');
var program = require('commander');
var fs = require('fs');
program
.version('0.1.0')
.option('-f, --proto [proto]', 'Proto file')
.option('-m, --method [method]', 'Service method to hit')
.option('-s, --service [service]', 'Service to hit')
.option('-p, --package [package]', 'Package name')
.option('-h, --host [host]', 'Host port to hit')
.option('-i, --input [input]', 'Input in JSON')
.parse(process.argv);

function validate() {
	if (!program.proto) {
		throw 'Proto file not specified';
	}
	if (!fs.existsSync(program.proto)) {
		throw 'Proto file not found';
	}
	var obj = JSON.parse(program.input);
	if (!program.method) {
		throw 'Method not specified';
	}
}
try {
	validate();
} catch(e) {
	console.log('\nError! :  ', e);
	process.exit(1);
}
var fileName = program.proto;
var protoFile = grpc.load(fileName);
var splits = program.package.split('.');
var service = protoFile;
for (var i = 0; i < splits.length; i++) {
	service = service[splits[i]];
}
service = service[program.service];
var method = service.service[program.method].requestType.name;
var packageName = program.package;
var struct = packageName + '.' + method;
var client = new service(program.host, grpc.credentials.createInsecure());

protobuf.load(fileName, function(err, root) {
    if (err) {
        throw err;
    }
    var msg = root.lookupType(struct);
    var payload = JSON.parse(program.input);
    var errMsg = msg.verify(payload);
    if (errMsg) {
        throw errMsg;
    }
    var message = msg.create(payload);
	client[program.method](message, function(err, data) {
			if (err) {
				throw err;
			}
			console.log(JSON.stringify(data));
	});
})
