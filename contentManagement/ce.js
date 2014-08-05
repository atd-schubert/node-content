"use strict";

module.exports = function(cms){
  var ContentElement = function(node){
    if(!node) return;
    var self = this;
    // TODO: edit, delete, etc...
    var model = cms.contentManagement.Model.getModel(node.name);
    var schema = model.schema;
  
    // set methods
    var hash;
    for (hash in schema.methods) {
      this[hash] = schema.methods[hash];
    }
  
    this.views = schema.views;
    this.backend = schema.backend;
    this.model = model;
    
    
    node.data.content = node.data.content || {};
    node.data.meta = node.data.meta || {};
    node.data.acl = node.data.acl || {};
    node.data.acl.write = node.data.acl.write || [];
    node.data.acl.read = node.data.acl.read || [];
    node.data.acl.writeGroups = node.data.acl.writeGroupes || [];
    node.data.acl.readGroups = node.data.acl.readGroupes || [];
    node.data.resource = node.data.resource || {};
    node.data.resource.manifest = node.data.resource.manifest || {};
    node.data.resource.sitemap = node.data.resource.sitemap || {};
    
    //node.data.resource.caching
    //node.data.resource.cachingTtl
    //node.data.resource.vanityUrls
    
    
    this.getClass = function(){ return node.class };
    this.setClass = function(val){ node.setClass(val)};
    
    this.getId = function(){ return node.id };
    this.setId = function(val){ node.setId(val)};
    this.getData = function(){ return node.data };
    this.setData = function(val){ node.setData(val)};
    this.getChildNodes = function(){ return node.childNodes };
    this.setChildNodes = function(val){ node.setChildNodes(val)};
    this.getContent = function(){ return node.data.content };
    this.setContent = function(val){
      node.data.content = val;
      node.setData();
    };
    
    this.data = node.data
    
    this.render = function(viewName, cb){
      if(!self.views[viewName]) cb(new Error("There is no view with this name!"));
      self.views[viewName].render({ce:self}, cb);
    };
    this.getContentType = function(viewName){
      if(!self.views[viewName]) cb(new Error("There is no view with this name!"));
      return self.views[viewName].getContentType();
    };
    this.getBackendContentType = function(viewName){
      if(!self.backend[viewName]) cb(new Error("There is no view with this name!"));
      return self.backend[viewName].getContentType();
    };
    this.renderBackend = function(viewName, cb){
      
    };
  
    this.save = function(cb, opts){node.save(cb, opts)};
    this.delete = function(cb, opts){node.delete(cb, opts)};
  };

  return ContentElement;
}