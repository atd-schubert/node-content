"use strict";

var fs = require("fs");

module.exports = function(cms){
  if(!cms) throw new Error("You have to specify the cms object");
  
  var router = function(req, res, next){
    try{throw new Error("Dummy extension");} catch(e){console.error(e)};
    next();
  };
  
  var vanitize = function(a,b,c){
    if(cms.getExtension("vanity-url") && cms.getExtension("vanity-url").renderVanityUrlLists) return cms.getExtension("vanity-url").renderVanityUrlLists(a,b,c);
    return c(null, "");
  };

  var clientCSS = function(obj){
    fs.readFile(__dirname+"/assets/style.css", obj.collector());
  };
  var clientJS = function(obj){
    fs.readFile(__dirname+"/assets/script.js", obj.collector());
  };
  
  var buildNavigation = function(obj){ // TODO: build with collector!
    menu.push({class:"ajaxBody", caption:"dummy", href:cms.getExtension("backend").config.route+ext.config.subRoute});
  };
  
  var ext = cms.createExtension({package: require("./package.json")});
  var logger = cms.getExtension("winston").createLogger(ext.name);
  
  ext.on("install", function(event){
    
    ext.config.subRoute = ext.config.subRoute || "/"+ext.name;
    ext.config.modelName = ext.config.modelName || ext.name;
    ext.config.dumpPath = ext.config.dumpPath || __dirname+"/data";
    
    // var store = cms.getExtension("mongoose-store");
    // ext.config.schema = store.createSchema({ });
    // ext.config.model = store.createModel(ext.config.modelName, ext.config.schema);
    // ext.config.model.displayColumns = ["url", "_id"]; // Custom rows to display
    
  });
  ext.on("uninstall", function(event){
    
  });
  
  ext.on("activate", function(event){
	  if(cms.requestMiddlewares.indexOf(router) === -1) {
		  cms.requestMiddlewares.unshift(router);
	  }
    backend.on("buildNavigation", buildNavigation);
    backend.on("buildClientCSS", clientCSS);
    backend.on("buildClientJS", clientJS);
  });
  
  ext.on("deactivate", function(event){
	  if(cms.requestMiddlewares.indexOf(router) !== -1) {
		  cms.requestMiddlewares.splice(event.target.requestMiddlewares.indexOf(router), 1);
	  }
    backend.remove("buildNavigation", buildNavigation);
    backend.remove("buildClientCSS", clientCSS);
    backend.remove("buildClientJS", clientJS);
  });
  
  ext.dummy = function(opts, cb){
    // a dummy method here...
  }
  
  ext.middleware = router;
  
  return ext;
}