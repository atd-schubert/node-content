"use strict";

var EventEmitter = require("events").EventEmitter;
var util = require("util");


var ContentStream = function(opts){
  EventEmitter.call(this);
  
  // TODO:
  // opts.cutOnEnd; ok
  // opts.withWriteHead; ok
  // opts.killHead; ok
  // opts.pipeHead; ok
  // opts.logger;
  // opts.withClose; ok
  // opts.unpipeErrors = fn(err){} ok
  
  var dummyFn = function(){};
  
  this.write = function(data){
    var i;
    if(opts.killHead) this.writeHead = dummyFn;
    for(i=0; arguments.length>i; i++) {
      this.emit("data", arguments[i]);
    }
    return this;
  };
  this.end = function(data){
    var i;
    if(opts.killHead) this.writeHead = dummyFn;
    for(i=0; arguments.length>i; i++) this.emit("data", arguments[i]);
    this.emit("end", "");
    this.emit("close", "");
    if(opts.cutOnEnd) this.write = this.end = dummyFn;
    return this;
  };
  this.error = function(data){
    var i;
    for(i=0; arguments.length>i; i++) this.emit("error", data);
    return this;
  };
  if(opts.withWriteHead) this.writeHead = function(code, headers) {
    if(opts.killHead) this.writeHead = dummyFn;
    this.emit("writeHead", code, headers);
    return this;
  }
  if(opts.withClose) this.close = function(data){
    var i;
    for(i=0; arguments.length<i; i++) this.emit("data", arguments[i]);
    // this.emit("end");
    this.emit("close");
  };
  this.pipe = function(stream){
    if(!stream) throw new Error("No stream specified!");
    this.on("data", function(data){
      if(stream.write) stream.write(data);
      else stream.emit("data", data);
    });
    this.on("end", function(data){
      if(stream.end) stream.end(data);
      else stream.emit("end", data);
    });
    this.on("close", function(data){
      if(stream.close) stream.close(data);
      else stream.emit("close", data);
    });
    this.on("error", function(data){
      if(opts.unpipeErrors) return opts.unpipeErrors(data);
      else if(stream.error) stream.error(data);
      else stream.emit("error", data);
    });
    if(opts.pipeHead) this.on("writeHead", function(code, headers){
      if(stream.writeHead) stream.writeHead(code, headers);
      else stream.emit("writeHead", code, headers);
    });
    return this;
  };
};
util.inherits(ContentStream, EventEmitter);

module.exports = ContentStream;