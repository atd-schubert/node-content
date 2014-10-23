"use strict";


module.exports = function Backend(opts){
  opts.route
  var isBackendRoute = function(route){
    return route.indexOf(opts.route) === 0;
  };
  this.middleware = function(req, res, next){
    if(!isBackendRoute(req.path)) return next();
    var category = req.path.substr(opts.route.length);
    while (category.substr(0, 1)=== "/") {
      category = category.substr(1);
    }
    category.split("/");
    
    // Resources
    if(category[0].toLowerCase() === "resource") {
      if(category[1].toLowerCase() === "") {
        
      }
    }
    
    
  };
};