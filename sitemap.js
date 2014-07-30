"use strict";

// This is a wrapper function for the original sitemap module from npm

var SM = require("sitemap");
var fs = require("fs");
var savePath = __dirname+"/._storedSitemapData.json"

var Sitemap = function(opts){
  opts = opts || {};
  if(typeof opts.persistent !== "boolean") opts.persistent = false;
  opts.cacheTime = opts.cacheTime || 1000*60*60*24;
  opts.route = opts.route || "/sitemap.xml";
  opts.cacheFn = opts.cacheFn || function(){};
  //opts.uncacheFn = opts.uncacheFn || function(){}; // we don't need this...
  
  var sites = {};
  
  var save = function(){
    opts.cacheFn(opts.route, self.sitemap.toString());
    if(opts.persistent) fs.writeFile(savePath, JSON.stringify(sites), function(err){
      if(err) console.error(err);
    });
  };
  
  if(opts.persistent && fs.existsSync(savePath)) {
    sites = JSON.parse(fs.readFileSync(savePath));
    opts.urls = [];
    var hash;
    for(hash in sites) {
      opts.urls.push(sites[hash]);
    }
  }
  
  var sm = SM.createSitemap(opts);
  
  this.add = function(obj){
    sm.add(obj);
    sites[obj.url] = obj;
    save();
  };
  this.del = function(obj){
    if(typeof obj === "object" && obj.url) obj = obj.url;
    
    delete sites[obj];
    sm.del(obj);
    save();
  };
  this.middleware = function(req, res, next){
    if(req.url === opts.route) { // sitemap
      var doc = sm.toString();
      opts.cacheFn(opts.route, doc);
      res.writeHead(200, {
        "Content-Length": doc.length,
        "Content-Type": "application/xml"
      });
      res.end(doc);
    } else {
      next();
    }
  };
  
};

module.exports = Sitemap;