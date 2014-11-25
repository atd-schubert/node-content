"use strict";

/*
	
	Die User Verwaltung sollte als erstes gestartet werden und realsiert über Passport
	alle wichtigen Benutzer daten in den requst mit aufnehmen
	
	in einem zweiten Schritt sollten dann explizit verbotene Pfade herausgefiltert werden
	und eine 403 Forbidden Page als Antwort bekommen... oder alternativ eine loginseite, die nicht benötigt die
	Url zu wechseln, sodass nach login ein reffer auf die eigentlich url nicht mehr nötig ist.
	
	Außerdem sollten gundsätzliches Sessions angeboten werden, oder dies ggf. augelagert werden.
	
	außerdem sollen zu einem reqest die folgenden funtionen durch diese ext abgerufen werden:
	isUser(req, ["name"]),
	isGroup(req, ["admin", "editors"]);
	
*/
var fs = require("fs");
var jade = require("jade");
var bodyParser = require("body-parser");
var crypto = require("crypto");

var passport = require("passport");
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var LocalStrategy = require('passport-local').Strategy;

module.exports = function(cms){
  if(!cms) throw new Error("You have to specify the cms object");
  
  var localStrategy;
  
  passport.serializeUser(function(user, done) {
    console.log("serial", user);
    done(null, user._id);
  });
  passport.deserializeUser(function(id, done) {
    console.log("deserial", id);
    ext.config.model.findById(id, function(err, user) {
      console.log("serial-end", user);
      done(err, user);
    });
  });
  
  var router = function(req, res, next){
    return passport.initialize()(req, res, function(err){
      if(err) return next(err);
      passport.session()(req, res, function(err){
        if(err) return next(err);
        
        
        var backend = cms.getExtension("backend");
        if(req.url.substr(0, backend.config.route.length+ext.config.subRoute.length) === backend.config.route+ext.config.subRoute) {
          return ext.authenticate(req, res, function(err){
            if(err) return next(err);
            res.writeHead(200, {"content-type":"text/plain"});
            res.end("// TODO: make user overview page");
            
          });
        }
        return next();
        
        
        
      });
    });

    
  };
  
  var vanitize = function(a,b,c){
    if(cms.getExtension("vanity-url") && cms.getExtension("vanity-url").renderVanityUrlLists) return cms.getExtension("vanity-url").renderVanityUrlLists(a,b,c);
    return c(null, "");
  };

  var clientCSS = function(obj){
    fs.readFile(__dirname+"/assets/style.css", obj.collector());
  };
  var clientJS = function(obj){
    fs.readFile(__dirname+"/assets/script.js", obj.collector());
  };
  
  var buildNavigation = function(obj){ // TODO: build with collector!
    obj.collector()(null, {class:"ajaxBody", caption:"User", href:cms.getExtension("backend").config.route+ext.config.subRoute});
  };
  
  var ext = cms.createExtension({package: require("./package.json")});
  var logger = cms.getExtension("winston").createLogger(ext.name);
  
  ext.on("install", function(event){
    
    ext.config.subRoute = ext.config.subRoute || "/"+ext.name;
    ext.config.oauthRoute = ext.config.oauthRoute || "/oauth";
    ext.config.modelName = ext.config.modelName || ext.name;
    ext.config.dumpPath = ext.config.dumpPath || __dirname+"/data";
    
    ext.config.local = ext.config.local || {};
    ext.config.local.usernameField = ext.config.local.usernameField || "username";
    ext.config.local.passwordField = ext.config.local.passwordField || "password";
    ext.config.local.saltlen = ext.config.local.saltlen || 32;
    ext.config.local.iterations = ext.config.local.iterations || 25000;
    ext.config.local.keylen = ext.config.local.keylen || 512;
    ext.config.local.encoding = ext.config.local.encoding || "hex";
    
    ext.config.oauths = ext.config.oauths || {};
    
    // Oauths
    // Facebook
    ext.config.oauths.facebook = ext.config.oauths.facebook || {};
    ext.config.oauths.facebook.clientId = ext.config.oauths.facebook.clientId || null;
    ext.config.oauths.facebook.clientSecret = ext.config.oauths.facebook.clientSecret || null;
    ext.config.oauths.facebook.callbackUrl = ext.config.oauths.facebook.callbackUrl || null; // ext->server->protokol+hostname+port/ oauthRoute + "/facebook/callback"
    ext.config.oauths.facebook.initUrl = ext.config.oauths.facebook.initUrl || null; // ext->server->protokol+hostname+port/ oauthRoute + "/facebook/callback"

    // Google
    ext.config.oauths.google = ext.config.oauths.google || {};
    ext.config.oauths.google.clientId = ext.config.oauths.google.clientId || null;
    ext.config.oauths.google.clientSecret = ext.config.oauths.google.clientSecret || null;
    ext.config.oauths.google.callbackUrl = ext.config.oauths.google.callbackUrl || null; // ext->server->protokol+hostname+port/ oauthRoute + "/google/callback"
    ext.config.oauths.google.initUrl = ext.config.oauths.google.initUrl || null; // ext->server->protokol+hostname+port/ oauthRoute + "/google/callback"
    
    var store = cms.getExtension("mongoose-store");
    ext.config.schema = store.createSchema({
      name: {
        type: String
      },
      email: {
        type: String,
        match: /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        unique: true,
        sparse: true
      }, // needed only for local, for oauth user not required
      zip: {
        type: String,
        match: /^(\d{5,})?$/
      }, // empty or at least five digits
      phone: {
        type: String
      },
      address: {
        type: String
      },
      usergroup: {
        type: String,
        default: 'user'
      },
      username: {
        type: String,
        unique: true,
        sparse: true,
        match: /^([a-zA-Z][a-zA-Z_\-\.]{2,})?$/
      }, // empty or at least five chars
      /*provider: {
        type: String,
        required: true
      }, // oauth provider*/
      hash: {
        type: String
      }, // hashed password
      salt: {
        type: String
      },
      gpg: {
        private: String,
        public: String
      },
      oauth: {
        facebook: {
          id: String,
          oauthInfo: Object
        },
        google: {
          id: String,
          oauthInfo: Object
        }
      }, // oauth provider id
      timestamps: {
        created: Date,
        last: Date
      },
/*      tfa: { // TFA AUTH info, based on TOTP Time-Based One-Time Password Algorithm (http://tools.ietf.org/html/rfc6238)
        enabled: {
          type: Boolean,
          default: false
        }, // if enabled, force the user to use tfa after normal login(local/oauth)
        id: {
          type: String,
          unique: true,
          sparse: true
        }, // the TOTP unique id for this prefix/issuer (use email for local or random generated email for oauth providers)
        issuer: {
          type: String,
          default: totpconfig.issuer
        }, // the ISSUER, use also as a prefix
        key: {
          type: String
        }, // the random generated key to pass to google authenticator
        period: {
          type: Number,
          default: totpconfig.period
        }, // optional period for TOTP - Currently, the period parameter is ignored by the Google Authenticator implementations
        lastOtpDate: {
          type: Date
        } // use to compare with ttl to require a new TOTP authentication
      } // Google Authenticator (https://code.google.com/p/google-authenticator/wiki/KeyUriFormat)*/
    });
    ext.config.schema.methods.setPassword = function (password, cb) {
      if (!password) {
        return cb(new Error('Missing password'));
      }
      if (password.length < 8) {
        // NOTE: if needed extend this with custom configurable validators, use https://www.npmjs.org/package/complexity
        return cb(new Error('Password too short, minimum 8 characters'));
      }
      if (/^[a-zA-Z0-9]{1,15}$/.test(password)) {
        // NOTE: if needed extend this with custom configurable validators, use https://www.npmjs.org/package/complexity
        return cb(new Error('Password have no special characters.'));
      }
    
      var self = this;
    
      crypto.randomBytes(ext.config.local.saltlen, function (err, buf) {
        if (err) {
          return cb(err);
        }
    
        var salt = buf.toString(ext.config.local.encoding); // TODO: crypto md5
    
        crypto.pbkdf2(password, salt, ext.config.local.iterations, ext.config.local.keylen, function (err, hashRaw) {
          if (err) {
            return cb(err);
          }
    
          self.set('hash', new Buffer(hashRaw, 'binary').toString(ext.config.local.encoding));
          self.set('salt', salt);
    
          cb(null, self);
        });
      });
    };
    ext.config.schema.methods.authenticate = function (password, cb) {
      var self = this;
    
      if (!this.get('salt')) {
        return cb(new Error('No Saltvalue'));
      }
    
      crypto.pbkdf2(password, this.get('salt'), ext.config.local.iterations, ext.config.local.keylen, function (err, hashRaw) {
        if (err) {
          return cb([err.message]);
        }
    
        var hash = new Buffer(hashRaw, 'binary').toString(ext.config.local.encoding);
    
        if (hash === self.get('hash')) {
          return cb(null, self);
        } else {
          return cb(new Error('incorrect Password'));
        }
      });
    };
    ext.config.schema.statics.authenticate = function (username, password, cb) {
      var self = this;
      var query;
      if(/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(username)) query = {email: username};
      else query = {username: username};
      
      self.findOne(query, function (err, user) {
        if (err) {
          return cb(err);
        }
        if (user) {
          user.authenticate(password, cb);
          //if (!(user[0] instanceof self)) user = new self(user[0]);
          //user.authenticate(password, cb);
        } else {
          return cb(new Error('Incorrect email'));
        }
      });
    
    };
    
    ext.config.model = store.createModel(ext.config.modelName, ext.config.schema);
    ext.config.model.displayColumns = ["username", "_id"]; // Custom rows to display
    
    ext.config.model.findOne({username:"admin"}, function(err, doc){
      if(err) console.error(err);
      if(!doc) {
        var passwd = "admin!234"; // TODO: generate one
        console.warn("There is no admin! Create one with password '"+passwd+"'.");
        var admin = new ext.config.model({
          username:"admin",
          usergroup: "admin"
        });
        admin.save(function(err, doc){
          if(err) console.error(err);
          doc.setPassword(passwd, function(err, doc){
            if(err) return console.error(err);
            doc.save(function(err){
              if(err) return console.error(err);
              console.log("User 'admin' created...");
            });
          });
        });
        //admin.setPassword(passwd, )
      }
      
    });
    
  });
  ext.on("uninstall", function(event){
    
  });
  
  var registerEvents = function(){
    var backend = cms.getExtension("backend");
    if(!backend) return;
    backend.on("buildNavigation", buildNavigation);
    backend.on("buildClientCSS", clientCSS);
    backend.on("buildClientJS", clientJS);
    
    
  };
  var check4Events = function(newExt){
    if(newExt.name!== "backend") return;
    registerEvents();
    cms.removeListener("createExtension", check4Events);
  };

  ext.on("activate", function(event){
    var backend = cms.getExtension("backend");
    
	  if(cms.requestMiddlewares.indexOf(router) === -1) {
		  cms.requestMiddlewares.unshift(router);
	  }
    
    if(backend) registerEvents();
    else cms.on("createExtension", check4Events);   
    localStrategy = new LocalStrategy({
      // by default, local strategy uses username and password, we will override with email
      usernameField: ext.config.local.usernameField,
      passwordField: ext.config.local.passwordField,
      //passReqToCallback : true // allows us to pass back the entire request to the callback
    }, function (email, password, done) {
  
      ext.config.model.authenticate(email, password, function (err, user) {
        if (err) {
          return done(null, false, {
            message: err.toString()
          });
        } else {
          return done(null, user);
        }
      });
    });
    passport.use(localStrategy);
  });
  
  ext.on("deactivate", function(event){
    var backend = cms.getExtension("backend");
	  if(cms.requestMiddlewares.indexOf(router) !== -1) {
		  cms.requestMiddlewares.splice(event.target.requestMiddlewares.indexOf(router), 1);
	  }
	  if(!backend) return;
    backend.remove("buildNavigation", buildNavigation);
    backend.remove("buildClientCSS", clientCSS);
    backend.remove("buildClientJS", clientJS);
  });
  
  ext.authenticate = function(req, res, next){
    var backend = cms.getExtension("backend");
    if(req.user) return next();
    return passport.authenticate("local", function(err, user, info){
      if (err) return next(err);
      console.log("USER", user);
      if (!user) {
        if(req.method === "POST") {
          return bodyParser.urlencoded()(req, res, function(err){
            if (err) return next(err);
            if(!req.body || !req.body[ext.config.local.usernameField] || !req.body[ext.config.local.passwordField]) return next();
            ext.config.model.authenticate(req.body[ext.config.local.usernameField], req.body[ext.config.local.passwordField],function(err, user){
              if(err) return next(err);
              return req.logIn(user, function(err) {
                if(err) return next(err);
                return next();
              });
            });
            // ext.config.model.  ext.config.model.ext.config.model.ext.config.model.ext.config.model.ext.config.model.ext.config.mod
          });
        }
        // Login page...
        return backend.renderPage({
          reqest:req,
          navigation: '<ul class="nav navbar-nav"><li><a href="#">Login</a></li></ul>',
          content: jade.renderFile(__dirname+"/views/login.jade", {req:req, config:ext.config}),
        }, function(err, html){
          if(err) return next(err);
          res.writeHead(403, {"content-type":"text/html"});
          res.end(html);
        });
      }
      req.logIn(user, function(err) {
        if (err) return next(err);
        return next();//res.redirect('/users/' + user.username);
      });
    })(req, res, next);
  };
  
  ext.middleware = router;
  
  return ext;
};






