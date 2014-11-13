"use strict";

module.exports = function(cms){
  if(!cms) throw new Error("You have to specify the cms object");
  
  var router = function(req, res, next){
	  if(req.url.substr(0, ext.config.route.length) === ext.config.route) {
	    res.end("This is a dummy extension");
	  } else {
		  next();
	  }
	  
  };
  
  var schema = cms.model.Schema({
    
  });
  
  var model;
  
  var ext = cms.createExtension({package: require("./package.json")});
  
  ext.on("install", function(event){
    cms.config.dummy = cms.config.dummy || {};
    cms.config.dummy.route = cms.config.dummy.route || "/dummy";
    cms.config.dummy.modelName = cms.config.dummy.modelName || "dummy";
    ext.config = cms.config.dummy;
    
    model = cms.store.model(ext.config.modelName, schema);
  });
  ext.on("uninstall", function(event){
    ext.deactivate();
    if(event.args && event.args.all) delete cms.config.dummy;
  });
  
  ext.on("activate", function(event){
	  if(cms.requestMiddlewares.indexOf(router) === -1) {
		  cms.requestMiddlewares.push(router);
	  }
  });
  
  ext.on("deactivate", function(event){
	  if(cms.requestMiddlewares.indexOf(router) !== -1) {
		  cms.requestMiddlewares.splice(event.target.requestMiddlewares.indexOf(router), 1);
	  }
  });
  
  ext.middleware = router;
  
  return ext;
}