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
ContentElement.create = function(data, cb){}; // ???
ContentElement.get = function(_id, cb){
  // fetch node
  
  //return new ContentElement();
};
//ContentElement.delete = function(_id, cb){};
//ContentElement.edit = function(_id, opts, cb){}; // opts with set{...}
//ContentElement.query = function(opts, cb){}; //


module.exports = {
  ContentElement: ContentElement,
  Schema: Schema,
  Model: Model,
  QuerySet: QuerySet,
  View: View
};