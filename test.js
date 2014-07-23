"use strict";

var CMS = require("./index.js");

var cms = new CMS();

var express = require('express');
var app = express();

app.use(require('compression')());
app.use(cms.middleware);

app.get('/', function (req, res) {
  var content = 'Hello World'+Math.random();
  req.cms.cache.cache("/index.html", content);
  req.cms.cache.ttl("/index.html", 10000);
  res.send(content);
});

app.listen(3000);

module.exports = {app: app, cms:cms};