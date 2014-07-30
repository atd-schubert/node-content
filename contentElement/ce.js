"use strict";

var Model = require("./model");

var ContentElement = function(node){
  // TODO: edit, delete, etc...
  var model = Model.getModel(node.name);
  var schema = model.schema;

  // set methods
  var hash;
  for (hash in schema.methods) {
    this[hash] = schema.methods[hash];
  }

  this.views = schema.views;
  this.backend = schema.backend;
  this.model = model;

  this.__defineGetter__('class', function(){
  	return node.class;
  });
  this.__defineSetter__('class', function(val){
  	return node.setClass(val);
  });
  this.__defineGetter__('id', function(){
  	return node.id;
  });
  this.__defineSetter__('id', function(val){
  	return node.setClass(val);
  });
  this.__defineGetter__('_id', function(){
  	return node._id;
  });
  this.__defineSetter__('_id', function(val){
  	return new Error('It isn\'t allowed to set the property _id!');
  });
  this.__defineGetter__('data', function(){
  	return node.data;
  });
  this.__defineSetter__('data', function(val){
  	return node.setData(val);
  });
  this.__defineGetter__('childNodes', function(){
  	return node.childNodes;
  });
  this.__defineSetter__('childNodes', function(val){
  	return node.setChildNodes(val);
  });
  this.__defineGetter__('name', function(){
  	return node.name;
  });
  this.__defineSetter__('name', function(val){
  	return node.setName(val);
  });

  this.save = function(cb, opts){node.save(cb, opts)};
  this.delete = function(cb, opts){node.delete(cb, opts)};
};

module.exports = ContentElement;