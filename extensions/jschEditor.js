"use strict";

module.exports = function(cms, opts){ // TODO: maybe don't use opts at this place, use install args instead...
  if(!cms) throw new Error("You have to specify the cms object");
  
  var ignored = {};
  
  var buildNavigation = function(menu){
	  var backendRoute = cms.getExtension("backend").config.route;
	  var hash;
	  var submenu = [];
	  for(hash in cms.store.models) {
		  if(!ignored[hash]) submenu.push({caption:hash, href:backendRoute+ext.config.subRoute+"/"+hash});
	  }
	  
	  menu.push({caption:"Edit Content", submenu: submenu});
  };
  
  var router = function(req, res, next){
	  if(req.url.substr(0, cms.config.backend.route.length+cms.config.jschEditor.subRoute.length) === cms.config.backend.route+cms.config.jschEditor.subRoute) {
	    var arr = req.url.substr(cms.config.backend.route.length+cms.config.jschEditor.subRoute.length+1).split("/");
	    
	    var backend = cms.getExtension("backend");
	    
	    if(arr.length===1 && arr[0]=== "") return res.end(backend.renderPage({title: "Jsch Content Editor - Overview", content: "// TODO: Root page"}));
	    if(arr.length===1 || arr[1].length===0) return res.end(backend.renderPage({title: "Jsch Content Editor - Overview", content: "// TODO: list entries"}));
	    return res.end(backend.renderPage({title: "Jsch Content Editor", content: "// TODO: Here goes the jsch"}));
	  } else {
		  next();
	  }
	  
  };
  
  var ext = cms.createExtension({package: {name: "jschEditor"}});
  
  ext.on("install", function(event){
    cms.config.jschEditor = cms.config.jschEditor || {};
    cms.config.jschEditor.subRoute = cms.config.jschEditor.subRoute || "/jschEditor";
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
	  cms.getExtension("backend").on("buildNavigation", buildNavigation);
  });
  
  ext.on("deactivate", function(event){
	  // event.target; event.args
	  if(cms.requestMiddlewares.indexOf(router) !== -1) {
		  cms.requestMiddlewares.splice(event.target.requestMiddlewares.indexOf(router), 1);
	  }
	  cms.getExtension("backend").removeListener("buildNavigation", buildNavigation);
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