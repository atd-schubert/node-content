"use strict";

var jade = require("jade");

module.exports = function(cms, opts){ // TODO: maybe don't use opts at this place, use install args instead...
  if(!cms) throw new Error("You have to specify the cms object");
  
  var backendRouter = function(req, res, next){
	  if(req.url === cms.config.backend.route || req.url === cms.config.backend.route+"/") {
		  
	    res.end(ext.renderPage({title: "Welcome to the NC backend", content: jade.renderFile(__dirname+"/views/root.jade", {})}));
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
  
  ext.buildNavigation = function(){ // TODO: ...
	  var menu = [{caption:"Backend", href:ext.config.route}];
	  ext.emit("buildNavigation", menu);
	  
	  return jade.renderFile(__dirname+"/views/navigation.jade", {menu: menu});
  };
  ext.renderPage = function(content){ // TODO: ...
	  content.navigation = content.navigation || ext.buildNavigation();
	  content.title = content.title || "Unnamed backend page"
	  return jade.renderFile(__dirname+"/views/page.jade", content);
  };
  ext.install();
  return ext;
}