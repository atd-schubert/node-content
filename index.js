"use strict";

var EventEmitter = require("events").EventEmitter;
var util = require("util");

var NodeContentManagement = function NodeContent(opts){
  EventEmitter.call(this);
  var self = this;
  
  // Configuration...
  opts = opts || {};
  /*
  opts.server = opts.server || {};
  if(opts.server.port && !opts.server.hostname && !opts.server.host) opts.server.hostname = "localhost"; // just port
  if(opts.server.hostname && opts.server.port && !opts.server.host) opts.server.host = opts.server.hostname+":"+opts.server.port; // not hostname
  if(opts.server.host && !opts.server.port && !opts.server.hostname) { // just hostname
    opts.server.hostname = opts.server.host.split(":")[0];
    opts.server.port = opts.server.host.split(":")[1];
  }

  opts.server.protocol = opts.server.protocol || "http:";
  opts.server.hostname = opts.server.hostname || "localhost";
  opts.server.port = opts.server.port || "80";
  opts.server.host = opts.server.host || "localhost:80";
  //*/
  
  // Extension Class:
  var Extension = function(opts){
    EventEmitter.call(this);
    
    if(!opts) throw new Error("An extension has to have a option parameter");
    if(!opts.package) throw new Error("An extension has to have package informations");
    if(!opts.package.name) throw new Error("An extension has to have a name");
    var name = opts.package.name;
    
    if(name.substr(0, 4) === "nce-") name = name.substr(4);
    
    if(Extension.extensions[name]) throw new Error("An extension has to have a name");
    Extension.extensions[name] = this;
    
	  this.activate = function(){
		  this.cms.emit("activateExtension", {target: this, args: arguments});
		  this.cms.emit("activateExtension:"+name, {target: this, args: arguments});
		  this.emit("activate", {target: this, args: arguments});
	  };
	  this.deactivate = function(){
		  this.cms.emit("deactivateExtension", {target: this, args: arguments});
		  this.cms.emit("deactivateExtension:"+name, {target: this, args: arguments});
		  this.emit("deactivate", {target: this, args: arguments});
	  };
	  this.install = function(){
		  this.cms.emit("installExtension", {target: this, args: arguments});
		  this.cms.emit("installExtension:"+name, {target: this, args: arguments});
		  this.emit("install", {target: this, args: arguments});
	  };
	  this.uninstall = function(){
  	  this.deactivate();
		  this.cms.emit("uninstallExtension", {target: this, args: arguments});
		  this.cms.emit("uninstallExtension:"+name, {target: this, args: arguments});
		  this.emit("uninstall", {target: this, args: arguments});
	  };
	  
	  this.cms = self;
	  this.package = opts.package;
	  this.config = this.cms.config[name] = this.cms.config[name] || {};
	  
	  this.cms.emit("createExtension", this);
  };
  util.inherits(Extension, EventEmitter);
  Extension.extensions = {};
  
  this.createExtension = function(name){
	  return new Extension(name);
  };
  this.getExtension = function(name){
	  return Extension.extensions[name];
  };
  
  // End of Extension class
  
  this.config = opts;
  
  this.requestMiddlewares = [];
  
  this.middleware = function(req, res, done){
    // cache
    req.cms = self;
    res.cms = self;
    
    var mwPosition = 0;
    
    var next = function(err){
	    if(err) return done(err);
	    if(self.requestMiddlewares[mwPosition]) return self.requestMiddlewares[mwPosition++](req, res, next);
	    done();
    };
    next();
    return;
  };
};


util.inherits(NodeContentManagement, EventEmitter);

module.exports = NodeContentManagement;
