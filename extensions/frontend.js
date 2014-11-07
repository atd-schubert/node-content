"use strict";


var mkQuery = function(str){
	if(!str) return {};
	
	if(/^[0-9a-f]{24}$/.test(str)) {
    return {_id:str};
  }
  
  if(str.split(":").length>1){
    var query = {};
    var arr = str.split(",");
    var i, tmp;
    for (i=0; i<arr.length; i++) {
      tmp = arr[i].split(":");
      query[unescape(tmp[0])] = unescape(tmp[1]);
    }
    return query;
  }
};

module.exports = function(cms, opts){ // TODO: maybe don't use opts at this place, use install args instead...
  if(!cms) throw new Error("You have to specify the cms object");
  
  var frontendRouter = function(req, res, next){
	  if(req.url.substr(0, cms.config.frontend.route.length) === cms.config.frontend.route) {
	    var arr = req.url.substr(cms.config.frontend.route.length+1).split("/");
	    return cms.getContent(arr[0], arr[1], mkQuery(arr[2]), function(err, fn){
	      if(err) return next(err);
	      
	      fn(req, res, next);
	    });
	  } else {
		  next();
	  }
	  
  };
  
  var ext = cms.createExtension({package: {name: "frontend"}});
  
  ext.on("install", function(event){
    cms.config.frontend = cms.config.frontend || {};
    cms.config.frontend.route = cms.config.frontend.route || "/cms";
  });
  ext.on("uninstall", function(event){
    ext.deactivate();
    if(event.args && event.args.all) delete cms.config.frontend;
  });
  
  ext.on("activate", function(event){
	  // event.target; event.args
	  if(cms.requestMiddlewares.indexOf(frontendRouter) === -1) {
		  cms.requestMiddlewares.push(frontendRouter);
	  }
  });
  
  ext.on("deactivate", function(event){
	  // event.target; event.args
	  if(cms.requestMiddlewares.indexOf(frontendRouter) !== -1) {
		  cms.requestMiddlewares.splice(event.target.requestMiddlewares.indexOf(frontendRouter), 1);
	  }
  });
  
  ext.middleware = frontendRouter;
  
  return ext;
}