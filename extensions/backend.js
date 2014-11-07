"use strict";

module.exports = function(cms, opts){ // TODO: maybe don't use opts at this place, use install args instead...
  if(!cms) throw new Error("You have to specify the cms object");
  
  var backendRouter = function(req, res, next){
	  if(req.url === cms.config.backend.route || req.url === cms.config.backend.route+"/") {
	    res.end('<html><body>'+ext.buildNavigation()+'<div>Content goes here</div></body></html>');
	  } else {
		  next();
	  }
	  
  };
  
  var ext = cms.createExtension({package: {name: "backend"}});
  
  ext.on("install", function(event){
    cms.config.backend = cms.config.backend || {};
    cms.config.backend.route = cms.config.backend.route || "/backend";
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
  
  var menu = {};
  
  ext.buildNavigation = function(){ // TODO: ...
	  return '<ul><li>This</li><li>is</li><li>a</li><li>test</li></ul>'
  };
  ext.renderPage = function(content){ // TODO: ...
    var html = "";
	  // skeleton
	  // navigation
	  
	  // include content
	  return html;
  };
  ext.addNavigation = function(entry){
    var hash;
	  for (hash in entry) {
		  if(hash in menu) {
			  
		  } else {
			  menu[hash] = entry[hash];
		  }
	  }
  };
  ext.removeNavigation = function(entry){ // TODO: this should proof if there is any entry left, if not delete the whole entry
    var hash;
    for (hash in entry) {
	    delete menu[hash]; // TODO: this is the simple way, but add proofs like describes above...
    }
  };
  
  return ext;
}