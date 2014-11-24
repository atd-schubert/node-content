"use strict";

var passport = require("passport");
// facebook

module.exports = function(cms){
  if(!cms) throw new Error("You have to specify the cms object");
  
  var router = function(req, res, next){
    if(!model) return next();
    if(req.method === "POST") return next();
    var url = req.url;
    
    model.findOne({url:req.url}, function(err, doc){
      if(err) return next(err);
      if(!doc) return next();
      
      if(doc.ttl && doc.ttl.getTime() < Date.now()) {
        ext.uncache(req.url, function(err){
          if(err) return console.error(err);
        });
        return next();
      }
      // TODO: if file not exists return next() and uncache
      if(req.headers["if-none-match"]) {
      }
      if(req.headers["if-none-match"] && doc.headers && doc.headers.etag && req.headers["if-none-match"]===doc.headers.etag){
        res.writeHead(304, doc.headers);
        return res.end();
      }
      
      // TODO: if(header.contentType missmatch) return next();
      
      var file = fs.createReadStream(ext.config.dumpPath+"/"+doc._id);
      res.writeHead(200, doc.headers);
      file.pipe(res);
    });
  };
  
  var store = cms.getExtension("mongoose-store");
  var schema = store.createSchema({
    url: {
      required: true,
      unique: true,
      type:String
    },
    headers: Object,
    ttl: Date // when it has to be deleted
  });
  
  var model;
  
  var ext = cms.createExtension({package: require("./package.json")});
  
  ext.on("install", function(event){
    var store = cms.getExtension("mongoose-store");
    ext.config.modelName = ext.config.modelName || "cache";
    ext.config.dumpPath = ext.config.dumpPath || __dirname+"/data";
    
    // TODO: create data dump path
    
    model = store.createModel(ext.config.modelName, schema);
    model.displayColumns = ["url", "_id"];
  });
  ext.on("uninstall", function(event){
    
  });
  
  ext.on("activate", function(event){
	  if(cms.requestMiddlewares.indexOf(router) === -1) {
		  cms.requestMiddlewares.unshift(router);
	  }
  });
  
  ext.on("deactivate", function(event){
	  if(cms.requestMiddlewares.indexOf(router) !== -1) {
		  cms.requestMiddlewares.splice(event.target.requestMiddlewares.indexOf(router), 1);
	  }
  });
  
  ext.cacheStream = function(opts, cb){
    if(!model) return cb(new Error("You have to activate this extension first."));
    if(!opts.url) return cb(new Error("You have to set an url to cache."));
    
    cb = cb || function(err){ if(err) console.error(err); };
    
    var doc = new model();
    doc.url = opts.url;
    if(opts.headers) {
      var headers = {};
      var hash;
      for (hash in opts.headers){
        headers[hash.toLowerCase()] = opts.headers[hash];
      }
      doc.headers = headers;
    }
    if(opts.ttl) {
      if(typeof opts.ttl === "number") doc.ttl = new Date(Date.now()+opts.ttl);
      else doc.ttl = opts.ttl;
    }
    var stream = fs.createWriteStream(ext.config.dumpPath+"/"+doc._id);
    doc.save(function(err, doc){
      if(err) return cb(err);
      cb(null, stream);
    });
    return stream;
  };
  
  ext.cacheData = function(opts, cb){
    cb = cb || function(err){if(err) console.error(err);};
    ext.cacheStream(opts, function(err, stream){
      if(err) return cb(err);
      stream.on("error", function(err){
        cb(err);
      });
      stream.end(opts.data);
      cb();
    });
  };
  
  ext.uncache = function(url, cb) {
    cb = cb || function(err){if(err) console.error(err);};
    model.findOne({url: url}, function(err, doc){
      if(!doc) return cb();
      // TODO: handle error if file not exists; if not simply remove doc...
      fs.unlink(ext.config.dumpPath+"/"+doc._id, function(err){
        if(err && err.message !== "// TODO: file not exists") return cb(err);
        doc.remove(function(err){
          if(err) return cb(err);
        });
      });
    });
  }
  
  ext.middleware = router;
  
  return ext;
}