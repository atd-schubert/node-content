"use strict";

module.exports = function(cms){
  var VanityUrl = function(){
    
    
    this.middleware = function(req, res, next){
      
    };
    this.
    
    
    if(!node) throw new Error("There is no node for creating a contentElement");
    var self = this;
    // TODO: edit, delete, etc...
    var model = cms.contentManagement.Model.getModel(node.name);
    if(!model) throw new Error("Can't handle content Elements with the type '"+ node.name + "'! Please make a schema for this first...");
    var schema = model.schema;
  

  };
  
  ContentElement.get = function(_id, cb){
    cms.store.getNode(_id, function(err, node){
      if(err) return cb(new Error(err));
      if(node.name === "deleted") return cb(null, false);
      
      try {
        var ce = new ContentElement(node);
      } catch(e) { return cb(e); }
      cb(null, ce);
    });
  };
  
  return VanityUrl;
}