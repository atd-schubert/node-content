"use strict";

var Model = function(name, schema){
  if(Model.getModel(name)) throw new Error("there is already a Model with the name: '"+name+"'");
  Model.models[name] = this;
  
  var hash;
  for(hash in schema.statics) {
    this[hash] = schema.statics[hash];
  }
  this.schema = schema;
  this.name = name;
  
  //noody.setSchema(name, schema.jsonSchema);
  
  this.getContentElement = function(_id, cb){
    noody.getNode(_id, function(err, node){
      if(err) return cb(err);
      cb(null, new ContentElement(node));
    });
  };
  this.getContentElementById = function(id, cb){
    noody.getNodeById(id, function(err, node){
      if(err) return cb(err);
      cb(null, new ContentElement(node));
    });
  };
  this.getContentElementsByClass = function(id, cb){
    cb(new Error("Not implemented in noody so far..."));
  };
  this.getAllContentElements = function(cb){
    cb(new Error("Not implemented in noody so far..."));
  };
  
};
Model.models = {};
Model.getModel = function(name){
  return Model.models[name];
}

module.exports = Model;