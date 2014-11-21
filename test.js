"use strict";

var CMS = require("./index.js");
var cms = new CMS({server:{port: "3000"}, "mongoose-store":{href:"mongodb://localhost/cms"}});

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

var restart = require("./extensions/restart")(cms);
restart.install();
restart.activate();

var server = require("./extensions/server")(cms);
server.install();
server.activate();

module.exports = cms; //{cms:cms, r:r};