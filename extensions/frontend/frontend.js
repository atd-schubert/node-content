"use strict";

var ContentStream = require("./contentStream");
var md5 = require("MD5");

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

module.exports = function(cms, opts){
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
      var response;
      
      obj = obj || {};
      
      obj.view = self;
      
      obj.request = obj.request || {};
      obj.request.headers = obj.request.headers || {};
      
      
      if(obj.response) response = obj.response;
      obj.response = new ContentStream({pipeHead: true, cutOnEnd:true});
      obj.response.writeHead = function(code, headers){
        console.log("asfa", arguments);
        headers = headers || {};
        if(self.autoEtag && obj.content && obj.content.length > 0) {
          var etag = ext.calcETag(obj.content);
          if(etag) headers.etag = etag + name;
        }
        if(self.autoNotModified && obj.request.headers["if-none-match"] === headers.etag) {
          obj.response.emit("writeHead", 304, headers);
          obj.response.end();
          
          obj.response.write = function(){};
          obj.response.end = function(){};
          
          return; 
        }
        obj.response.emit("writeHead", code, headers);
      };
      if(response) obj.response.pipe(response);
      
      obj.getContent = obj.getContent = function(cb){
        var content = "";
        obj.response.on("data", function(data){
          content += data.toString();
        })
        obj.response.on("end", function(data){
          content += data.toString();
          cb(null, content);
        });
        obj.response.on("error", function(err){
          cb(err);
        });
      };
      if(false && self.autoCache && cms.getExtension("cache") && obj.request.url) { // TODO: 
        obj.response.on("writeHead", function(code, headers){
          var cacheStream = cms.getExtension("cache").cacheStream({url:obj.request.url, headers: headers});
          obj.response.pipe(cacheStream);
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
	    res.on("error", function(err){
  	    return next(err);
	    });
	    var stream = ext.streamContent(arr[0], arr[1], arr[2], {request:req, response:res});
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
  ext.streamContent = function(modelName, viewName, query, opts){
    var store = cms.getExtension("mongoose-store");
    var response = opts && opts.response;
    var stream = new ContentStream({killHead: true, pipeHead: true, withWriteHead: true, cutOnEnd:true});
    
    if(response) stream.pipe(response);
    
    opts.response = stream;
    
    var model = store.getModel(modelName);
    if(!model) return stream.error(new Error("Unknown model '"+modelName+"'"));
    
    if(typeof model.getView !== "function") return stream.error(new Error("The model '"+modelName+"' has no views"));
    var view = model.getView(viewName);
    if(!view) return stream.error(new Error("Unknown view '"+viewName+"' in model '"+modelName+"'"));
    
    model.find(mkQuery(query), function(err, data){
      if(err) return stream.error(err);
      opts.content = data;
      view.render(opts).response.pipe(stream);
    });
    return stream;
  };
  /*
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
  };*/
  
  ext.calcETag = function(content, salt){
    salt = salt || ", ";
    var i;
    var rg = [];
    if(Array.prototype.isPrototypeOf(content)) {
      for (i=0; i<content.length; i++) {
        if(!("_id" in content[i]) ||!("__v" in content[i])) return false;
        rg.push(content[i]._id.toString());
        rg.push(content[i].__v.toString());
      }
    } else {
      return ext.calcETag([content], salt);
    }
    console.log(rg.join(salt));
    return md5(rg.join(salt));
  }
  
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