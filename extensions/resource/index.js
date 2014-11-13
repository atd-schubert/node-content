"use strict";

/*
  
  E-Tag besteht aus Doc._id + Doc.__v;
  
*/
var fs = require("fs");
var jade = require("jade");
var mime = require("mime");
var Busboy = require("busboy");
var bodyParser = require("body-parser");


module.exports = function(cms, opts){ // TODO: maybe don't use opts at this place, use install args instead...
  if(!cms) throw new Error("You have to specify the cms object");
  
  var vanitize = (cms.getExtension("vanity-url") && cms.getExtension("vanity-url").renderVanityUrlLists) || function(a,b,c){c(null, "");};
  
  var buildNavigation = function(menu){
    menu.push({class:"ajaxBody", caption:"Resources", href:cms.getExtension("backend").config.route+ext.config.subRoute});
  };
  var schema = cms.store.Schema({
    alt: {
      type:String,
      required: true
    },
    mimetype: {
      type:String,
      required: true
      // TODO: match: /content-type/,
      // TODO make something like: ct:{base: "application", detail:"octett-stream"} for better searching like application/*, image/*...
    },
    filename: {
      type:String,
      required: false
      // TODO: match: /filename/,
    },
    tags: [{
      type:String
    }]
  });
  
  var model;
  
  var router = function(req, res, next){
    if(req.url.substr(0, cms.config.backend.route.length+cms.config.resource.subRoute.length) === cms.config.backend.route+cms.config.resource.subRoute) {
      
      var backend = cms.getExtension("backend");
      
      var action = req.url.substr(cms.config.backend.route.length+cms.config.resource.subRoute.length);
      
      if(/^\/?(\?[\w\W]*)?$/.test(action) || /^\/list\/?(\?[\w\W]*)?$/.test(action)) {
        return model.find({}, function(err, docs){
          if(err) return next(err);
          
          return res.end(backend.renderPage({onlyBody: ("onlyBody" in req.query), title: "Resource asset manager", content: jade.renderFile(__dirname+"/views/list.jade", {docs:docs, baseUrl:backend.config.route+ext.config.subRoute+"/"})/*, additionalScripts: '<script src="'+backend.config.route+ext.config.subRoute+'/script.js"></script><style>.input-group-addon {min-width:125px}</style>'*/}));
          
        });
        return res.end(backend.renderPage({onlyBody: ("onlyBody" in req.query), title: "Resource asset manager", content: jade.renderFile(__dirname+"/views/list.jade", {url: backend.config.route+ext.config.subRoute+"/create"}), additionalScripts: '<script src="'+backend.config.route+ext.config.subRoute+'/script.js"></script><style>.input-group-addon {min-width:125px}</style>'}));
      }
      console.log(action);
      if(/^\/edit\/[0-9a-f]{24}\/?(\?[\w\W]*)?$/.test(action)) {
        return model.findById(action.substr(6, 24), function(err, doc){
          if(err) return next(err);
          if(!doc) return next();
          
          
          
          if(req.method === "POST") {
            return bodyParser.urlencoded()(req, res, function(err){
              if(err) return next(err);
              var hash;
              for (hash in req.body) {
                if(hash === "tags") {
                  doc[hash] = req.body[hash];
                  req.body[hash] = req.body[hash].split(",");
                  var arr = [];
                  var tmp;
                  var i;
                  for (i=0; i<req.body[hash].length; i++) {
                    tmp = req.body[hash][i].trim();
                    if(tmp) arr.push(tmp);
                  }
                  req.body[hash] = arr;
                }
                doc[hash] = req.body[hash];
              }
              doc.save(function(err){
                if(err) return next(err);
                vanitize({model:ext.config.modelName, query:doc._id}, {}, function(err, snippet){
                  var content = jade.renderFile(__dirname+"/views/edit.jade", {
                    baseUrl:backend.config.route+ext.config.subRoute+"/",
                    entry: doc
                  });
                  content+=snippet;
                  return res.end(backend.renderPage({
                    onlyBody: ("onlyBody" in req.query),
                    title: "Resource asset manager", 
                    content: content,
                    additionalScripts: '<style>.input-group-addon {min-width:125px}</style><script src="'+backend.config.route+ext.config.subRoute+'/script.js"></script>'
                    })
                  );
                });
              });
            });
            
          }
          
          return vanitize({model:ext.config.modelName, query:doc._id}, {}, function(err, snippet){
            var content = jade.renderFile(__dirname+"/views/edit.jade", {
              baseUrl:backend.config.route+ext.config.subRoute+"/",
              entry: doc
            });
            content += snippet;
            return res.end(backend.renderPage({
              title: "Resource asset manager",
              content: content,
              onlyBody: ("onlyBody" in req.query), 
              additionalScripts: '<script src="'+backend.config.route+ext.config.subRoute+'/script.js"></script><style>.input-group-addon {min-width:125px}</style>'
            }));
          });
        });
        
      }
      if(/^\/remove\/[0-9a-f]{24}\/?(\?[\w\W]*)?$/.test(action)) {
        return model.findById(action.substr(8, 24), function(err, doc){
          if(err) return next(err);
          if(!doc) return next();
          
          if(req.method === "POST") {
            return fs.unlink(ext.config.dumpPath+"/"+doc._id, function(err){
              if(err) return next(err);
              doc.remove();
              return res.end(backend.renderPage({onlyBody: ("onlyBody" in req.query), title: "Resource asset manager", content: '<p>Resource removed... <a href="'+backend.config.route+ext.config.subRoute+'">go back to overview...</a></p>', /*additionalScripts: '<script src="'+backend.config.route+ext.config.subRoute+'/script.js"></script><style>.input-group-addon {min-width:125px}</style>'*/}));
            });
          }
          
          return res.end(backend.renderPage({onlyBody: ("onlyBody" in req.query), title: "Resource asset manager", content: jade.renderFile(__dirname+"/views/remove.jade", {baseUrl:backend.config.route+ext.config.subRoute+"/", entry: doc}), /*additionalScripts: '<script src="'+backend.config.route+ext.config.subRoute+'/script.js"></script><style>.input-group-addon {min-width:125px}</style>'*/}));
        });
        
        
      }
      if(/^\/create\/?(\?[\w\W]*)?$/.test(action)) {
        if(req.method === "POST") {
          var busboy = new Busboy({headers: req.headers});
          
          var doc = new model();
          
          var tmp = {};
          
          busboy.on("file", function(fieldname, file, filename, encoding, mimetype){
            if(fieldname != "file") return next(new Error("A file with wrong fieldname!"));
            var ws = fs.createWriteStream(ext.config.dumpPath+"/"+doc._id);
            file.pipe(ws);
            tmp.filename = filename;
            tmp.mimetype = mimetype;
          });
          busboy.on("field", function(fieldname, val, fieldnameTruncated, valTruncated){
            console.log("got field");
            if(fieldname === "tags") {
              val = val.split(",");
              var arr = [];
              var tmp;
              var i;
              for (i=0; i<val.length; i++) {
                tmp = val[i].trim();
                if(tmp) arr.push(tmp);
              }
              val = arr;
             }
            doc[fieldname] = val;
          });
          busboy.on("finish", function(){
            if(!doc.filename) doc.filename = tmp.filename;
            if(!doc.mimetype) doc.mimetype = tmp.mimetype;
            
            if(typeof doc.tags === "string") doc.tags = split(",");
            console.log("SAVE:", doc);
            return doc.save(function(err){
              if(err) return next(err);
              return res.end(backend.renderPage({title: "Resource asset manager", content: '<p>New Resource created... <a href="'+backend.config.route+ext.config.subRoute+'">go back to overview...</a></p>', /*additionalScripts: '<script src="'+backend.config.route+ext.config.subRoute+'/script.js"></script><style>.input-group-addon {min-width:125px}</style>'*/}));
            });
          });
          busboy.on("close", function(){
            console.log("Close");
          });
          req.on("close", function(){
            console.log("req-close");
          });
          
          return req.pipe(busboy)
          
          // TODO: create an entry in db
          // TODO: use busboy
          
          
        }
        return res.end(backend.renderPage({onlyBody: ("onlyBody" in req.query), title: "Resource asset manager", content: jade.renderFile(__dirname+"/views/create.jade", {url: backend.config.route+ext.config.subRoute+"/create"}), additionalScripts: '<script src="'+backend.config.route+ext.config.subRoute+'/script.js"></script><style>.input-group-addon {min-width:125px}</style>'}));
      }
      if(action === "script.js") {
        
        return fs.readFile(__dirname+"/assets/script.js", function(err, data){
          if(err) return next(err);
          res.writeHead(200, {"Content-Type":"application/javascript"});
          res.end(data.toString().split("var mimeTypes;").join("var mimeTypes = "+JSON.stringify(mime.types)+";"));
        });
      }
    }
    
    next();
  };
  
  var ext = cms.createExtension({package: require("./package.json")});
  
  ext.on("install", function(event){
    cms.config.resource = cms.config.resource || {};
    cms.config.resource.subRoute = cms.config.resource.subRoute || "/resource";
    cms.config.resource.modelName = cms.config.resource.modelName || "resource";
    cms.config.resource.modelName = cms.config.resource.modelName || "resource";
    cms.config.resource.dumpPath = cms.config.resource.dumpPath || __dirname+"/data";
    
    ext.config = cms.config.resource;
    
    if(!fs.existsSync(ext.config.dumpPath)) fs.mkdirSync(ext.config.dumpPath);
    
    model = cms.store.model(cms.config.resource.modelName, schema);
    model.displayColumns = ["filename", "mimetype", "alt"];
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
        var doc = content[0];
        return function(req, res, next){
          
          if(req.headers["if-none-match"]===doc._id+doc.__v+"json"){ 
            res.writeHead(304, {
              "Content-Type": doc.mimetype,
              "ETag": doc._id+doc.__v+"json"
            });
            return res.end();
          }
          
          res.writeHead(200, {
            "content-type": "application/json",
            "ETag": doc._id+doc.__v+"json"
          });
          return res.end(JSON.stringify(doc, null, 2));
        };
      },
      file: function(content){
        var doc = content[0];
        return function(req, res, next){
          if(req.headers["if-none-match"]===doc._id+doc.__v){ 
            res.writeHead(304, {
              "Content-Type": doc.mimetype,
              "ETag": doc._id+doc.__v,
              'Content-Disposition': 'inline; filename="'+doc.filename+'"'
            });
            return res.end();
          }
          
          var file = fs.createReadStream(ext.config.dumpPath+"/"+doc._id);
          res.writeHead(200, {
            "Content-Type": doc.mimetype,
            "ETag": doc._id+doc.__v,
            'Content-Disposition': 'inline; filename="'+doc.filename+'"'
          });
          //switch(content-type)
          file.pipe(res);
          
          return;
          res.send("Die Datei ist hier: '"+content.src+"' hat den CT: '"+content.contentType+"' und soll als '"+content.filename+"' ausgeliefert werden...")
        }
      },
      download: function(content){
        var doc = content[0];
        return function(req, res, next){
          if(req.headers["if-none-match"]===doc._id+doc.__v+"attachment"){ 
            res.writeHead(304, {
              "Content-Type": doc.mimetype,
              "ETag": doc._id+doc.__v+"attachment",
              'Content-Disposition': 'attachment; filename="'+doc.filename+'"'
            });
            return res.end();
          }
          
          var file = fs.createReadStream(ext.config.dumpPath+"/"+doc._id);
          res.writeHead(200, {
            "Content-Type": doc.mimetype,
            "ETag": doc._id+doc.__v+"attachment",
            'Content-Disposition': 'attachment; filename="'+doc.filename+'"'
          });
          //switch(content-type)
          file.pipe(res);
          
          return;
          res.send("Die Datei ist hier: '"+content.src+"' hat den CT: '"+content.contentType+"' und soll als '"+content.filename+"' ausgeliefert werden...")
        }
      },
      min: function(content){
        var doc = content[0];
        return function(req, res, next){
          if(req.headers["if-none-match"]===doc._id+doc.__v+"min"){ 
            res.writeHead(304, {
              "Content-Type": doc.mimetype,
              "ETag": doc._id+doc.__v+"min",
            'Content-Disposition': 'inline; filename="'+doc.filename+'"'
            });
            return res.end();
          }
          
          var file = fs.createReadStream(ext.config.dumpPath+"/"+doc._id);
          res.writeHead(200, {
            "Content-Type": doc.mimetype,
            "ETag": doc._id+doc.__v+"min",
            'Content-Disposition': 'inline; filename="'+doc.filename+'"'
          });
          //switch(content-type)
          file.pipe(res);
          
          return;
          res.send("Die Datei ist hier: '"+content.src+"' hat den CT: '"+content.contentType+"' und soll als '"+content.filename+"' ausgeliefert werden...")
        }
      },
      inlineHTML: function(content){ // TODO: get corresponding HTML snippet to include this snippet. img for image, svg inline, everything else as a link in an anchor.
        return function(req, res, next){
          var snippet = "";
          res.writeHead(200, {
            "content-type": "text/html"
          });
          res.end(JSON.stringify(content));
        }
      }
    };
    /*try{
      cms.getExtension("jschEditor").ignoreModel(ext.config.modelName);
    } catch(e){}*/
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
    cms.getExtension("backend").on("buildNavigation", buildNavigation);
  });
  
  ext.on("deactivate", function(event){
    // event.target; event.args
    if(cms.requestMiddlewares.indexOf(router) !== -1) {
      cms.requestMiddlewares.splice(event.target.requestMiddlewares.indexOf(router), 1);
    }
    cms.getExtension("backend").removeListener("buildNavigation", buildNavigation);
  });
  
  ext.middleware = router;
  
    
  return ext;
}