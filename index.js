"use strict";

// var noody = require("noody");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var contentElement = require("./contentElement");
var Cache = require("static-cache");
var ServeAssets = require("serve-assets");



var NodeContent = function NodeContent(opts){
  EventEmitter.call(this);
  var self = this;
  opts = opts || {};
  
  opts.assets = opts.assets || {};
  opts.assets.route = opts.assets.route || "/assets";
  opts.assets.path = opts.assets.path || process.cwd()+"/assets";
  
  opts.backend = opts.backend || {};
  opts.backend.route = opts.backend.route || "/backend";
  
  opts.cache = opts.cache || {};
  opts.cache.path = opts.cache.path || process.cwd()+"/cache";
  opts.cache.ignore = opts.cache.ignore || function(path){return false;}; // ignore nothing by default...
  opts.cache.resetOnStartup = opts.cache.resetOnStartup === false ? false : true; // reset by default...
  
  this.cache = new Cache(opts.cache);
  opts.assets.cacheFn = function(path,content,cb){self.cache.cache(path,content,cb)};
  opts.assets.uncacheFn = function(path,content,cb){self.cache.clean(path,cb)};
  
  opts.i18n = opts.i18n || {default:{}} //, en:{}, de:{}, es:{}...}
  
  this.serveAssets = new ServeAssets(opts.assets);
  
  this.middleware = function(req, res, next){
    // cache
    req.cms = self;
    self.cache.serve(req, res, function(err){
      if (err) return next(err);
      
      // Assets packing and minifying
      self.serveAssets.middleware(req, res, function(err){
        if(err) return next(err);
        
        // cms path
        
      
      // vanity urls
      
      //manifest sitemap
      
      // backend
        
        
        next();
      }); // serve-assets
            
    }); // cache
  };
  
  
  this.defineContentElement = function(name, view, controller){
    
  };
  this.getContentElement = function(id){};
  this.createContentElement = function(id){};
  this.deleteContentElement = function(id){};
  this.changeContentElement = function(id){};
  
  this.parseContentElement = function(_id, opts, cb){
    // get node
    // populate
    // recursive function to insert contents
  };
};

module.exports = NodeContent;

util.inherits(NodeContent, EventEmitter);