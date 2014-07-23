"use strict";

var serveStatic = require("connect-gzip-static");
var mkdirp = require("mkdirp");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var fs = require("fs");
var async = require("async");
var rimraf = require("rimraf"); // remove recursive

var Cache = function(opts){
  if(!opts || !opts.path) throw new Error("You have to setup a path for caching");
  EventEmitter.call(this);
  var self = this;
  
  mkdirp(opts.path);
  
  this.serve = serveStatic(opts.path, {'index': ['index.html'], maxAge: 86400000});
  
  this.cache = function(path, content, cb){
    // content is a string or a buffer
    cb = cb || function(){};
    
    var lpath = opts.path+path;
    mkdirp(lpath.substr(0, lpath.lastIndexOf("/")), function(err){
      if(err) return cb(err);
      
      var stream = fs.createWriteStream(lpath);
      
      stream.on("close", function(){
        self.emit("caching", {path: path, content: content});
        self.emit("caching-"+path, {path: path, content: content});
        cb();
      });
      stream.on("error", cb);
      
      if(!require("stream").Readable.prototype.isPrototypeOf(content)) {
        stream.write(content.toString());
        stream.close();
      } else {
        content.pipe(stream);
      }
    });
  };
  this.clean = function(path, cb){
    // path is optional, a string or an array of strings
    // if no path is specified the whole cache will be deleted
    // it should be possible to delete folders (clean("/assets/js");)
    path = path || "";
    cb = cb || function(){};
    var arr = [], i;
    var remove = function(path, cb){
      var lpath = opts.path+path
      rimraf(lpath, function(err){
        if(err) return cb(err);
        self.emit("clean", {path: path});
        self.emit("clean-"+path, {path: path});
        cb();
      });
    }
    
    if(typeof(path) === "string") path = [path];
    if(!Array.prototype.isPrototypeOf(path)) return cb(new Error("The path have to have a string or an array of strings to delete from cache"));
    
    for(i=0; i<path.length; i++) {
      arr.push(async.apply(remove, path[i]));
    }
    
    async.parallel(arr, cb);
  };
  this.ttl = function(path, duration){
    setTimeout(function(){self.clean(path);}, duration);
  };
  this.get = function(path, cb) {
    var lpath = opts.path+path;
    fs.readFile(lpath, cb);
  };
  
  if(opts.resetOnStartup) this.clean();
};

util.inherits(Cache, EventEmitter);

module.exports = Cache;