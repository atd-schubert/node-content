"use strict";

var fs = require("fs");
var winston = require("winston");

module.exports = function(cms){
  if(!cms) throw new Error("You have to specify the cms object");
  
  /*var router = function(req, res, next){
    try{throw new Error("Dummy extension");} catch(e){console.error(e)};
    next();
  };

  var clientCSS = function(obj){
    fs.readFile(__dirname+"/assets/style.css", obj.collector());
  };
  var clientJS = function(obj){
    fs.readFile(__dirname+"/assets/script.js", obj.collector());
  };
  
  var buildNavigation = function(obj){ // TODO: build with collector!
    menu.push({class:"ajaxBody", caption:"dummy", href:cms.getExtension("backend").config.route+ext.config.subRoute});
  };
  */
  var loggers = {};
  var ext = cms.createExtension({package: require("./package.json")});
  
  ext.on("install", function(event){
    ext.logger = new (winston.Logger)({
      levels: {
        trace: 0,
        input: 1,
        verbose: 2,
        prompt: 3,
        debug: 4,
        info: 5,
        data: 6,
        help: 7,
        warn: 8,
        error: 9
      },
      colors: {
        trace: 'magenta',
        input: 'grey',
        verbose: 'cyan',
        prompt: 'grey',
        debug: 'blue',
        info: 'green',
        data: 'grey',
        help: 'cyan',
        warn: 'yellow',
        error: 'red'
      }
    });
    
    ext.logger.add(winston.transports.Console, {
      level: 'trace',
      prettyPrint: true,
      colorize: true,
      silent: false,
      timestamp: false
    });
    // var store = cms.getExtension("mongoose-store");
    // ext.config.schema = store.createSchema({ });
    // ext.config.model = store.createModel(ext.config.modelName, ext.config.schema);
    // ext.config.model.displayColumns = ["url", "_id"]; // Custom rows to display
    
  });
  ext.on("uninstall", function(event){
    delete ext.logger;
  });
  
  ext.on("activate", function(event){
    // TODO: get settings for logger and set the systemwide logger...
	  /*if(cms.requestMiddlewares.indexOf(router) === -1) {
		  cms.requestMiddlewares.unshift(router);
	  }
    backend.on("buildNavigation", buildNavigation);
    backend.on("buildClientCSS", clientCSS);
    backend.on("buildClientJS", clientJS);*/
    
    ext.logger.trace("This is an example trace");
    ext.logger.error("This is an example error");
    ext.logger.warn("This is an example warning");
    ext.logger.debug("This is an example debug");
    ext.logger.info("This is an example info");
  });
  
  ext.on("deactivate", function(event){
	  /*if(cms.requestMiddlewares.indexOf(router) !== -1) {
		  cms.requestMiddlewares.splice(event.target.requestMiddlewares.indexOf(router), 1);
	  }
    backend.remove("buildNavigation", buildNavigation);
    backend.remove("buildClientCSS", clientCSS);
    backend.remove("buildClientJS", clientJS);*/
  });
  
  ext.createLogger = function(name, opts){
    if(name in loggers) return false;
    opts = opts || {};
    var _level = opts.level || 8;
    // TODO: for hash in loop...
    var logger = {
      log: function(type, msg){
        ext.logger.log(type, name+": "+msg);
      },
      trace: function(msg){
        if(_level > 0) return;
        try {throw new Error(msg);}catch(e){
          var stack = e.stack.split("\n");
          stack[0]="";
          stack[1]="";
          stack= stack.join("\n");
          ext.logger.trace(name+": "+msg+stack);
        }
      },
      input: function(msg){
        if(_level > 1) return;
        ext.logger.input(name+": "+msg);
      },
      verbose: function(msg){
        if(_level > 2) return;
        ext.logger.verbose(name+": "+msg);
      },
      prompt: function(msg){
        if(_level > 3) return;
        ext.logger.prompt(name+": "+msg);
      },
      debug: function(msg){
        if(_level > 4) return;
        ext.logger.debug(name+": "+msg);
      },
      info: function(msg){
        if(_level > 5) return;
        ext.logger.info(name+": "+msg);
      },
      profile: function(msg){
        if(_level > 5) return;
        ext.logger.profile(name+": "+msg);
      },
      data: function(msg){
        if(_level > 6) return;
        ext.logger.data(name+": "+msg);
      },
      help: function(msg){
        if(_level > 7) return;
        ext.logger.help(name+": "+msg);
      },
      warn: function(msg){
        if(_level > 8) return;
        ext.logger.warn(name+": "+msg);
      },
      error: function(msg){
        if(_level > 9) return;
        ext.logger.error(name+": "+msg);
      },
      setLevel: function(level){
        _level = level;
      },
      getLevel: function(){
        return _level;
      }
    };
    loggers[name] = logger;
    return logger;
  };
  ext.getLogger = function(name){
    return loggers[name];
  };
  ext.setLevel = function(name, level){
    loggers[name].setLevel(level);
  };
  ext.getLevel = function(name){
    return loggers[name].getLevel(level);
  };
  
  //ext.middleware = router;
  
  return ext;
}