"use strict";

var CMS = require("./index.js");


var express = require('express');
var app = express();

var cms = new CMS({server:{port: "3000"}, "mongoose-store":{href:"mongodb://localhost/cms"}});

app.use(require('compression')());
app.use(cms.middleware);

/* CMS parts */

var logger = require("./extensions/winston")(cms);
logger.install();
logger.activate();

var store = require("./extensions/mongoose-store")(cms);
store.install();
store.activate();

var frontend = require("./extensions/frontend")(cms);
frontend.install();
frontend.activate();

var backend = require("./extensions/backend")(cms);
// backend.install();
backend.activate();

var cache = require("./extensions/cache")(cms);
cache.install();
cache.activate();

var jsch = require("./extensions/jsch-editor")(cms);
jsch.install();
jsch.activate();

var vanityUrl = require("./extensions/vanity-url")(cms);
vanityUrl.install();  
vanityUrl.activate();


var resource = require("./extensions/resource")(cms);
resource.install();
resource.activate();

var amanecer = require("./extensions/amanecer")(cms);
amanecer.install();
amanecer.activate();



/*
var placeViews = {
  jqmLi: new cms.contentManagement.View({
    templatePath: __dirname+"/templates/place/li.jade",
    contentType: "application/xml"
  }),
  list: new cms.contentManagement.View({
    templatePath: __dirname+"/templates/place/list.jade",
    contentType: "application/xml"
  })
};
app.get("/testli", function(req, res){

  placeModel.findOneContentElement({"data.content.title": "jetzt!"}, function(err, ce){
    if(err) return console.log(err);
    
    ce.render("list", function(err, data){
      if(err) return res.send(err);
      
      console.log(ce.getContentType("list"));
      
      res.writeHead("200", {"Content-Type": ce.getContentType("list")});
      
      res.end(data);
    });
  });

  return;
  var data = {content: {lat:12.3, lng:22.5, title: "Irgendwo..."}};
  placeViews.jqmLi.render(data, function(err, html){
    if(err) return res.send(err);
    res.send(html);
  });
});
app.get("/testlist", function(req, res){
  var data = {content: {lat:12.3, lng:22.5, title: "Irgendwo..."}};
  placeViews.list.render(data, function(err, html){
    if(err) return res.send(err);
    res.send(html);
  });
});

var placeSchema = new cms.contentManagement.Schema({
  views: placeViews,
  jsonSchema: '{"type":"object","$schema": "http://json-schema.org/draft-03/schema","id": "http://jsonschema.net","required":false,"properties":{ "lat": { "type":"number", "minimum": "-90", "maximum": "90", "id": "http://jsonschema.net/lat", "required":true }, "lng": { "type":"number", "minimum": "-180", "maximum": "180", "id": "http://jsonschema.net/lng", "required":true }, "title": { "type":"string", "id": "http://jsonschema.net/title", "required":true } }}'
});
var placeModel = new cms.contentManagement.Model("place", placeSchema);

var ce = placeModel.createContentElement({
  data: {content: {lat:10, lng:1, title: "jetzt!"}}
}, function(err, node){
  if (err) return console.log(err);
  placeModel.findOneContentElement({"data.content.title": "jetzt!"}, function(err, node){
    console.log(err, node);
  });
});

*/


app.listen(3000);

module.exports = cms; //{cms:cms, r:r};