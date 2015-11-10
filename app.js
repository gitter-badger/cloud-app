// Module dependencies.
var express = require('express');
var http = require('http');
var path = require('path');
var flash = require('connect-flash');
var url = require('url');
var minify = require('express-minify');
var connectError = require('connect-error');
var login = require('connect-ensure-login');
var passport = require('./lib/passport').passport;
var async = require('async');
var RedisStore = require ('connect-redis')(express);
var sessionStore = new RedisStore();
var socket = require('./lib/socket');
var gitrevtool = require('./lib/helper/git-rev');
var utils = require('./lib/utils');
var responseTime = require('response-time')
var expressStats = require('./lib/express-stats');
var tfa = require('./lib/tfa');

// Config
var config = require('./lib/config.js').getConfig();

// Moscaline (the MQTT Broker)
var Moscaline = require('./lib/moscaline');
var moscaline = new Moscaline();

// mongodb schemas
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// string truncation prototype
String.prototype.trunc = String.prototype.trunc ||
function(n){
    return this.length>n ? this.substr(0,n-1)+'...' : this;
};

// socket.io Clients
var socketClients = {};

if (!config.is_json) {
  mongoose.connect(config.mongodb_url);
} else if (config.mongodb_username && config.mongodb_password) {
    mongoose.connect('mongodb://' + config.mongodb_username + ':' + config.mongodb_password + '@' + config.mongodb_server + ':' + config.mongodb_port + '/' + config.mongodb_dbname);
} else {
    mongoose.connect('mongodb://' + config.mongodb_server + ':' + config.mongodb_port + '/' + config.mongodb_dbname);
}

// get current git commit short version
var gitrev = 'Unknown';
gitrevtool.short(function (commit) {
  gitrev = commit;
});

var app = express();

// setup redis
if(typeof config.redis_url !== 'undefined') {
  if(config.redis_url.length > 0){
    sessionStore = new RedisStore({url: config.redis_url});
  }
}

// force ssl
var forceSsl = function (req, res, next) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  next();
};

// Other Middlewares
app.disable('x-powered-by');
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(connectError());
app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
if (typeof process.env.NODE_ENV !== 'undefined' && process.env.NODE_ENV === 'production' && process.env.FORCE_SSL !== 'false') {
  app.use(forceSsl);
}
// Basic Auth (e.g. for Staging System)
if(typeof process.env.BASIC_AUTH_USER !== 'undefined' && typeof process.env.BASIC_AUTH_PASS !== 'undefined') {
    app.use(express.basicAuth(process.env.BASIC_AUTH_USER, process.env.BASIC_AUTH_PASS));
}
app.use(express.cookieParser('e0e66b926b6021aa79194b68162e015bffe38646'));
app.use (express.session({secret: "keyboard cat", store: sessionStore, key: 'hello.sid'}));
app.use(function(req, res, next) {
	res.setHeader('X-Powered-By', 'Geofancy');
  res.setHeader('X-Geofancy-Node', config.servername);
  res.setHeader('X-Git-Revision', gitrev);
	next();
});
app.use(responseTime());
app.use(expressStats());
app.use(function(req, res, next) {
    if(!req.gf) { req.gf = {}; }
    if(!req.gf.utils) { req.gf.utils = utils; }
    if(!req.gf.config) { req.gf.config = config; }
    if(!req.gf.async) { req.gf.async = async; }
    if(!req.gf.socketClients) { req.gf.socketClients = socketClients; }
    if(!req.gf.moscaline) { req.gf.moscaline = moscaline; }
    next();
});
app.use(require('./lib/schemify'));
app.use(function(req, res, next) {
    req.root = req.protocol + '://' + config.hostname;
    next();
});
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// pass session to views
app.use(function(req, res, next){
  res.locals.session = req.session;
  res.locals.pathname = url.parse(req.url).pathname;
  next();
});

// setup router
var router = require('./lib/router')(app, tfa, passport, login);

app.use(minify());
app.use(require('less-middleware')(path.join(__dirname, '/public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);
app.use(function(req, res, next){
  res.status(404);
  res.render('error/404', { status: 404, url: req.url });
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
} else {
  // Error 500 Middleware
  app.use(function(err, req, res, next){
    res.status(err.status || 500);
    res.render('error/500', {
        status: err.status || 500
      , error: err
    });
  });
}

// Post Setup
console.log('[Core] Application setup successfully, running in', process.env.NODE_ENV === 'production' ? 'Production' : 'Development');

// Express HTTP Server
var server = http.createServer(app);
socket.listen(server, socketClients);
server.listen(app.get('port'), function(){
  console.log('[Core] Express server listening on port ' + app.get('port'));
});

// MQTT Broker
moscaline.start();
