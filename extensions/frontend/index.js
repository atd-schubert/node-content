"use strict";

var ContentStream = require("./contentStream");

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
  
  var View = function(name, fn, opts){
    if(typeof name !== "string") throw new Error("The view has to have a name");
    if(typeof fn !== "function") throw new Error("The view has to have a render function");
    opts = opts || {};
    var self = this;
    
    //this.autoCache = true;
    this.autoEtag = true;
    this.autoNotModified = true;
    
    // overwrite with opts
    var hash;
    for(hash in opts) {
      this[hash] = opts;
    }
    
    // functions (Can't be overwritten!)
    this.getName = function(){return name};
    this.render = function(obj){
      var result;
      
      obj = obj || {};
      
      obj.view = self;
      
      obj.request = obj.request || {};
      obj.request.headers = obj.request.headers || {};
      
      
      if(obj.result) result = obj.result;
      obj.result = new ContentStream();
      obj.result.writeHead = function(code, headers){
        headers = headers || {};
        if(self.autoEtag && obj.content && obj.content.length === 1 && ("_id" in obj.content[0]) && ("__v" in obj.content[0])) {
          headers.etag = headers.etag || obj.content[0]._id + obj.content[0].__v + name;
        }
        if(self.autoNotModified && obj.request.headers["if-none-match"] === headers.etag) {
          obj.result.emit("writeHead", 304, headers);
          obj.result.end();
          
          obj.result.write = function(){};
          obj.result.end = function(){};
          
          return; 
        }
        obj.result.emit("writeHead", code, headers);
      };
      if(result) {
        obj.result.pipe(result);
        obj.result.on("writeHead", function(code, headers){
          if(result && result.writeHead && typeof result.writeHead === "function") result.writeHead(code, headers);
        });
      }
      
      obj.getContent = obj.getContent = function(cb){
        var content = "";
        obj.result.on("data", function(data){
          content += data.toString();
        })
        obj.result.on("end", function(data){
          content += data.toString();
          cb(null, content);
        });
        obj.result.on("error", function(err){
          cb(err);
        });
      };
      if(self.autoCache && cms.getExtension("cache") && obj.request.url) {
        obj.result.on("writeHead", function(code, headers){
          var cacheStream = cms.getExtension("cache").cacheStream({url:obj.request.url, headers: headers});
          obj.result.pipe(cacheStream);
        });
        
      }
      
      fn(obj);
      return obj;
    };
  };
  
  var frontendRouter = function(req, res, next){
    var store = cms.getExtension("mongoose-store");
	  if(req.url.substr(0, ext.config.route.length) === ext.config.route) {
	    var arr = req.url.substr(ext.config.route.length+1).split("/");
	    if(arr.length<2) return next();
	    
	    var model = store.getModel(arr[0]);
      if(!model) return next(new Error("Unknown model '"+arr[0]+"'"));
      
      if(typeof model.getView !== "function") return next(new Error("The model '"+arr[0]+"' has no views"));
      var view = model.getView(arr[1]);
      if(!view) return next(new Error("Unknown view '"+arr[1]+"' in model '"+arr[0]+"'"));
      
      return model.find(mkQuery(arr[2]), function(err, data){
        if(err) return next(err);
        var stream = view.render({content:data, request:req, result:res});
      });
	  } else {
		  next();
	  }
	  
  };
  
  var ext = cms.createExtension({package: require("./package.json")});
  
  ext.createSchema = function(obj){
    var store = cms.getExtension("mongoose-store");
    return store.createSchema(obj);
  };
  ext.getModel = function(name){
    var store = cms.getExtension("mongoose-store");
    return store.getModel(name);
  };
  ext.createModel = function(name, schema){
    var store = cms.getExtension("mongoose-store");
    var model = store.createModel(name, schema);
    var views = {};
    model.addView = function(view){
      if(views[view.getName()]) return false;
      views[view.getName()] = view;
      return true;
    };
    model.getView = function(name){
      return views[name];
    };
    return model;
  };
  ext.createView = function(name, fn, opts){
    return new View(name, fn, opts);
  };
    
  ext.getContent = function(modelName, viewName, query, cb){ // TODO: verify...
    var store = cms.getExtension("mongoose-store");
    var model = store.getModel(modelName);
    if(!model) return cb(new Error("Unknown model '"+model+"'"));
    
    if(typeof model.getView !== "function") return cb(new Error("The model '"+model+"' has no views"));
    var view = model.getView(viewName);
    if(!view) return cb(new Error("Unknown view '"+view+"' in model '"+model+"'"));
    
    return model.find(query, function(err, data){
      if(err) return cb(err);
      var packets = [];
      var stream = view.render({content:data});
      stream.on("data", function(data){
        packets.push(data.toString());
      });
      stream.on("end", function(data){
        cb(null, packets.join(""));
      });
    });
  };
  
  ext.on("install", function(event){
    ext.config.route = ext.config.route || "/cms";
  });
  ext.on("uninstall", function(event){
    
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