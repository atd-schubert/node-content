"use strict";

var View = require("./view");
var Schema = require("./schema");
var Model = require("./model");
var QuerySet = require("./query-set");
var ContentElement = require("./ce");

module.exports = function(opts){
  if(!opts.cms) throw new Error("You have to specify the cms object");
  var self = this;
  var cms = opts.cms;
  opts.ContentElement = opts.contentElement || {};
  opts.Schema = opts.Schema || {};
  opts.Model = opts.Model || {};
  opts.QuerySet = opts.QuerySet || {};
  opts.View = opts.View || {};

  this.ContentElement = ContentElement(opts.cms, opts.ContentElement);
  this.View = View(opts.cms, opts.View);
  this.Schema = Schema(opts.cms, opts.Schema);
  this.Model = Model(opts.cms, opts.Model);
  this.QuerySet = QuerySet(opts.cms, opts.QuerySet);
  
  var delOnChange = function(id, url){
    cms.once("contentChange:"+id, function(){
      cms.cache.clean(url);
    });
  };
  
  this.middleware = function(req, res, next){
    if(req.url.substr(0, opts.route.length) === opts.route) { // is in cms path
      var queryStr = req.url.substr(opts.route.length+1);
      queryStr = queryStr.split("/");
      var elemId = queryStr[0];
      var view = queryStr[1];
      self.ContentElement.get(elemId, function(err, elem){
        if(err) return next(err);
        if(elem && elem.views[view]) {
          var ct = elem.getContentType(view);
          elem.render(view, function(err, body){
            if (err) return next(err);
            if(elem.data.resource.caching && ct === "text/html") { // TODO: add possibility to cache other resources then html
              cms.cache.cache(req.url+"/index.html", body);
              if(elem.data.resource.cachingTtl) cms.cache.ttl(req.url, elem.data.resource.cachingTtl);
              delOnChange(elem._id, req.url+"/index.html");
            }
            var head = {"Content-Type": ct};
            var xss = elem.getAccessControlAllowOrigin(view);
            if(xss) head["Access-Control-Allow-Origin"] = xss;
            res.writeHead(200, head);
            res.end(body);
          });
        }
        else next();
      });
    }
    if(req.url.substr(0, opts.backend.route.length) === opts.backend.route) { //backend
      // TODO: check for authentication first!
    
      if(req.url === opts.backend.route || req.url === opts.backend.route+"/") { // main page
        return res.send("// TODO: Backend Homepage...");
      }
      var queryStr = req.url.substr(opts.backend.route.length+1).split("/");
      var action = queryStr[0];
      var elemId = queryStr[1];
      
      switch (action.toLowerCase()) {
        case "create": // create an element has this structure /create/:elementName
          
          console.log("// TODO: make backend create functions");
          return res.send("CREATOR...\nLooking for a creator for "+elemId);
          break;
        
        
        default:
          return self.ContentElement.get(elemId, function(err, elem){
            if(err) return next(err);
console.log("XXXXXXX", action, "--", elem.backend);
            if(elem && elem.backend[action]) {
              elem.renderBackend(action, function(err, body){
                if(err) return next(err);
                if(!body) return res.send("// TODO: maybe handle no body...");
                var head = {"Content-Type": elem.getBackendContentType(action)};
                var xss = elem.getBackendAccessControlAllowOrigin(action);
                if(xss) head["Access-Control-Allow-Origin"] = xss;
                res.writeHead(200, head);
                res.end(body);
              });
            }
            else next();
        
          });
      }
      return next();
    }
    
    // mayby a vanity url
    var url = req.url;
    if(url.substr(-1)=== "/") url = url.substr(0, url.length-1);
    var tmp = {};
    tmp["data.resource.vanityUrls.routes."+url] = true;
    cms.findOneContentElement(tmp, function(err, ce){
      if(err) return next(err);
      if(!ce) return next();
      var i;
      var list = ce.data.resource.vanityUrls.list;
      for (i=0; i<list.length; i++) {
        if(list[i].route===url && ce.views[list[i].view]) {
          var ct = ce.getContentType(list[i].view);
          return ce.render(list[i].view, function(err, body){
            if(ce.data.resource.caching && ct === "text/html") {
              cms.cache.cache(url+"/index.html", body);
              if(ce.data.resource.cachingTtl) cms.cache.ttl(req.url, ce.data.resource.cachingTtl);
              delOnChange(ce._id, url+"/index.html");
            }
            var head = {"Content-Type": ct};
            var xss = ce.getAccessControlAllowOrigin(list[i].view);
            if(xss) head["Access-Control-Allow-Origin"] = xss;
            res.writeHead(200, head);
            res.end(body);
          });
        }
      }
      return next(); // should normally called never, only with wrong defines contentElements
    });
  };
}