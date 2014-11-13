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
  
  var buildNavigation = function(menu){
    var backendRoute = cms.getExtension("backend").config.route;
    var hash;
    var submenu = [];
    for(hash in cms.store.models) {
      if(cms.config.noticeAll || !ignored[hash]) submenu.push({class:"ajaxBody", caption:hash, href:backendRoute+ext.config.subRoute+"/"+hash});
    }
    
    menu.push({caption:"Edit Content", submenu: submenu});
  };
  
  var router = function(req, res, next){
    if(req.url.substr(0, cms.config.backend.route.length+cms.config.jschEditor.subRoute.length) === cms.config.backend.route+cms.config.jschEditor.subRoute) {
      var arr = req.url.split("?")[0].substr(cms.config.backend.route.length+cms.config.jschEditor.subRoute.length+1).split("/");
      
      var backend = cms.getExtension("backend");
      
      if(arr.length===1 && arr[0]=== "") { // Overview
        var models = [];
        var hash;
        for (hash in cms.store.models) models.push(hash);
        
        var content = jade.renderFile(__dirname+"/views/list.jade", {
          rootUrl: cms.config.backend.route+cms.config.jschEditor.subRoute,
          models:models
        });
        
        return res.end(backend.renderPage({
          title: "Jsch Content Editor - Overview",
          content: content,
          onlyBody: ("onlyBody" in req.query)
        }));
      }
      
      if(arr.length===1 || arr[1].length===0) {// list entries
        var model = cms.store.models[arr[0]]
        if(!model) return next();
        
        return model.find({}, function(err, docs){
          var content = jade.renderFile(__dirname+"/views/table.jade", {
            model: model,
            docs: docs,
            rootUrl: cms.config.backend.route+cms.config.jschEditor.subRoute+"/"+arr[0]
          });
          
          return res.end(backend.renderPage({
            title: "Jsch Content Editor - Overview",
            onlyBody: ("onlyBody" in req.query),
            content: content
          }));
        });
      }
      return res.end(backend.renderPage({
        title: "Jsch Content Editor",
        onlyBody: ("onlyBody" in req.query),
        content: "// TODO: Here goes the jsch"
      }));
      
    } else {
      next();
    }
    
  };
  
  var ext = cms.createExtension({package: {name: "jschEditor"}});
  
  ext.on("install", function(event){
    cms.config.jschEditor = cms.config.jschEditor || {};
    cms.config.jschEditor.subRoute = cms.config.jschEditor.subRoute || "/jschEditor";
    cms.config.jschEditor.noticeAll = cms.config.jschEditor.noticeAll || false;
    ext.config = cms.config.jschEditor
    
  });
  ext.on("uninstall", function(event){
    ext.deactivate();
    if(event.args && event.args.all) delete cms.config.backend;
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