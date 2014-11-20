"use strict";

var jade = require("jade");
var fs = require("fs");

module.exports = function(cms){
  if(!cms) throw new Error("You have to specify the cms object");
  
  var ignored = {};
  
  var buildJS = function(obj){
    fs.readFile(__dirname+"/assets/script.js", obj.collector());
  };
  var buildCSS = function(obj){
    fs.readFile(__dirname+"/assets/style.css", obj.collector());
  };
  
  var buildNavigation = function(obj){
  
    var backendRoute = cms.getExtension("backend").config.route;
    var store = cms.getExtension("mongoose-store");
    var hash;
    var submenu = [];
    for(hash in store.getStore().models) {
      if(ext.config.noticeAll || !ignored[hash]) submenu.push({class:"ajaxBody", caption:hash, href:backendRoute+ext.config.subRoute+"/"+hash});
    }
    obj.collector()(null, {caption:"Edit Content", submenu: submenu});
  };
  
  var router = function(req, res, next){
    var backend = cms.getExtension("backend");
    var store = cms.getExtension("mongoose-store");
    
    if(req.url.substr(0, backend.config.route.length+ext.config.subRoute.length) === backend.config.route+ext.config.subRoute) {
      var arr = req.url.split("?")[0].substr(backend.config.route.length+ext.config.subRoute.length+1).split("/");
      
      
      
      if(arr.length===1 && arr[0]=== "") { // Overview
        var models = [];
        var hash;
        for (hash in store.getStore().models) models.push(hash);
        
        var content = jade.renderFile(__dirname+"/views/list.jade", {
          rootUrl: backend.config.route+ext.config.subRoute,
          models:models
        });
        
        return backend.renderPage({
          request: req,
          title: "Jsch Content Editor - Overview",
          content: content,
          onlyBody: ("onlyBody" in req.query)
        }, function(err, html){
          if(err) return next(err);
          return res.end(html);
        });
      }
      
      if(arr.length===1 || arr[1].length===0) {// list entries
        var model = store.getModel(arr[0]);
        if(!model) return next();
        
        return model.find({}, function(err, docs){
          var content = jade.renderFile(__dirname+"/views/table.jade", {
            model: model,
            docs: docs,
            rootUrl: backend.config.route+ext.config.subRoute+"/"+arr[0]
          });
          
          return backend.renderPage({
            request: req,
            title: "Jsch Content Editor - Overview",
            onlyBody: ("onlyBody" in req.query),
            content: content
          }, function(err, html){
            if(err) return next(err);
            return res.end(html);
          });
        });
      }
      
      return backend.renderPage({
        request: req,
        title: "Jsch Content Editor",
        onlyBody: ("onlyBody" in req.query),
        content: "// TODO: Here goes the jsch"
      }, function(err, html){
        if(err) return next(err);
        return res.end(html);
      });
      
    } else {
      next();
    }
    
  };
  
  var ext = cms.createExtension({package: {name: "jschEditor"}});
  
  ext.on("install", function(event){
    ext.config.subRoute = ext.config.subRoute || "/jschEditor";
    ext.config.noticeAll = ext.config.noticeAll || false;
    
  });
  ext.on("uninstall", function(event){
    
  });
  
  ext.on("activate", function(event){
    // event.target; event.args
    if(cms.requestMiddlewares.indexOf(router) === -1) {
      cms.requestMiddlewares.push(router);
    }
    cms.getExtension("backend")
      .on("buildNavigation", buildNavigation)
      .on("buildClientJS", buildJS)
      .on("buildClientCSS", buildCSS);
  });
  
  ext.on("deactivate", function(event){
    // event.target; event.args
    if(cms.requestMiddlewares.indexOf(router) !== -1) {
      cms.requestMiddlewares.splice(event.target.requestMiddlewares.indexOf(router), 1);
    }
    cms.getExtension("backend")
      .removeListener("buildNavigation", buildNavigation)
      .removeListener("buildClientJS", buildJS)
      .removeListener("buildClientCSS", buildCSS);
  });
  
  ext.ignoreModel = function(name){
    ignored[name] = true;
  };
  ext.noticeModel = function(name){
    delete ignored[name]
  };
  
  ext.middleware = router;
  
  return ext;
}