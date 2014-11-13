"use strict";

var jade = require("jade");

module.exports = function(cms){
  if(!cms) throw new Error("You have to specify the cms object");
  
  var schema = new cms.store.Schema({
	  url: {
		  type: String,
		  required: true,
		  unique: true
	  },
	  model: {
		  type: String,
		  required: true
	  },
	  view: {
		  type: String,
		  required: true
	  },
	  query: {
		  type: String
	  }
  });
  
  var model;
  
  var router = function(req, res, next){
    ext.getByUrl(req.url, function(err, doc){
	    if(err && err.message === "Can not find vanityUrl" || !doc) return next();
	    if(err) return next(err);
	    
	    cms.getContent(doc.model, doc.view, doc.query, function(err, mw){
		    if(err) return next(err);
		    mw(req, res, next);
	    });
    });
  };
  
  var ext = cms.createExtension({package: require("./package.json")});
  
  ext.on("install", function(event){
    cms.config.vanityUrl = cms.config.vanityUrl || {};
    cms.config.vanityUrl.modelName = cms.config.vanityUrl.modelName || "vanityUrl";
    model = cms.store.model(cms.config.vanityUrl.modelName, schema);
    model.displayColumns = ["url", "model", "view", "query"];
  });
  ext.on("uninstall", function(event){
    ext.deactivate();
    if(event.args && event.args.all) delete cms.config.vanityUrl;
    
    // TODO: remove model...
  });
  
  ext.on("activate", function(event){
	  // event.target; event.args
	  if(cms.requestMiddlewares.indexOf(router) === -1) {
		  cms.requestMiddlewares.push(router);
	  }
  });
  
  ext.on("deactivate", function(event){
	  // event.target; event.args
	  if(cms.requestMiddlewares.indexOf(router) !== -1) {
		  cms.requestMiddlewares.splice(event.target.requestMiddlewares.indexOf(router), 1);
	  }
  });
  
  ext.middleware = router;
  
  ext.add = function(data, cb){
	  if(!cb) cb = function(err){console.error(err)};
	  
	  if(!model) cb(new Error("VanityUrl extension has to be installed first"));
	  
	  data = new model(data);
	  data.save(cb);
  };
  ext.removeByUrl = function(url, cb){
	  if(!cb) cb = function(err){console.error(err)};
	  
	  if(!model) cb(new Error("VanityUrl extension has to be installed first"));
	  
	  ext.getByUrl(url, function(err, doc){
		  if(err) return cb(err);
		  doc.remove();
		  cb(null, true);
	  }, true);
  };
  ext.getByUrl = function(url, cb, strict){
	  if(!cb) throw new Error("The get functions has to have a callback!");
	  if(!model) cb(new Error("VanityUrl extension has to be installed first"));
	  
	  model.findOne({url: url}, function(err, doc){
	    if(err) return cb(err);
	    if(!doc) {
	      if(strict) return cb(new Error("Can not find vanityUrl"));
	      
	  		if(url.substr(-1)==="/") {
				  return model.findOne({url: url.substr(0, url.length-1)}, function(err, doc){
					  if(!doc) return cb(new Error("Can not find vanityUrl"));
				  });
			  } else {
				  return model.findOne({url: url+"/"}, function(err, doc){
					  if(!doc) return cb(new Error("Can not find vanityUrl"));
				  });
			  }
			}
			cb(null, doc);
	  });
  };
  ext.query = function(query, cb){
    model.find(query, cb);
  };
  ext.renderVanityUrlLists = function(query, opts, cb){
    ext.query(query, function(err, docs){
      if(err) return cb(err);
      cb(null, jade.renderFile(__dirname+"/views/list.jade", {docs:docs, opts:opts}));
    });
  };
  
  ext.model = model;
  
  return ext;
}