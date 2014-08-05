"use strict";

/*
  
  TODO:
    - caching (true / false)
    - manifest (true / false)
    
  

var mkSchemaFromView = function(view) { // TODO
  return view;
}
*/
var View = require("./view");
var Schema = require("./schema");
var Model = require("./model");
var QuerySet = require("./query-set");
var ContentElement = require("./ce");

module.exports = function(opts){
  if(!opts.cms) throw new Error("You have to specify the cms object");
  
  opts.ContentElement = opts.contentElement || {};
  opts.Schema = opts.Schema || {};
  opts.Model = opts.Model || {};
  opts.QuerySet = opts.QuerySet || {};
  opts.View = opts.View || {};

  return {
    ContentElement: ContentElement(opts.cms, opts.ContentElement),
    Schema: Schema(opts.cms, opts.Schema),
    Model: Model(opts.cms, opts.Model),
    QuerySet: QuerySet(opts.cms, opts.QuerySet),
    View: View(opts.cms, opts.View)
  };
}