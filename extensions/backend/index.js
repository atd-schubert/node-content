"use strict";

var jade = require("jade");
var fs = require("fs");
var md5 = require("MD5");

var mkCollector = function(obj, cb){
  var collectorDone = false;
  var datas = [];
  var cbs = [];
  var errs = [];
  
  var collectorCb = function(){
    if(collectorDone) return;
    if(datas.length !== cbs.length) return;
    
    collectorDone = true;
    cb(errs.length ? errs : null, datas);
  };
  
  obj = obj || {};
  obj.collector = function(){
    var done = false;
    var fn = function(err, data){
      if(err) errs.push(err);
      if(done) return;
      
      datas.push(data);
      done = true;
      
      process.nextTick(collectorCb);
    };
    cbs.push(fn);
    return fn;
  };
  
  process.nextTick(collectorCb);
  
  return obj;
};

module.exports = function(cms, opts){ // TODO: maybe don't use opts at this place, use install args instead...
  if(!cms) throw new Error("You have to specify the cms object");
  
  var backendRouter = function(req, res, next){
    var regex = new RegExp("^"+ext.config.route.split("/").join("\\/")+"(\\/?(\\?([\\w\\W]*)?)?)?$");
    if(regex.test(req.url)){
      ext.renderPage({
        request: req,
        onlyBody: ("onlyBody" in req.query),
        title: "Welcome to the NC backend",
        content: jade.renderFile(__dirname+"/views/root.jade", {})
      }, function(err, html){
        if(err) return next(err);
        return res.end(html);
      });
    } else if(req.url === ext.config.route+"/backend/js") {
      return ext.buildClientJS(function(err, data){
        if(err) return next(err);
        data = data.join("\n");
        
        var headers = {"Content-Type": "application/javascript", etag:md5(data)}
        var cache = cms.getExtension("cache");
        if(cache) {
          cache.cacheData({headers: headers, data:data, url: ext.config.route+"/backend/js", force:true});
          cms.once("activate", function(){cache.uncache(ext.config.route+"/backend/js")});
          cms.once("deactivate", function(){cache.uncache(ext.config.route+"/backend/js")});
        }
        
        res.writeHead(200, headers);
        res.end(data);
      }, {req: req});
    } else if(req.url === ext.config.route+"/backend/css") {
      return ext.buildClientCSS(function(err, data){
        if(err) return next(err);
        data = data.join("\n");
        
        var headers = {"Content-Type": "text/css", etag:md5(data)}
        var cache = cms.getExtension("cache");
        if(cache) {
          cache.cacheData({headers: headers, data:data, url: ext.config.route+"/backend/css", force:true});
          cms.once("activate", function(){cache.uncache(ext.config.route+"/backend/css")});
          cms.once("deactivate", function(){cache.uncache(ext.config.route+"/backend/css")});
        }
        
        res.writeHead(200, headers);
        res.end(data);
      }, {req: req});
    } else {
      next();
    }
    
  };
  
  var ext = cms.createExtension({package: require("./package.json")});
  
  ext.on("install", function(event){
    ext.config.route = ext.config.route || "/backend";
  });
  ext.on("uninstall", function(event){
    
  });
  
  ext.on("activate", function(event){
    // event.target; event.args
    if(cms.requestMiddlewares.indexOf(backendRouter) === -1) {
      cms.requestMiddlewares.push(backendRouter);
    }
    process.nextTick(function(){
      var cache = cms.getExtension("cache");
      if(cache) {
        cache.uncache(ext.config.route+"/backend/js");
        cache.uncache(ext.config.route+"/backend/css");
      }
    });
  });
  
  ext.on("deactivate", function(event){
    // event.target; event.args
    if(cms.requestMiddlewares.indexOf(backendRouter) !== -1) {
      cms.requestMiddlewares.splice(event.target.requestMiddlewares.indexOf(backendRouter), 1);
    }
  });
  
  ext.middleware = backendRouter;
  
  ext.buildNavigation = function(opts, cb){ // TODO: build with collector!
    if(!cb) throw new Error("You have to specify a callback");
    ext.emit("buildNavigation", mkCollector(opts, function(err, menu){
      if(err) return cb(err);
      
      menu.sort(function(A,B){
        var a = A.caption.toString().toLowerCase();
        var b = B.caption.toString().toLowerCase();
        var i;
        var min = a.length+(b.length-a.length);
        var tmp;
        
        for (i=0; i<min; i++) {
          tmp = a.charCodeAt(i) - b.charCodeAt(i);
          if(tmp !== 0) return tmp;
        }
      });
      menu.unshift({caption:"Backend", href:ext.config.route, class:"ajaxBody"});
      
      return jade.renderFile(__dirname+"/views/navigation.jade", {menu: menu}, cb);
    }));
    
    return;
    var menu = [{caption:"Backend", href:ext.config.route, class:"ajaxBody"}];
    ext.emit("buildNavigation", menu);
    
    return 
  };
  
  ext.buildClientJS = function(cb, opts){
    if(!cb) throw new Error("You have to specify a callback");
    ext.emit("buildClientJS", mkCollector(opts, cb));
  };
  ext.on("buildClientJS", function(obj){
    obj.collector()(null, 'window.ncBackend = {backend:{}};');
  });
  ext.on("buildClientJS", function(obj){
    fs.readFile(__dirname+"/assets/script.js", obj.collector());
  });
  
  ext.buildClientCSS = function(cb, opts){
    if(!cb) throw new Error("You have to specify a callback");
    ext.emit("buildClientCSS", mkCollector(opts, cb));
  };
  ext.on("buildClientCSS", function(obj){
    fs.readFile(__dirname+"/assets/style.css", obj.collector());
  });
  
  ext.uncacheAssets = function(){
    var cache = cms.getExtension("cache");
    if(!cache) return;
    cache.uncache(ext.config.route+"/backend/css");
    cache.uncache(ext.config.route+"/backend/js");
  };
  
  ext.renderPage = function(obj, cb){
    if(obj.onlyStatus) return cb(null, obj.content);
    
    ext.buildNavigation(obj, function(err, menu){
      if(err) return cb(err);
      
      obj.navigation = obj.navigation || menu;
      obj.title = obj.title || "Unnamed backend page";
      obj.onlyBody = obj.onlyBody || false;
      obj.onlyStatus = obj.onlyStatus || false;
      obj.rootUrl = obj.rootUrl || ext.config.route;
      
      return jade.renderFile(__dirname+"/views/page.jade", obj, cb);
    });
  };
  ext.install();
  return ext;
}