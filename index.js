"use strict";

// var noody = require("noody");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var contentElement = require("./contentElement");
var Cache = require("static-cache");
var ServeAssets = require("serve-assets");
var Manifest = require("manifest-manager");
var I18n = require("i18n");
var Sitemap = require("./sitemap");



var NodeContentManagement = function NodeContent(opts){
  EventEmitter.call(this);
  var self = this;
  opts = opts || {};
  
  opts.server = opts.server || {};
  //opts.server.hostname = opts.server.hostname;
  
  opts.backend = opts.backend || {};
  opts.backend.route = opts.backend.route || "/backend";
  
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
  
  
  this.i18n = I18n;
  this.sitemap = new Sitemap(opts.sitemap);
  this.manifest = new Manifest(opts.manifest);
  this.serveAssets = new ServeAssets(opts.assets);
  
  this.middleware = function(req, res, next){
    // cache
    req.cms = self;
    self.i18n.init(req, res, function(err){
      if(err) return next(err);
      
      self.cache.serve(req, res, function(err){
        if (err) return next(err);
        
        // Assets packing and minifying
        self.serveAssets.middleware(req, res, function(err){
          if(err) return next(err);
          // cms route
          
          // vanity urls
          self.manifest.middleware(req, res, function(err){
            if(err) return next(err);
            self.sitemap.middleware(req, res, function(err){
              if(err) return next(err);
              // backend
              next();
            }); // sitemap
          }); // manifest
        }); // serve-assets
      }); // cache
    }); // i18n
  };
  
  
  this.defineContentElement = function(name, view, controller){
    
  };
  this.getContentElement = function(id){
    
  };
  this.createContentElement = function(id){};
  this.deleteContentElement = function(id){};
  this.changeContentElement = function(id){};
};

NodeContentManagement.Schema = contentElement.Schema;
NodeContentManagement.View = contentElement.View;
NodeContentManagement.Model = contentElement.Model;
//NodeContentManagement.ContentElement = contentElement.ContentElement;

util.inherits(NodeContentManagement, EventEmitter);

module.exports = NodeContentManagement;
