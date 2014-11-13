"use strict";

var jade = require("jade");
var fs = require("fs");

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
    var regex = new RegExp("^"+cms.config.backend.route.split("/").join("\\/")+"(\\/?(\\?([\\w\\W]*)?)?)?$");
    if(regex.test(req.url)){//req.url === cms.config.backend.route || req.url === cms.config.backend.route+"/") {
      console.log(req.query);
      
      return res.end(ext.renderPage({onlyBody: ("onlyBody" in req.query), title: "Welcome to the NC backend", content: jade.renderFile(__dirname+"/views/root.jade", {})}));
    } else if(req.url === cms.config.backend.route+"/backend/js") {
      return ext.buildClientJS(function(err, datas){
        if(err) return next(err);
        res.writeHead(200, {"Content-Type": "application/javascript"});
        var i;
        for (i=0; i<datas.length; i++) {
          if(typeof datas[i]=== "string") res.write(datas[i]);
          else res.write(datas[i].toString());
        }
        res.end();
      }, {req: req});
    } else if(req.url === cms.config.backend.route+"/backend/css") {
      return ext.buildClientCSS(function(err, data){
        if(err) return next(err);
        res.writeHead(200, {"Content-Type": "text/css"});
        res.end(data.join("\n"));
      }, {req: req});
    } else {
      next();
    }
    
  };
  
  var ext = cms.createExtension({package: require("./package.json")});
  
  ext.on("install", function(event){
    cms.config.backend = cms.config.backend || {};
    cms.config.backend.route = cms.config.backend.route || "/backend";
    ext.config = cms.config.backend;
  });
  ext.on("uninstall", function(event){
    ext.deactivate();
    if(event.args && event.args.all) delete cms.config.backend;
  });
  
  ext.on("activate", function(event){
    // event.target; event.args
    if(cms.requestMiddlewares.indexOf(backendRouter) === -1) {
      cms.requestMiddlewares.push(backendRouter);
    }
  });
  
  ext.on("deactivate", function(event){
    // event.target; event.args
    if(cms.requestMiddlewares.indexOf(backendRouter) !== -1) {
      cms.requestMiddlewares.splice(event.target.requestMiddlewares.indexOf(backendRouter), 1);
    }
  });
  
  ext.middleware = backendRouter;
  
  ext.buildNavigation = function(){
    var menu = [{caption:"Backend", href:ext.config.route, class:"ajaxBody"}];
    ext.emit("buildNavigation", menu);
    
    return jade.renderFile(__dirname+"/views/navigation.jade", {menu: menu});
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
  
  ext.renderPage = function(content){
    content.navigation = content.navigation || ext.buildNavigation();
    content.title = content.title || "Unnamed backend page";
    content.onlyBody = content.onlyBody || false;
    content.rootUrl = ext.config.route;
    return jade.renderFile(__dirname+"/views/page.jade", content);
  };
  ext.install();
  return ext;
}