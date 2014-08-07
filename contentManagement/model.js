"use strict";

var getRootJSONSchema = require("./rootJSONSchema");

module.exports = function(cms){

  var Model = function(name, schema){
    if(Model.getModel(name)) throw new Error("there is already a Model with the name: '"+name+"'");
    Model.models[name] = this;
    
    var self = this;
    var hash;
    for(hash in schema.statics) {
      this[hash] = schema.statics[hash];
    }
    this.schema = schema;
    this.name = name;
    
    var completeJSONSchema = getRootJSONSchema();
    completeJSONSchema.properties.data.properties.content.properties = schema.jsonSchema;
    
    cms.store.setSchema(name, completeJSONSchema);
    
    //cms.store.setSchema(name, schema.jsonSchema);
    
    this.createContentElement = function(data, cb){
      data.name = self.name;
      cms.store.createNode(data, function(err, node){
        if(err) return cb(err);
        if(node.name !== self.name) return cb(null, false);
        try {
          var ce = new cms.contentManagement.ContentElement(node);
        } catch(e) {return cb(e);}
        cb(null, ce);
      });
    };
    this.getContentElement = function(_id, cb){
      cms.store.getNode(_id, function(err, node){
        if(err) return cb(err);
        if(node.name !== self.name) return cb(null, false);
        try {
          var ce = new cms.contentManagement.ContentElement(node);
        } catch(e) {return cb(e);}
        cb(null, ce);
      });
    };
    this.getContentElementById = function(id, cb){
      cms.store.getNodeById(id, function(err, node){
        if(err) return cb(err);
        if(node.name !== self.name) return cb(null, false);
        try {
          var ce = new cms.contentManagement.ContentElement(node);
        } catch(e) {return cb(e);}
        cb(null, ce);
      });
    };
    this.getContentElementsByClass = function(id, cb){
      cb(new Error("Not implemented in cms.store so far..."));
    };
    this.getAllContentElements = function(cb){
      cb(new Error("Not implemented in cms.store so far..."));
    };
    this.findContentElements = function(query, cb){
      query.name = this.name;
      cms.store.findNodes(query, function(err, nodes){
        if(err) return cb(err);
        
        var arr = [], i;
        try {
          for(i=0; i<nodes.length; i++) {
            if(!nodes[i]) arr.push(false);
            else arr.push(new cms.contentManagement.ContentElement(nodes[i]));
          }
        } catch(e) {return cb(e);}
        cb(err, arr);
      });
    };
    this.findOneContentElement = function(query, cb){
      query.name = this.name;
      cms.store.findOneNode(query, function(err, node){
        if(err) return cb(err);
        if(!node) return cb(err, false);
        try {
          var ce = new cms.contentManagement.ContentElement(node);
        } catch(e) {return cb(e);}
        cb(null, ce);
      });
    };
    
  };
  Model.models = {};
  Model.getModel = function(name){
    return Model.models[name];
  };
  
  return Model;
};