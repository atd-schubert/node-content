"use strict";

var mongoose = require("mongoose");
var eventify = require("mongoose-eventify");

var connectDB = function(path) {
  if(mongoose.connection._readyState!==0) {
    console.error("There is already a connection...");
    console.log(mongoose.connection);
    return mongoose;
  }
  mongoose.connect(path);
  mongoose.connection.once("open", function(){
    console.log("Connection to db '"+path+"' established...");
  });
  return mongoose;
};

module.exports = function(cms, opts){ // TODO: maybe don't use opts at this place, use install args instead...
  if(!cms) throw new Error("You have to specify the cms object");
  
  var store = false;
  
  var ext = cms.createExtension({package: require("./package.json")});
  
  
  ext.createSchema = function(obj){
    if(!store) throw new Error("The store isn't activated");
    var schema = new store.Schema(obj);
    // TODO: this causes an error at the moment: schema.plugin(eventify);
    ext.emit("newSchema", schema);
    return schema;
  };
  ext.getModel = function(name){
    if(!store) throw new Error("The store isn't activated");
    return store.models[name];
  };
  ext.createModel = function(name, schema){
    if(!store) throw new Error("The store isn't activated");
    var model = store.model(name, schema);
    ext.emit("newModel", model);
    // register events...
    return model;
  };
  ext.getStore = function(){ return store; };
  
  
  ext.on("install", function(event){
    ext.config.href = ext.config.href || "mongodb://localhost/nc-cms";
  });
  ext.on("uninstall", function(event){
    
  });
  
  ext.on("activate", function(event){
	  // event.target; event.args
	  store = connectDB(ext.config.href);
  });
  
  ext.on("deactivate", function(event){
	  // event.target; event.args
	  store = false;
  });
  
  return ext;
}