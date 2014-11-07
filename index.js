"use strict";

var EventEmitter = require("events").EventEmitter;
var util = require("util");
//var ContentManagement = require("./contentManagement");
var Cache = require("static-cache");
var ServeAssets = require("serve-assets");
var Manifest = require("manifest-manager");
var I18n = require("i18n");
var Sitemap = require("./sitemap");
var mongoose = require("mongoose");
var request = require("request");

var connectDB = function(path) {
  if(mongoose.connection._readyState!==0) {
    console.error("There is already a connection...");
    console.log(mongoose.connection);
    return mongoose;
  }
  mongoose.connect(path);
  mongoose.connection.once("open", function(){
    console.log("Connection to db '"+path+"' established...");
  });
  return mongoose;
};

var mkQuery = function(str){ // need this for request...
	if(!str) return {};
	
	if(/^[0-9a-f]{24}$/.test(str)) {
    return {_id:str};
  }
  
  if(str.split(":").length>1){
    var query = {};
    var arr = str.split(",");
    var i, tmp;
    for (i=0; i<arr.length; i++) {
      tmp = arr[i].split(":");
      query[unescape(tmp[0])] = unescape(tmp[1]);
    }
    return query;
  }
};

var NodeContentManagement = function NodeContent(opts){
  EventEmitter.call(this);
  var self = this;
  
  // Configuration...
  opts = opts || {};
  
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
  
  opts.cache = opts.cache || {};
  opts.cache.path = opts.cache.path || process.cwd()+"/._cache";
  opts.cache.ignore = opts.cache.ignore || function(path){return false;}; // ignore nothing by default...
  opts.cache.resetOnStartup = opts.cache.resetOnStartup === false ? false : true; // reset by default...
  
  opts.manifest = opts.manifest || {};
  opts.manifest.route = opts.manifest.route || "/manifest";
  if(typeof opts.manifest.persistent !== "boolean") opts.manifest.persistent = true;
  
  this.cache = new Cache(opts.cache); // TODO: has to have this line at this place??? <--------------------------------------------
  
  opts.assets = opts.assets || {};
  opts.assets.cacheFn = function(path,content,cb){self.cache.cache(path,content,cb)};
  opts.assets.uncacheFn = function(path,content,cb){self.cache.clean(path,cb)};
  opts.assets = opts.assets || {};
  opts.assets.route = opts.assets.route || "/assets";
  opts.assets.path = opts.assets.path || process.cwd()+"/assets";
  
  opts.sitemap = opts.sitemap || {};
  opts.sitemap.hostname = opts.sitemap.hostname || opts.server.hostname;
  opts.sitemap.route = opts.sitemap.route || "/sitemap.xml";
  opts.sitemap.cacheFn = function(path,content,cb){self.cache.cache(path,content,cb)};
  //opts.sitemap.cacheTime = opts.sitemap.cacheTime || 1000*60*60*24;
  if(!opts.sitemap.hostname) {
    console.warn("WARNING: You havn't specified a hostname for your sitemap!");
    opts.sitemap.hostname = "http://no.url"
  };
  
  opts.i18n = opts.i18n || {};
  opts.i18n.locale = opts.i18n.locale || ["en"];
  opts.i18n.cookie = opts.i18n.cookie || "i18n";
  opts.i18n.directory = opts.i18n.directory || process.cwd()+"/i18n";
  I18n.configure(opts.i18n); // TODO: has to have this line at this place??? <--------------------------------------------
  
  if(!opts.store) opts.store = connectDB('mongodb://localhost/cms');
  if(typeof opts.store === "string") opts.store = connectDB(opts.store);
  //opts.store.modelName = opts.store.modelName || "cmsstore";
  
  opts.frontend = opts.frontend || {};
  opts.frontend.route = opts.frontend.route || "/cms";
  
  opts.backend = opts.backend || {};
  opts.backend.route = opts.backend.route || "/backend";
  
  opts.request = opts.request || {};
  opts.request.fn = opts.request.fn || function(req, res, next){ self.middleware(req, res, next); };
  
  // End of config...
  
  // Extension Class:
  var Extension = function(opts){
    EventEmitter.call(this);
    
    if(!opts) throw new Error("An extension has to have a option parameter");
    if(!opts.package) throw new Error("An extension has to have package informations");
    if(!opts.package.name) throw new Error("An extension has to have a name");
    
    if(Extension.extensions[opts.package.name]) throw new Error("An extension has to have a name");
    
    var name = opts.package.name;
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
		  this.cms.emit("uninstallExtension", {target: this, args: arguments});
		  this.cms.emit("uninstallExtension:"+name, {target: this, args: arguments});
		  this.emit("uninstall", {target: this, args: arguments});
	  };
	  
	  this.cms = self;
	  this.package = opts.package;
	  
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
  this.store = opts.store;
  
  //this.contentManagement = new ContentManagement(opts.contentManagement);

  this.i18n = I18n;
  this.sitemap = new Sitemap(opts.sitemap);
  this.manifest = new Manifest(opts.manifest);
  this.serveAssets = new ServeAssets(opts.assets);
  
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
    
    
    
    
    
    
    
    
    
    
    console.log(1);
    self.i18n.init(req, res, function(err){
      if(err) return next(err);
    console.log(2);
      
      self.cache.serve(req, res, function(err){
        if (err) return next(err);
    console.log(3);
        
        // Assets packing and minifying
        self.serveAssets.middleware(req, res, function(err){
    console.log(4);
          if(err) return next(err);
          // cms route & vanityURLs
          self.contentManagement.middleware(req, res, function(err){
    console.log(5);
            if(err) return next(err);
            self.manifest.middleware(req, res, function(err){
    console.log(6);
              if(err) return next(err);
              self.sitemap.middleware(req, res, function(err){
    console.log(7);
                if(err) return next(err);
                // backend is included in contentManagement!
                next();
              }); // sitemap
            }); // manifest
          }); // cms route & vanityURLs
        }); // serve-assets
      }); // cache
    }); // i18n
  };
  
  this.request = function(req, cb){ // TODO: not stable!
    var data = [];
    var status;
    var head;
    
    var next = function(err){
	    if(err) return cb(err);
	    cb(new Error("No data")); // TODO: better error description
    };
    var res = {
      writeHead: function(_status, _head){
	      status = _status;
	      head = _head;
      },
	    write: function(_data){
		    data.push(_data);
	    },
	    end: function(_data){
		    cb(null, {statusCode: status, headers: head, internal: true}, data.join("")+_data);
	    },
	    send: function(/*_status, _data*/){
	      var _status;
	      var _data;
		    if(typeof arguments[0] === "number") {
			    _status = arguments[0];
			    _data = arguments[1];
		    } else  {
			    _status = 200;
			    _data = arguments[0];
		    }
		    cb(null, {statusCode: status, headers: {}, internal: true}, data.join("")+_data);
	    }
    };
    
	  if(typeof req === "string") {
		  req = {
			  uri: req,
			  url: req,
			  method: "GET"
		  };
	  }
	  
	  if(/^#/.test(req.uri)) {
	    var arr = req.uri.substr(1).split("/"); // #modelname/viewname/query
	    req.url = req.uri = opts.frontend.route+"/"+arr[0]+"/"+arr[1]+"/"+(arr[2] || "") // TODO: get data from opts / config
	    
	    return self.getContent(arr[0], arr[1], mkQuery(arr[2]), function(err, fn){
		    if(err) return cb(err);
		    return fn(req, res, next);
	    })
	  }
	  if(/^\//.test(req.uri)) {
	    
	    // TODO: don't call a real request!!!
	    req.uri = opts.server.protocol+"//"+opts.server.host+ req.uri;
	    return request(req, cb);
	    
		  return opts.request.fn(req, res, next);
	  }
	  return request(req, cb);
  };
  
  this.getContent = function(model, view, query, cb){
    if(!(model in self.store.models)) return cb(new Error("Unknown model '"+model+"'"));
    var Model = self.store.models[model];
    
    if(!("views" in Model) || !(view in Model.views)) return cb(new Error("Unknown view '"+view+"' in model '"+model+"'"));
    
    return Model.find(query, function(err, data){
      if(err) return cb(err);
      cb(null, Model.views[view](data));
    });
  };
};


util.inherits(NodeContentManagement, EventEmitter);

module.exports = NodeContentManagement;
