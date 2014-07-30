"use strict";

var Schema = function(opts){
  this.statics = opts.statics || {};
  this.methods = opts.methods || {};
  this.views = opts.views ||  {}; // registred methods for rendering
  
  this.backend = opts.backend || {};
  this.backend.edit = this.backend.edit || console.warn("TODO: make automatically a view for editing a node");
  this.backend.create = this.backend.create || console.warn("TODO: make automatically a view for editing a node");
  this.backend.thumbnail = this.backend.thumbnail || console.warn("TODO: make automatically a view for editing a node");
  // TODO: auto create a backend view from json schema
  
  this.jsonSchema = opts.jsonSchema || {};
};

module.exports = Schema;