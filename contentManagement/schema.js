"use strict";

var getRootJSONSchema = require("./rootJSONSchema");

module.exports = function(cms) {

  var View;
  
  var mkEditView = function(jsonSchema){
    var completeJSONSchema = getRootJSONSchema();
    completeJSONSchema.properties.data.properties.content.properties = jsonSchema;
    
    var view = new View({templatePath: __dirname+"/autoViews/edit.jade"});
    view.use(function(data, next){
      data.JSONSchema = completeJSONSchema;
      next();
    });
    return view;
    
  }

  var Schema = function(opts){
    View = cms.contentManagement.View;
    this.statics = opts.statics || {};
    this.methods = opts.methods || {};
    this.views = opts.views ||  {}; // registred methods for rendering
    
    this.backend = opts.backend || {};
    this.backend.edit = this.backend.edit || mkEditView(opts.jsonSchema);
    this.backend.create = this.backend.create || console.warn("TODO: make automatically a view for editing a node");
    this.backend.thumbnail = this.backend.thumbnail || console.warn("TODO: make automatically a view for editing a node");
    // TODO: auto create a backend view from json schema
    
    this.jsonSchema = opts.jsonSchema || {};
  };
  
  return Schema;
};