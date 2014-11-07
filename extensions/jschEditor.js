"use strict";

module.exports = function(cms, opts){ // TODO: maybe don't use opts at this place, use install args instead...
  if(!cms) throw new Error("You have to specify the cms object");
  
  var buildNavigation = function(){
	  return cms.getExtension("backend").buildNavigation();
  };
  
  var router = function(req, res, next){
	  if(req.url.substr(0, cms.config.backend.route.length+cms.config.jschEditor.subRoute.length) === cms.config.backend.route+cms.config.jschEditor.subRoute) {
	    var arr = req.url.substr(cms.config.backend.route.length+cms.config.jschEditor.subRoute.length+1).split("/");
	    
	    if(arr.length===1 && arr[0]=== "") return res.end("// TODO: root page");
	    if(arr.length===1) return res.end("// TODO: list page");
	    if(arr[1].length===0) return res.end("// TODO: list page");
	    res.end('<html><body>'+buildNavigation()+'<div>Jsch goes here</div></body></html>');
	  } else {
		  next();
	  }
	  
  };
  
  var ext = cms.createExtension({package: {name: "jschEditor"}});
  
  ext.on("install", function(event){
    cms.config.jschEditor = cms.config.jschEditor || {};
    cms.config.jschEditor.subRoute = cms.config.jschEditor.subRoute || "/jschEditor";
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
  });
  
  ext.on("deactivate", function(event){
	  // event.target; event.args
	  if(cms.requestMiddlewares.indexOf(router) !== -1) {
		  cms.requestMiddlewares.splice(event.target.requestMiddlewares.indexOf(router), 1);
	  }
  });
  
  ext.middleware = router;
  
  var menu = {};
  
  ext.buildNavigation = function(){ // TODO: ...
	  return '<ul><li>This</li><li>is</li><li>a</li><li>test</li></ul>'
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