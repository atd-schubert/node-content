"use strict";

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
    
    var completeJSONSchema = {"type":"object","$schema": "http://json-schema.org/draft-03/schema","id": "http://jsonschema.net","required":false,"properties":{ "data": { "type":"object", "id": "http://jsonschema.net/data", "required":false, "properties":{ "acl": { "type":"object", "id": "http://jsonschema.net/data/acl", "required":false, "properties":{ "readGroups": { "type":"array", "id": "http://jsonschema.net/data/acl/readGroups", "required":false }, "readUsers": { "type":"array", "id": "http://jsonschema.net/data/acl/readUsers", "required":false }, "writeGroups": { "type":"array", "id": "http://jsonschema.net/data/acl/writeGroups", "required":false }, "writeUsers": { "type":"array", "id": "http://jsonschema.net/data/acl/writeUsers", "required":false } } }, "content": { "type":"object", "id": "http://jsonschema.net/data/content", "required":false }, "meta": { "type":"object", "id": "http://jsonschema.net/data/meta", "required":false, "properties":{ "lastmod": { "type":"number", "id": "http://jsonschema.net/data/meta/lastmod", "required":false }, "owner": { "type":"string", "id": "http://jsonschema.net/data/meta/owner", "required":false }, "version": { "type":"string", "id": "http://jsonschema.net/data/meta/version", "required":false } } }, "resource": { "type":"object", "id": "http://jsonschema.net/data/resource", "required":false, "properties":{ "cachingTtl": { "type":"number", "id": "http://jsonschema.net/data/resource/cachingTtl", "required":false }, "caching": { "type":"boolean", "id": "http://jsonschema.net/data/resource/caching", "required":false }, "manifest": { "type":"object", "id": "http://jsonschema.net/data/resource/manifest", "required":false, "properties":{ "fallback": { "type":"string", "id": "http://jsonschema.net/data/resource/manifest/fallback", "required":false }, "type": { "type":"string", "id": "http://jsonschema.net/data/resource/manifest/type", "required":false } } }, "vanityUrls": { "type":"array", "id": "http://jsonschema.net/data/resource/vanityUrls", "required":false, "items": { "type":"object", "id": "http://jsonschema.net/data/resource/vanityUrls/0", "required":false, "properties":{ "cache": { "type":"object", "id": "http://jsonschema.net/data/resource/vanityUrls/0/cache", "required":false, "properties":{ "enable": { "type":"boolean", "id": "http://jsonschema.net/data/resource/vanityUrls/0/cache/enable", "required":false }, "ttl": { "type":"number", "id": "http://jsonschema.net/data/resource/vanityUrls/0/cache/ttl", "required":false } } }, "manifest": { "type":"object", "id": "http://jsonschema.net/data/resource/vanityUrls/0/manifest", "required":false, "properties":{ "fallback": { "type":"string", "id": "http://jsonschema.net/data/resource/vanityUrls/0/manifest/fallback", "required":false }, "type": { "type":"string", "id": "http://jsonschema.net/data/resource/vanityUrls/0/manifest/type", "required":false } } }, "route": { "type":"string", "id": "http://jsonschema.net/data/resource/vanityUrls/0/route", "required":false }, "sitemap": { "type":"object", "id": "http://jsonschema.net/data/resource/vanityUrls/0/sitemap", "required":false, "properties":{ "changefreq": { "type":"string", "id": "http://jsonschema.net/data/resource/vanityUrls/0/sitemap/changefreq", "required":false }, "priority": { "type":"number", "id": "http://jsonschema.net/data/resource/vanityUrls/0/sitemap/priority", "required":false } } }, "view": { "type":"string", "id": "http://jsonschema.net/data/resource/vanityUrls/0/view", "required":false } } } } } } } } }}

;


    
    completeJSONSchema.properties.data.content = schema.jsonSchema;
    
    cms.store.setSchema(name, completeJSONSchema);
    
    //cms.store.setSchema(name, schema.jsonSchema);
    
    this.createContentElement = function(data, cb){
      data.name = self.name;
      cms.store.createNode(data, function(err, node){
        if(err) return cb(err);
        if(node.name !== self.name) return cb(null, false);
        cb(null, new cms.contentManagement.ContentElement(node));
      });
    };
    this.getContentElement = function(_id, cb){
      cms.store.getNode(_id, function(err, node){
        if(err) return cb(err);
        if(node.name !== self.name) return cb(null, false);
        cb(null, new cms.contentManagement.ContentElement(node));
      });
    };
    this.getContentElementById = function(id, cb){
      cms.store.getNodeById(id, function(err, node){
        if(err) return cb(err);
        if(node.name !== self.name) return cb(null, false);
        cb(null, new cms.contentManagement.ContentElement(node));
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
        for(i=0; i<nodes.length; i++) {
          if(!nodes[i]) arr.push(false);
          else arr.push(new cms.contentManagement.ContentElement(nodes[i]));
        }
        cb(err, arr);
      });
    };
    this.findOneContentElement = function(query, cb){
      query.name = this.name;
      cms.store.findOneNode(query, function(err, node){
        if(err) return cb(err);
        if(!node) return cb(err, false);
        cb(err, new cms.contentManagement.ContentElement(node));
      });
    };
    
  };
  Model.models = {};
  Model.getModel = function(name){
    return Model.models[name];
  };
  
  return Model;
};