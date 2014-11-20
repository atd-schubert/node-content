"use strict";

var EventEmitter = require("events").EventEmitter;
var util = require("util");


var ContentStream = function(){
  EventEmitter.call(this);
  this.write = function(data){
    var i;
    for(i=0; arguments.length>i; i++) {
      this.emit("data", arguments[i]);
    }
  };
  this.end = function(data){
    var i;
    for(i=0; arguments.length>i; i++) this.emit("data", arguments[i]);
    this.emit("end", "");
    this.emit("close", "");
    this.write = this.end = function(){};
  };
  this.error = function(data){
    var i;
    for(i=0; arguments.length>i; i++) this.emit("error", data);
  };
  /*this.close = function(data){
    var i;
    for(i=0; arguments.length<i; i++) this.emit("data", arguments[i]);
    // this.emit("end");
    this.emit("close");
  };*/
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
    this.on("error", function(data){
      if(stream.error) stream.error(data);
      else stream.emit("error", data);
    });
  };
};
util.inherits(ContentStream, EventEmitter);

module.exports = ContentStream;