"use strict";

module.exports = function(opts){
  if(!opts.cms) throw new Error("You have to specify the cms object");
  var self = this;
  var cms = opts.cms;

  this.middleware = function(req, res, next){

// Backend
    if(req.url.substr(0, opts.backend.route.length) === opts.backend.route) { //backend
      // TODO: check for authentication first!
    
      if(req.url === opts.backend.route || req.url === opts.backend.route+"/") { // main page
        return res.send("// TODO: Backend Homepage...");
      }
      var queryStr = req.url.substr(opts.backend.route.length+1).split("/");
      
      var modelName = queryStr[0];
      var action = queryStr[1]; // is viewName
      var elemId = queryStr[2];
      
      var Model;
      
      //return res.send({model:modelName, action:action, id:elemId, view: viewName});
      
      if(!(modelName in cms.store.models)) return res.send("// TODO: Unknown model...");
      
      Model = cms.store.models[modelName];
      
      if(action === "create") {
        return res.send("// TODO: create and list page");
      } else if(action === "list") {
        return Model.find({}, function(err, data){return res.send(data);});
      } else {
        if(!("views" in Model) || !(action in Model.views)) return res.send("// TODO: unhandeled view");
        var view = Model.views[action];
        
        if(/^[0-9a-f]{24}$/.test(elemId)) {
          Model.findById(elemId, function(err, data){
            if(err) return next(err);
            view(data)(req, res, next);
          });
          return;
        }
        else if(elemId.split(":").length>1){
          var query = {};
          var arr = elemId.split(",");
          var i, tmp;
          for (i=0; i<arr.length; i++) {
            tmp = arr[i].split(":");
            query[unescape(tmp[0])] = unescape(tmp[1]);
          }
          
          Model.findOne(query, function(err, data){
            if(err) return next(err);
            view(data)(req, res, next);
          })
          return;
        }
      }
      console.log("Unahndled backend call", req);
      return res.send("//TODO Unreachable Backend URL!"); // return next(new Error(""));???
    }
    
// mayby a vanity url
    
/*
    var url = req.url;
    if(url.substr(-1)=== "/") url = url.substr(0, url.length-1);
    var tmp = {};
    tmp["data.resource.vanityUrls.routes."+url] = true;
    cms.findOneContentElement(tmp, function(err, ce){
      if(err) return next(err);
      if(!ce) return next();
      var i;
      var list = ce.data.resource.vanityUrls.list;
      for (i=0; i<list.length; i++) {
        if(list[i].route===url && ce.views[list[i].view]) {
          var ct = ce.getContentType(list[i].view);
          return ce.render(list[i].view, function(err, body){
            if(ce.data.resource.caching && ct === "text/html") {
              cms.cache.cache(url+"/index.html", body);
              if(ce.data.resource.cachingTtl) cms.cache.ttl(req.url, ce.data.resource.cachingTtl);
              delOnChange(ce._id, url+"/index.html");
            }
            var head = {"Content-Type": ct};
            var xss = ce.getAccessControlAllowOrigin(list[i].view);
            if(xss) head["Access-Control-Allow-Origin"] = xss;
            res.writeHead(200, head);
            res.end(body);
          });
        }
      }
      return next(); // should normally called never, only with wrong defines contentElements
    });//*/
  
// Frontend

/*
    if(req.url.substr(0, opts.route.length) === opts.route) { // is in cms path
      var queryStr = req.url.substr(opts.route.length+1);
      queryStr = queryStr.split("/");
      var elemId = queryStr[0];
      var view = queryStr[1];
      self.ContentElement.get(elemId, function(err, elem){
        if(err) return next(err);
        if(elem && elem.views[view]) {
          var ct = elem.getContentType(view);
          elem.render(view, function(err, body){
            if (err) return next(err);
            if(elem.data.resource.caching && ct === "text/html") { // TODO: add possibility to cache other resources then html
              cms.cache.cache(req.url+"/index.html", body);
              if(elem.data.resource.cachingTtl) cms.cache.ttl(req.url, elem.data.resource.cachingTtl);
              delOnChange(elem._id, req.url+"/index.html");
            }
            var head = {"Content-Type": ct};
            var xss = elem.getAccessControlAllowOrigin(view);
            if(xss) head["Access-Control-Allow-Origin"] = xss;
            res.writeHead(200, head);
            res.end(body);
          });
        }
        else next();
      });
    } //*/
  };
}