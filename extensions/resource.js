"use strict";

module.exports = function(cms, opts){ // TODO: maybe don't use opts at this place, use install args instead...
  if(!cms) throw new Error("You have to specify the cms object");
  
  var render = function(content){
	  return cms.getExtension("backend").renderPage();
  };
  var schema = cms.store.Schema({
    alt: {
      type:String,
      required: true
    },
    contentType: {
      type:String,
      required: true
      // TODO: match: /content-type/,
    },
    src: {
      type:String,
      required: true,
      unique: true
      // TODO: match: /path-pattern/,
    },
    filename: {
      type:String,
      required: false
      // TODO: match: /filename/,
    },
    thumbnail: {
      type:String,
      required: false
      // TODO: match: /path-pattern/,
    },
    tags: [{
      type:String
    }]
  });
  
  var model;
  
  var router = function(req, res, next){
	  if(req.url.substr(0, cms.config.backend.route.length+cms.config.resource.subRoute.length) === cms.config.backend.route+cms.config.resource.subRoute) {
	  
	    var action = req.url.substr(cms.config.backend.route.length+cms.config.resource.subRoute.length+1);
	    
	    if(/^\/?$/.test(action) || /^list\/?$/.test(action)) {
		    return res.send("// TODO: List all resources and give the ability to create a new one");
	    }
	    if(/^edit\/[0-9a-f]{24}\/?$/.test(action)) {
		    return res.send("// TODO: Edit a resource");
	    }
	    if(/^remove\/[0-9a-f]{24}\/?$/.test(action)) {
		    return res.send("// TODO: Remove a resource");
	    }
	    if(/^create\/?$/.test(action)) {
		    return res.send("// TODO: Create a resource");
	    }
	  }
	  
	  next();
	  
  };
  
  var ext = cms.createExtension({package: {name: "resource"}});
  
  ext.on("install", function(event){
    cms.config.resource = cms.config.resource || {};
    cms.config.resource.subRoute = cms.config.resource.subRoute || "/resource";
    cms.config.resource.modelName = cms.config.resource.modelName || "resource";
    
    model = cms.store.model(cms.config.resource.modelName, schema);
    model.jsonSchema = {
	    id: "http://nc.atd-schubert.com/resource",
	    definitions: {},
	    type: ["string", "object"],
	    pattern: "^[0-9a-f]{24}$",
	    additionalProperties: false,
	    properties: {}
	  };
    model.views = {
	    json: function(content){
	      return function(req, res, next){
	        res.writeHead(200, {
	          "content-type": "application/json"
	        });
	        return res.send(content[0]);
	      };
	    },
	    file: function(content){
	      return function(req, res, next){
	        var file = fs.createReadStream(content[0].src);
	        res.writeHead(200, {
	          "content-type": content.contentType
	        });
	        
	        file.pipe(res);
	        
	        return;
	        res.send("Die Datei ist hier: '"+content.src+"' hat den CT: '"+content.contentType+"' und soll als '"+content.filename+"' ausgeliefert werden...")
	      }
	    },
	    list: function(content){
	      return function(req, res, next){
	        res.writeHead(200, {
	          "content-type": "application/json"
	        });
	        res.end(JSON.stringify(content));
	      }
	    },
	    create: function(content){
	      return function(req, res, next){      
	        res.writeHead(200, {
	          "content-type": "text/html"
	        });
	        
	        if(req.method==="POST") {
		        
		        return res.end("Daten empfangen");
	        }
	        
	        res.end('<html><body><form method="POST" action="'+req.url+'"><input type="submit" value="senden..."/></form></body></html>');
	      }
	    }
	  };
  });
  ext.on("uninstall", function(event){
    ext.deactivate();
    if(event.args && event.args.all) delete cms.config.backend;
    
    // TODO: remove model...
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
  
    
  return ext;
}