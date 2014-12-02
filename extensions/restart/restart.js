"use strict";

var restart = require("recommencement").restart;

module.exports = function(cms, opts){
  if(!cms) throw new Error("You have to specify the cms object");
  
  var clientCSS = function(obj){
    fs.readFile(__dirname+"/assets/style.css", obj.collector());
  };
  var clientJS = function(obj){
  };
  
  var buildNavigation = function(obj){
    obj.collector()(null, {class:"ajaxBody", caption:"Restart", href:cms.getExtension("backend").config.route+ext.config.subRoute});
  };
  
  var router = function(req, res, next){
    var backend = cms.getExtension("backend");
    if(req.url.substr(0, backend.config.route.length+ext.config.subRoute.length) === backend.config.route+ext.config.subRoute) {
      if(req.method === "POST") {
        res.writeHead(200, {"content-type":"text/plain"});
        res.end("Server is restarting..."); // TODO: a page with polling on "/" and go back when page is reachable again...
        return restart({timeout:10});
      } else {
        var content = '<p>Do you really want to restart this server?</p><form action="'+backend.config.route+ext.config.subRoute+'" method="POST"><input value="Yes, I want to restart my server now!" class="btn btn-danger" type="submit"/></form>';
        return backend.renderPage({
          request:req,
          title: "Amanecer Content Editor - Overview",
          onlyBody: ("onlyBody" in req.query),
          content: content
        }, function(err, html){
          if(err) return next(err);
          return res.end(html);
        });
      }
    }
    
    next();
  };
  
  var ext = cms.createExtension({package: require("./package.json")});
  
  ext.on("install", function(event){
    ext.config.subRoute = ext.config.subRoute || "/restart";
  });
  ext.on("uninstall", function(event){
  });
  
  ext.on("activate", function(event){
    // event.target; event.args
    var backend = cms.getExtension("backend");
    if(cms.requestMiddlewares.indexOf(router) === -1) {
      cms.requestMiddlewares.push(router);
    }
    backend.on("buildNavigation", buildNavigation);
    //backend.on("buildClientCSS", clientCSS);
    //backend.on("buildClientJS", clientJS);
  });
  
  ext.on("deactivate", function(event){
    // event.target; event.args
    var backend = cms.getExtension("backend");
    if(cms.requestMiddlewares.indexOf(router) !== -1) {
      cms.requestMiddlewares.splice(event.target.requestMiddlewares.indexOf(router), 1);
    }
    backend.removeListener("buildNavigation", buildNavigation);
    //backend.removeListener("buildClientCSS", clientCSS);
    //backend.removeListener("buildClientCSS", clientJS);
  });
  
  ext.middleware = router;
  
    
  return ext;
}