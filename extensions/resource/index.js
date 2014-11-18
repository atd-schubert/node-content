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
  
  var vanitize = function(a,b,c){
    console.log("VN",b);
    if(cms.getExtension("vanity-url") && cms.getExtension("vanity-url").renderVanityUrlLists) return cms.getExtension("vanity-url").renderVanityUrlLists(a,b,c);
    return c(null, "");
  };
  
  var clientCSS = function(obj){
    fs.readFile(__dirname+"/assets/style.css", obj.collector());
  };
  var clientJS = function(obj){
    var cb = obj.collector();
    var backend = cms.getExtension("backend");
    fs.readFile(__dirname+"/assets/script.js", function(err, data){
      if(err) return cb(err);
      data = data.toString().split('var mimeTypes;').join("var mimeTypes = "+JSON.stringify(mime.types)+";");
      cb(null, data);
    });
  };
  
  var buildNavigation = function(menu){
    menu.push({class:"ajaxBody", caption:"Resources", href:cms.getExtension("backend").config.route+ext.config.subRoute});
  };
  var frontend = cms.getExtension("frontend");
  var schema = frontend.createSchema({
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
    var backend = cms.getExtension("backend");
    if(req.url.substr(0, backend.config.route.length+ext.config.subRoute.length) === backend.config.route+ext.config.subRoute) {
      var action = req.url.substr(backend.config.route.length+ext.config.subRoute.length);
      
      if(/^\/?(\?[\w\W]*)?$/.test(action) || /^\/list\/?(\?[\w\W]*)?$/.test(action)) {
        return model.find({}, function(err, docs){
          if(err) return next(err);
          
          return res.end(backend.renderPage({onlyBody: ("onlyBody" in req.query), title: "Resource asset manager", content: jade.renderFile(__dirname+"/views/list.jade", {docs:docs, baseUrl:backend.config.route+ext.config.subRoute+"/"})}));
          
        });
        return res.end(backend.renderPage({onlyBody: ("onlyBody" in req.query), title: "Resource asset manager", content: jade.renderFile(__dirname+"/views/list.jade", {url: backend.config.route+ext.config.subRoute+"/create"})}));
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
                vanitize({model:ext.config.modelName, query:doc._id}, {models:[ext.config.modelName], querys: [doc._id], views:["min", "file", "", "download"]}, function(err, snippet){
                  var content = jade.renderFile(__dirname+"/views/edit.jade", {
                    baseUrl:backend.config.route+ext.config.subRoute+"/",
                    entry: doc
                  });
                  if(snippet) content += "<h2>Vanity URLs</h2>"+snippet;
                  return res.end(backend.renderPage({
                    onlyBody: ("onlyBody" in req.query),
                    title: "Resource asset manager", 
                    content: content
                    })
                  );
                });
              });
            });
            
          }
          
          return vanitize({model:ext.config.modelName, query:doc._id}, {models:[ext.config.modelName], querys: [doc._id], views:["min", "file", "", "download"]}, function(err, snippet){
            var content = jade.renderFile(__dirname+"/views/edit.jade", {
              baseUrl:backend.config.route+ext.config.subRoute+"/",
              entry: doc
            });
            content += "<h2>Vanity URLs</h2>"+snippet;
            return res.end(backend.renderPage({
              title: "Resource asset manager",
              content: content,
              onlyBody: ("onlyBody" in req.query)
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
              return res.end(backend.renderPage({onlyBody: ("onlyBody" in req.query), title: "Resource asset manager", content: '<p>Resource removed... <a href="'+backend.config.route+ext.config.subRoute+'">go back to overview...</a></p>'}));
            });
          }
          
          return res.end(backend.renderPage({onlyBody: ("onlyBody" in req.query), title: "Resource asset manager", content: jade.renderFile(__dirname+"/views/remove.jade", {baseUrl:backend.config.route+ext.config.subRoute+"/", entry: doc})}));
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
              return res.end(backend.renderPage({title: "Resource asset manager", content: '<p>New Resource created... <a href="'+backend.config.route+ext.config.subRoute+'">go back to overview...</a></p>'}));
            });
          });
          busboy.on("close", function(){
            console.log("Close");
          });
          req.on("close", function(){
            console.log("req-close");
          });
          
          return req.pipe(busboy)
          
          
        }
        return res.end(backend.renderPage({onlyBody: ("onlyBody" in req.query), title: "Resource asset manager", content: jade.renderFile(__dirname+"/views/create.jade", {url: backend.config.route+ext.config.subRoute+"/create"})}));
      }
    }
    
    next();
  };
  
  var ext = cms.createExtension({package: require("./package.json")});
  
  ext.on("install", function(event){
    var frontend = cms.getExtension("frontend");
    ext.config.subRoute = ext.config.subRoute || "/resource";
    ext.config.modelName = ext.config.modelName || "resource";
    ext.config.modelName = ext.config.modelName || "resource";
    ext.config.dumpPath = ext.config.dumpPath || __dirname+"/data";
    
    if(!fs.existsSync(ext.config.dumpPath)) fs.mkdirSync(ext.config.dumpPath);
    
    model = frontend.createModel(ext.config.modelName, schema);
    model.displayColumns = ["filename", "mimetype", "alt"];
    model.jsonSchema = {
      id: "http://nc.atd-schubert.com/resource",
      definitions: {},
      type: ["string", "object"],
      pattern: "^[0-9a-f]{24}$",
      additionalProperties: false,
      properties: {}
    };
    model.addView(frontend.createView("json", function(obj){
      var doc = obj.content[0];
      var req = obj.request;
      var res = obj.result;
      
      /*if(req.headers["if-none-match"]===doc._id+doc.__v+"json"){ 
        res.writeHead(304, {
          "Content-Type": doc.mimetype,
          "ETag": doc._id+doc.__v+"json"
        });
        return res.end();
      }*/
      res.writeHead(200, {
        "content-type": "application/json"
      });
      return res.end(JSON.stringify(doc, null, 2));
    }));
    model.addView(frontend.createView("file", function(obj){
      var doc = obj.content[0];
      var req = obj.request;
      var res = obj.result;
      
      var file = fs.createReadStream(ext.config.dumpPath+"/"+doc._id);
      res.writeHead(200, {
        "Content-Type": doc.mimetype,
        'Content-Disposition': 'inline; filename="'+doc.filename+'"'
      });
      file.pipe(res);
      return;
    }));
    model.addView(frontend.createView("download", function(obj){
      var doc = obj.content[0];
      var req = obj.request;
      var res = obj.result;
      
      var file = fs.createReadStream(ext.config.dumpPath+"/"+doc._id);
      res.writeHead(200, {
        "Content-Type": doc.mimetype,
        'Content-Disposition': 'attachment; filename="'+doc.filename+'"'
      });
      file.pipe(res);
      return;
    }));
    model.addView(frontend.createView("min", function(obj){
      var doc = obj.content[0];
      var req = obj.request;
      var res = obj.result;
      
      var file = fs.createReadStream(ext.config.dumpPath+"/"+doc._id);
      res.writeHead(200, {
        "Content-Type": doc.mimetype,
        'Content-Disposition': 'inline; filename="'+doc.filename+'"'
      });
      file.pipe(res); // TODO: minify by specific contenttype
      return;
    }));
    // TODO: maybe add inlineHTML
    
    /*try{
      cms.getExtension("jschEditor").ignoreModel(ext.config.modelName);
    } catch(e){}*/
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
    backend.on("buildNavigation", buildNavigation);
    backend.on("buildClientCSS", clientCSS);
    backend.on("buildClientJS", clientJS);
  });
  
  ext.on("deactivate", function(event){
    // event.target; event.args
    var backend = cms.getExtension("backend");
    if(cms.requestMiddlewares.indexOf(router) !== -1) {
      cms.requestMiddlewares.splice(event.target.requestMiddlewares.indexOf(router), 1);
    }
    backend.removeListener("buildNavigation", buildNavigation);
    backend.removeListener("buildClientCSS", clientCSS);
    backend.removeListener("buildClientCSS", clientJS);
  });
  
  ext.middleware = router;
  
    
  return ext;
}