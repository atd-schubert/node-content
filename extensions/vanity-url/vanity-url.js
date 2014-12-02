"use strict";

var jade = require("jade");
var fs = require("fs");
var bodyParser = require("body-parser");

module.exports = function(cms){
  if(!cms) throw new Error("You have to specify the cms object");
  
  var clientCSS = function(obj){
    fs.readFile(__dirname+"/assets/style.css", obj.collector());
  };
  var clientJS = function(obj){
    var cb = obj.collector();
    var backend = cms.getExtension("backend");
    fs.readFile(__dirname+"/assets/script.js", function(err, data){
      if(err) return cb(err);
      data = data.toString().split('//route: "__vanityRoute__"').join('route: "'+backend.config.route+ext.config.subRoute+'"');
      cb(null, data);
    });
  };
  var store = cms.getExtension("mongoose-store");
  var schema = store.createSchema({
    url: {
      type: String,
      required: true,
      unique: true
    },
    model: {
      type: String,
      required: true
    },
    view: {
      type: String,
      required: true
    },
    query: {
      type: String
    }
  });
  
  var model;
  
  var router = function(req, res, next){
    var backend = cms.getExtension("backend");
    var regex = new RegExp(
      "^" + 
      backend.config.route.split("/").join("\\/") +
      ext.config.subRoute.split("/").join("\\/")
    );
    if(req.url.substr(0, backend.config.route.length+ext.config.subRoute.length) === backend.config.route+ext.config.subRoute) {
      // add, forceadd, remove
      var action = req.url.substr(backend.config.route.length+ext.config.subRoute.length);
      
      if(/^\/?(\?[\w\W]*)?$/.test(action)) {
        if("json" in req.query || req.headers["accept"].split(",").indexOf(/^application\/json( ?; ?q=1(.0)?)?$/) > 0) {
          return model.find({}, function(err, docs){
            if(err) return next(err);
            res.writeHead(200, {"Content-Type": "application/json"});
            return res.end(JSON.stringify(docs));
          });
          
        }
        return ext.renderVanityUrlLists({}, {}, function(err, html){
          return backend.renderPage({
            request: req,
            content: '<h1>List of all vanity Urls</h1>'+html,
            onlyBody: "onlyBody" in req.query,
            onlyStatus: "onlyStatus" in req.query,
            title: "VanityUrl list"
          }, function(err, html){
            if(err) return next(err);
            return res.end(html);
          });
        });
      }
      if(/^\/add\/?(\?[\w\W]*)?$/.test(action)) {
        if(req.method === "POST") {
          return bodyParser.urlencoded()(req, res, function(err){
            if(err) return next(err);
            
            ext.add(req.body, function(err, doc){
              if(err && err.message.indexOf("duplicate key error")>=0) {
                res.writeHead(200, {"content-type": "application/json"});
                return res.end(JSON.stringify({status: "duplicate url", doc:doc}));
              }
              if(err) return next(err);
              res.writeHead(200, {"content-type": "application/json"});
              res.end(JSON.stringify({status: "OK", doc:doc}));
            });
          });
        }
        // ext.add({url:url, model:model, view:view, query:query}, function(err, doc){});
      }
      if(/^\/forceadd\/?(\?[\w\W]*)?$/.test(action)) {
        
        if(req.method === "POST") {
          return bodyParser.urlencoded()(req, res, function(err){
            if(err) return next(err);
            
            req.body.force = true;
            ext.add(req.body, function(err, doc){
              if(err) return next(err);
              res.writeHead(200, {"content-type": "application/json"});
              res.end(JSON.stringify({status: "OK", doc:doc}));
            });
          });
        }
      }
      if(/^\/edit\/?(\?[\w\W]*)?$/.test(action)) {
        if(req.method === "POST") {
          return bodyParser.urlencoded()(req, res, function(err){
            if(err) return next(err);
            // console. log(req.body._id, req.body._id.length, "546501538a4255bd61819c3b".length, req.body._id === "546501538a4255bd61819c3b")
            model.findById(req.body._id, function(err, doc){
              if(err) return next(err); // TODO: make a json status...
              if(!doc) return console.error("No doc!");
              var hash;
              for(hash in req.body) if(hash !== "_id") doc[hash] = req.body[hash];
              
              doc.save(function(err){
                if("json" in req.query || req.headers["accept"].split(",").indexOf(/^application\/json( ?; ?q=1(.0)?)?$/) > 0) {
                  res.writeHeader(200, {"content-type": "application/json"}); // TODO: error on error...
                  var status = (err && err.message) || "OK";
                  return res.end(JSON.stringify({status: status, doc:doc}));
                } else {
                  if(err) return next(err); // TODO: handle two 
                  var content = "<p>Vanity-Url '"+doc.url+"' changed</p>"
                }
              });
              
            });
          });
        }
      }
      if(/^\/remove\/?(\?[\w\W]*)?$/.test(action)) {
        if(req.method === "POST") {
          return bodyParser.urlencoded()(req, res, function(err){
            if(err) return next(err);
            // console. log(req.body._id, req.body._id.length, "546501538a4255bd61819c3b".length, req.body._id === "546501538a4255bd61819c3b")
            model.findById(req.body._id, function(err, doc){
              if(err) return next(err); // TODO: make a json status...
              if(!doc) return console.error("No doc!");
              
              doc.remove(function(err){
                if("json" in req.query || req.headers["accept"].split(",").indexOf(/^application\/json( ?; ?q=1(.0)?)?$/) > 0) {
                  res.writeHeader(200, {"content-type": "application/json"}); // TODO: error on error...
                  var status = (err && err.message) || "OK";
                  return res.end(JSON.stringify({status: status}));
                } else {
                  if(err) return next(err); // TODO: handle two 
                  var content = "<p>Vanity-Url '"+doc.url+"' removed</p>"
                }
              });
              
            });
          });
        }
      }
      
      //return res.send("add, forceadd, remove");
    };
    
    ext.getByUrl(req.url, function(err, doc){
      var frontend = cms.getExtension("frontend");
      if(err && err.err === "Can not find vanityUrl" || !doc) return next();
      if(err) return next(err);
      res.on("error", function(err){return next(err);});
      return frontend.streamContent(doc.model, doc.view, doc.query, {response:res, request: req});
    });
  };
  
  var ext = cms.createExtension({package: require("./package.json")});
  var logger = cms.getExtension("winston").createLogger(ext.name);
  
  ext.on("install", function(event){
    ext.config.modelName = ext.config.modelName || "vanityUrl";
    ext.config.subRoute = ext.config.subRoute || "/vanityUrl";
    
    var store = cms.getExtension("mongoose-store");
    model = store.createModel(ext.config.modelName, schema);
    model.displayColumns = ["url", "model", "view", "query"];
  });
  ext.on("uninstall", function(event){
    
    // TODO: remove model...
  });
  
  ext.on("activate", function(event){
    // event.target; event.args
    var backend = cms.getExtension("backend");
    if(cms.requestMiddlewares.indexOf(router) === -1) {
      cms.requestMiddlewares.push(router);
    }
    backend.on("buildClientCSS", clientCSS);
    backend.on("buildClientJS", clientJS);
  });
  
  ext.on("deactivate", function(event){
    // event.target; event.args
    var backend = cms.getExtension("backend");
    if(cms.requestMiddlewares.indexOf(router) !== -1) {
      cms.requestMiddlewares.splice(event.target.requestMiddlewares.indexOf(router), 1);
    }
    backend.removeListener("buildClientCSS", clientCSS);
    backend.removeListener("buildClientCSS", clientJS);
  });
  
  ext.middleware = router;
  
  ext.add = function(data, cb){
    if(!cb) cb = function(err){console.error(err)};
    
    if(!model) cb(new Error("VanityUrl extension has to be installed first"));
    
    var doc = new model(data);
    if(data.force) doc.save(function(err){
      if(err) console.error("VANITYURL_ERROR", err);
      if(err && err.message.indexOf("duplicate key error")>=0) {
        return ext.removeByUrl(data.url, function(err){
          if(err) return cb(err);
          return doc.save(cb);
        });
      }
      
      // if(duplicate) model.findOne({url:data.url}, function(err, old){old.remove(); doc.save(cb)});
      // else ...
      return cb(err, doc);
    });
    else return doc.save(cb);
    
    /*            var doc = new model(req.body);
            
            doc.save(function(err){
              if("json" in req.query || req.headers["accept"].split(",").indexOf(/^application\/json( ?; ?q=1(.0)?)?$/) > 0) {
                res.writeHeader(200, {"content-type": "application/json"});
                var status;
                if(err && err.message.indexOf("duplicate key")>0) status = "duplicate url";
                else status = "OK"
                return res.end(JSON.stringify({status: status, doc:doc}));
              } else {
                if(err) return next(err); // TODO: handle two 
                var content = "<p>Vanity-Url '"+doc.url+"' created</p>"
              }
            });*/
  };
  ext.removeByUrl = function(url, cb){
    if(!cb) cb = function(err){console.error(err)};
    
    if(!model) cb(new Error("VanityUrl extension has to be installed first"));
    
    ext.getByUrl(url, function(err, doc){
      if(err) return cb(err);
      doc.remove();
      cb(null, true);
    }, true);
  };
  ext.getByUrl = function(url, cb, strict){
    if(!cb) throw new Error("The get functions has to have a callback!");
    if(!model) cb(new Error("VanityUrl extension has to be installed first"));
    
    model.findOne({url: url}, function(err, doc){
      if(err) return cb(err);
      if(!doc) {
        if(strict) return cb(new Error("Can not find vanityUrl"));
        
        if(url.substr(-1)==="/") {
          return model.findOne({url: url.substr(0, url.length-1)}, function(err, doc){
            if(!doc) return cb(new Error("Can not find vanityUrl"));
          });
        } else {
          return model.findOne({url: url+"/"}, function(err, doc){
            if(!doc) return cb(new Error("Can not find vanityUrl"));
          });
        }
      }
      cb(null, doc);
    });
  };
  ext.query = function(query, cb){
    model.find(query, cb);
  };
  ext.renderVanityUrlLists = function(query, opts, cb){
    ext.query(query, function(err, docs){
      if(err) return cb(err);
      cb(null, jade.renderFile(__dirname+"/views/list.jade", {docs:docs, opts:opts}));
    });
  };
  
  ext.model = model;
  
  return ext;
}