/*
var passport = require("passport");
// facebook

module.exports = function(cms){
  if(!cms) throw new Error("You have to specify the cms object");
  
  var router = function(req, res, next){
    if(!model) return next();
    if(req.method === "POST") return next();
    var url = req.url;
    
    model.findOne({url:req.url}, function(err, doc){
      if(err) return next(err);
      if(!doc) return next();
      
      if(doc.ttl && doc.ttl.getTime() < Date.now()) {
        ext.uncache(req.url, function(err){
          if(err) return console.error(err);
        });
        return next();
      }
      // TODO: if file not exists return next() and uncache
      if(req.headers["if-none-match"]) {
      }
      if(req.headers["if-none-match"] && doc.headers && doc.headers.etag && req.headers["if-none-match"]===doc.headers.etag){
        res.writeHead(304, doc.headers);
        return res.end();
      }
      
      // TODO: if(header.contentType missmatch) return next();
      
      var file = fs.createReadStream(ext.config.dumpPath+"/"+doc._id);
      res.writeHead(200, doc.headers);
      file.pipe(res);
    });
  };
  
  var store = cms.getExtension("mongoose-store");
  var schema = store.createSchema({
    url: {
      required: true,
      unique: true,
      type:String
    },
    headers: Object,
    ttl: Date // when it has to be deleted
  });
  
  var model;
  
  var ext = cms.createExtension({package: require("./package.json")});
  
  ext.on("install", function(event){
    var store = cms.getExtension("mongoose-store");
    ext.config.modelName = ext.config.modelName || "cache";
    ext.config.dumpPath = ext.config.dumpPath || __dirname+"/data";
    
    // TODO: create data dump path
    
    model = store.createModel(ext.config.modelName, schema);
    model.displayColumns = ["url", "_id"];
  });
  ext.on("uninstall", function(event){
    
  });
  
  ext.on("activate", function(event){
	  if(cms.requestMiddlewares.indexOf(router) === -1) {
		  cms.requestMiddlewares.unshift(router);
	  }
  });
  
  ext.on("deactivate", function(event){
	  if(cms.requestMiddlewares.indexOf(router) !== -1) {
		  cms.requestMiddlewares.splice(event.target.requestMiddlewares.indexOf(router), 1);
	  }
  });
  
  ext.cacheStream = function(opts, cb){
    if(!model) return cb(new Error("You have to activate this extension first."));
    if(!opts.url) return cb(new Error("You have to set an url to cache."));
    
    cb = cb || function(err){ if(err) console.error(err); };
    
    var doc = new model();
    doc.url = opts.url;
    if(opts.headers) {
      var headers = {};
      var hash;
      for (hash in opts.headers){
        headers[hash.toLowerCase()] = opts.headers[hash];
      }
      doc.headers = headers;
    }
    if(opts.ttl) {
      if(typeof opts.ttl === "number") doc.ttl = new Date(Date.now()+opts.ttl);
      else doc.ttl = opts.ttl;
    }
    var stream = fs.createWriteStream(ext.config.dumpPath+"/"+doc._id);
    doc.save(function(err, doc){
      if(err) return cb(err);
      cb(null, stream);
    });
    return stream;
  };
  
  ext.cacheData = function(opts, cb){
    cb = cb || function(err){if(err) console.error(err);};
    ext.cacheStream(opts, function(err, stream){
      if(err) return cb(err);
      stream.on("error", function(err){
        cb(err);
      });
      stream.end(opts.data);
      cb();
    });
  };
  
  ext.uncache = function(url, cb) {
    cb = cb || function(err){if(err) console.error(err);};
    model.findOne({url: url}, function(err, doc){
      if(!doc) return cb();
      // TODO: handle error if file not exists; if not simply remove doc...
      fs.unlink(ext.config.dumpPath+"/"+doc._id, function(err){
        if(err && err.message !== "// TODO: file not exists") return cb(err);
        doc.remove(function(err){
          if(err) return cb(err);
        });
      });
    });
  }
  
  ext.middleware = router;
  
  return ext;
}
*/