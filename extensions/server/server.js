"use strict";

module.exports = function(cms, opts){ // TODO: maybe don't use opts at this place, use install args instead...
  if(!cms) throw new Error("You have to specify the cms object");
  
  var ext = cms.createExtension({package: require("./package.json")});
  
  ext.on("install", function(event){
    ext.config.disableCompression = ext.config.disableCompression || false;
    ext.config.disableCookieParser = ext.config.disableCookieParser || false;
    ext.config.disableSession = ext.config.disableSession || false;
    ext.config.port = ext.config.port || 3000;
    ext.express = require('express');
    ext.app = ext.express();
  });
  ext.on("uninstall", function(event){
    // TODO: remove model...
  });
  
  ext.on("activate", function(event){
    if(!ext.config.disableCompression) ext.app.use(require('compression')());
    if(!ext.config.disableCookieParser) ext.app.use(require("cookie-parser")());
    if(!ext.config.disableSession) ext.app.use(require("express-session")({ secret: '// TODO: make it configurable' }));
    
    ext.app.use(cms.middleware);
    ext.app.listen(ext.config.port, function(){
      console.log("NC Content-Management-System is listening on port %d in %s mode", ext.config.port, ext.app.settings.env);
    });
  });
  
  ext.on("deactivate", function(event){
    
  });
    
  return ext;
}

  /*
  opts.server = opts.server || {};
  if(opts.server.port && !opts.server.hostname && !opts.server.host) opts.server.hostname = "localhost"; // just port
  if(opts.server.hostname && opts.server.port && !opts.server.host) opts.server.host = opts.server.hostname+":"+opts.server.port; // not hostname
  if(opts.server.host && !opts.server.port && !opts.server.hostname) { // just hostname
    opts.server.hostname = opts.server.host.split(":")[0];
    opts.server.port = opts.server.host.split(":")[1];
  }

  opts.server.protocol = opts.server.protocol || "http:";
  opts.server.hostname = opts.server.hostname || "localhost";
  opts.server.port = opts.server.port || "80";
  opts.server.host = opts.server.host || "localhost:80";
  //*/