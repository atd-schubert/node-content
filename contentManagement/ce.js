"use strict";

module.exports = function(cms){
  var ContentElement = function(node){
    if(!node) throw new Error("There is no node for creating a contentElement");
    var self = this;
    // TODO: edit, delete, etc...
    var model = cms.contentManagement.Model.getModel(node.name);
    if(!model) throw new Error("Can't handle content Elements with the type '"+ node.name + "'! Please make a schema for this first...");
    var schema = model.schema;
  
    // set methods
    var hash;
    for (hash in schema.methods) {
      this[hash] = schema.methods[hash];
    }
  
    this.views = schema.views;
    this.backend = schema.backend;
    this.model = model;
    
    var registerChanges = function(){
      cms.emit("contentChange", self);
      cms.emit("contentChange:"+node._id, self);
      // Manifeste
      
      
      /*if(node.data.resource.manifest && node.data.resource.manifest.type) {
        var hash;
        var routes = [];
        for (hash in self.views) {
          
        }
        cms.manifest.removeNetwork();
        switch (node.data.resource.manifest.type.toLowerCase()) {
          case "cache":
            cms.manifest.cache("/cms/"+node._id+"/");
            break;
          case "network":
            cms.manifest.network();
        }
      }*/
      // Vanity URLs
      
      // Sitemap
      
      // ACL
    };
    var deregister = function(){};
    
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
    
    
    this._id = node._id;
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
    this.getAccessControlAllowOrigin = function(viewName){
      if(!self.views[viewName]) cb(new Error("There is no view with this name!"));
      return self.views[viewName].getAccessControlAllowOrigin();
    };
    this.getBackendAccessControlAllowOrigin = function(viewName){
      if(!self.backend[viewName]) cb(new Error("There is no view with this name!"));
      return self.backend[viewName].getAccessControlAllowOrigin();
    };
    this.getBackendContentType = function(viewName){
      if(!self.backend[viewName]) cb(new Error("There is no view with this name!"));
      return self.backend[viewName].getContentType();
    };
    this.renderBackend = function(viewName, cb){
      if(!self.backend[viewName]) cb(new Error("There is no view with this name!"));
      self.backend[viewName].render({ce:self, cms:cms}, cb);
    };
  
    this.save = function(cb, opts){
      cb = cb || function(){};
      node.save(function(err){
        if(err) return cb(err);
        cb(null, registerChanges());
      }, opts);
    };
    this.delete = function(cb, opts){node.delete(cb, opts)};
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
  ContentElement.findOne = function(query, cb){
    cms.store.findOneNode(query, function(err, node){
      if(err) return cb(new Error(err));
      if(node.name === "deleted") return cb(null, false);
      
      try {
        var ce = new ContentElement(node);
      } catch(e) { return cb(e); }
      cb(null, ce);
    });
  };
  
  return ContentElement;
}