"use strict";

var fs = require("fs");
var async = require("async");

var View = function(opts){
  if(!opts) throw new Error("You have to set options to the view");
  if(!opts.renderFn && !opts.template && !opts.templatePath) throw new Error("You have to set a render-function or an engine for the view class");
  
  var contentType = opts.contentType || "text/html"
  
  var renderFn = opts.renderFn;
  var middlewares = opts.middlewares || [];
  
  if(!renderFn) {
    var engine = opts.engine || require("jade");
    if(engine.compile && engine.compileFile) {
      if(opts.template) renderFn = engine.compile(opts.template);
      else if(opts.templatePath) renderFn = engine.complileFile(opts.templatePath);
    } else { // Not a templating engine that is able to compile...
      var template = opts.template || fs.readFileSync(opts.templatePath);
      renderFn = function(data){
        return engine.render(template, data);
      };
    }
    
  }
  
  this.use = function(middleware){
    middlewares.push(middleware);
  };
  this.render = function(data, cb){
    var mws = [];
    var i;
    for(i=0; i<middlewares.length; i++) {
      mws.push(async.apply(middlewares[i], data));
    }
    async.series(mws, function(err){
      if(err) return cb(err);
      cb(null, renderFn(data));
    });
  };
  this.getContentType = function(){
    return contentType;
  };
  
};


module.exports = View;