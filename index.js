"use strict";

// var noody = require("noody");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var ContentManagement = require("./contentManagement");
var Cache = require("static-cache");
var ServeAssets = require("serve-assets");
var Manifest = require("manifest-manager");
var I18n = require("i18n");
var Sitemap = require("./sitemap");
//var Noody = require("noody");
var mongoose = require("mongoose");

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

var NodeContentManagement = function NodeContent(opts){
  EventEmitter.call(this);
  var self = this;
  opts = opts || {};
  
  opts.server = opts.server || {};
  //opts.server.hostname = opts.server.hostname;
  
  opts.cache = opts.cache || {};
  opts.cache.path = opts.cache.path || process.cwd()+"/._cache";
  opts.cache.ignore = opts.cache.ignore || function(path){return false;}; // ignore nothing by default...
  opts.cache.resetOnStartup = opts.cache.resetOnStartup === false ? false : true; // reset by default...
  
  opts.manifest = opts.manifest || {};
  opts.manifest.route = opts.manifest.route || "/manifest";
  if(typeof opts.manifest.persistent !== "boolean") opts.manifest.persistent = true;
  
  this.cache = new Cache(opts.cache);
  
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
  I18n.configure(opts.i18n);
  
  if(!opts.store) opts.store = connectDB('mongodb://localhost/cms');
  if(typeof opts.store === "string") opts.store = connectDB(opts.store);
  //opts.store.modelName = opts.store.modelName || "cmsstore";
  
  opts.contentManagement = opts.contentManagement || {};
  
  opts.contentManagement.frontend = opts.contentManagement.frontend || {};
  opts.contentManagement.frontend.route = opts.contentManagement.frontend.route || "/cms";
  
  opts.contentManagement.backend = opts.contentManagement.backend || {};
  opts.contentManagement.backend.route = opts.contentManagement.backend.route || "/backend";
  opts.contentManagement.cms = this;
  
  //this.store = new Noody({store: new Noody.Stores.mongoose(opts.store)});
  this.store = opts.store;
  
  this.contentManagement = new ContentManagement(opts.contentManagement);

  this.i18n = I18n;
  this.sitemap = new Sitemap(opts.sitemap);
  this.manifest = new Manifest(opts.manifest);
  this.serveAssets = new ServeAssets(opts.assets);
  
  this.middleware = function(req, res, next){
    // cache
    req.cms = self;
    res.cms = self;
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
};


util.inherits(NodeContentManagement, EventEmitter);

module.exports = NodeContentManagement;
