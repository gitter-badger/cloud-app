// Module dependencies.
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var flash = require('connect-flash');
var url = require('url');
var minify = require('express-minify');
var connectError = require('connect-error');
var login = require('connect-ensure-login');
var oauth2 = require('./lib/oauth2');
var passport = require('./lib/passport').passport;
var async = require('async');
var RedisStore = require ('connect-redis')(express);
var sessionStore = new RedisStore();
var socket = require('./lib/socket');
var gitrevtool = require('./lib/helper/git-rev');
var utils = require('./lib/utils');
var Promise = require('bluebird');
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
var User = require('./models/user');
var PasswordRequest = require('./models/password_request');
var Fencelog = Promise.promisifyAll(require('./models/fencelog'));
var Session = Promise.promisifyAll(require('./models/session'));
var AccessToken = Promise.promisifyAll(require('./models/access_token'));
var Client = Promise.promisifyAll(require('./models/client'));
var AuthorizationCode = Promise.promisifyAll(require('./models/authorization_code'));
var Subscription = Promise.promisifyAll(require('./models/subscription'));
var Geofence = Promise.promisifyAll(require('./models/geofence'));
var Mqtt = Promise.promisifyAll(require('./models/mqtt'));

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
// app.use(express.session());
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
    if(!req.gf.User) { req.gf.User = User; }
    if(!req.gf.PasswordRequest) { req.gf.PasswordRequest = PasswordRequest; }
    if(!req.gf.Fencelog) { req.gf.Fencelog = Fencelog; }
    if(!req.gf.Session) { req.gf.Session = Session; }
    if(!req.gf.AccessToken) { req.gf.AccessToken = AccessToken; }
    if(!req.gf.Client) { req.gf.Client = Client; }
    if(!req.gf.AuthorizationCode) { req.gf.AuthorizationCode = AuthorizationCode; }
    if(!req.gf.config) { req.gf.config = config; }
    if(!req.gf.async) { req.gf.async = async; }
    if(!req.gf.socketClients) { req.gf.socketClients = socketClients; }
    if(!req.gf.Subscription) { req.gf.Subscription = Subscription; }
    if(!req.gf.Geofence) { req.gf.Geofence = Geofence; }
    if(!req.gf.Mqtt) { req.gf.Mqtt = Mqtt; }
    if(!req.gf.moscaline) { req.gf.moscaline = moscaline; }
    next();
});
app.use(function(req, res, next) {
    req.root = req.protocol + '://' + config.hostname; //req.get('host');
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

// Timezone
var sessionifyTimezone = function (req, res, next){
  if (typeof req === 'undefined' || typeof req.session === 'undefined') {
    next();
    return;
  }
  req.session.timezone = req.body.timezone;
  next();
}

app.get('/', tfa.ensure, routes.index);
app.get('/auth/facebook', passport.authenticate('facebook', {scope: 'email'}));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {successRedirect: '/', failureRedirect: '/login'}));
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/login' }));
app.get('/location/:locationId', login.ensureLoggedIn('/login'), require('./routes/location').index);
app.get('/account', login.ensureLoggedIn('/login'), tfa.ensure, require('./routes/account').index);
app.get('/account/delete', login.ensureLoggedIn('/login'), require('./routes/account').deleteAccount);
app.get('/account/session/remove/:sessionId', login.ensureLoggedIn('/login'), require('./routes/account').sessionRemove);
app.get('/account/fencelog/remove/:fencelogId', login.ensureLoggedIn('/login'), require('./routes/account').fencelogRemove);
app.get('/account/app/unlink/:appId', login.ensureLoggedIn('/login'), require('./routes/account').unlinkApp);
app.get('/account/plugin/:pluginName/:pluginState', login.ensureLoggedIn('/login'), require('./routes/account').setPluginState);
app.get('/account/export/fencelogs', login.ensureLoggedIn('/login'), require('./routes/account/export/fencelogs').fencelogs);
app.get('/account/export/fencelogs.csv', login.ensureLoggedIn('/login'), require('./routes/account/export/fencelogs').downloadAllFencelogsAsCsv);
app.get('/account/export/fencelogs.json', login.ensureLoggedIn('/login'), require('./routes/account/export/fencelogs').downloadAllFencelogsAsJson);
app.get('/account/schedule', login.ensureLoggedIn('/login'), tfa.ensure, require('./routes/account/schedule').index);
app.post('/account/geofence/add', login.ensureLoggedIn('/login'), require('./routes/account/geofence').add);
app.get('/account/geofence/:id', login.ensureLoggedIn('/login'), require('./routes/account/geofence').get);
app.put('/account/geofence/:id', login.ensureLoggedIn('/login'), require('./routes/account/geofence').update);
app.get('/account/geofence', login.ensureLoggedIn('/login'), require('./routes/account/geofence').all);
app.delete('/account/geofence/:geofenceId/remove', login.ensureLoggedIn('/login'), require('./routes/account/geofence').remove);
app.get('/account/mqtt', login.ensureLoggedIn('/login'), tfa.ensure, require('./routes/account/mqtt').index);
app.get('/account/tfa', login.ensureLoggedIn('/login'), require('./routes/account/tfa').index);
app.post('/account/tfa', login.ensureLoggedIn('/login'), require('./routes/account/tfa').activate);
app.delete('/account/tfa', login.ensureLoggedIn('/login'), require('./routes/account/tfa').disable);
app.get('/two-factor', login.ensureLoggedIn('/login'), require('./routes/two-factor').index);
app.post('/two-factor', login.ensureLoggedIn('/login'), require('./routes/two-factor').unlock);

app.get('/developer', tfa.ensure, require('./routes/developer').index);
app.get('/developer/app/create', login.ensureLoggedIn('/login'), require('./routes/developer').createApp);
app.get('/developer/app/:appId', login.ensureLoggedIn('/login'), require('./routes/developer').editApp);
app.get('/support', require('./routes/support').index);
// app.get('/imprint', require('./routes/imprint').index);
app.get('/legal', require('./routes/legal').index);
app.get('/youforgot', login.ensureNotLoggedIn('/account'), require('./routes/youforgot').index);
app.get('/newpassword/:token', login.ensureNotLoggedIn('/account'), require('./routes/newpassword').index);
app.get('/signup', login.ensureNotLoggedIn('/account'), require('./routes/signup').index);
app.get('/login', login.ensureNotLoggedIn('/account'), require('./routes/login').index);
app.get('/logout', function(req, res){ req.session.passport.tfa_done = false; req.logout(); res.redirect('/'); });

app.post('/login', sessionifyTimezone, passport.authenticate('local', {successReturnToOrRedirect: '/', failureRedirect: '/login', failureFlash: true}));
app.post('/signup', require('./routes/signup').create);
app.post('/youforgot', require('./routes/youforgot').request);
app.post('/account', login.ensureLoggedIn('/login'), require('./routes/account').postIndex);
app.post('/account/delete', login.ensureLoggedIn('/login'), require('./routes/account').postDeleteAccount);
app.post('/developer', login.ensureLoggedIn('/login'), require('./routes/developer').saveApp);
app.post('/support', require('./routes/support').sendRequest);

// plugins
app.get('/plugin/firefly/:pluginItemId', login.ensureLoggedIn('/login'), require('./routes/plugin/firefly').show);
app.get('/plugin/yelp/:lon/:lat/:category', login.ensureLoggedIn('/login'), require('./routes/plugin/yelp').showByLatLng);
app.get('/plugin/yelp/:location/:category', login.ensureLoggedIn('/login'), require('./routes/plugin/yelp').showByLocation);

// private api
app.post('/api/username', require('./routes/api').username);
app.get('/api/fencelogs/:sessionId', require('./routes/api').fencelogs);
app.post('/api/fencelogs/:sessionId', require('./routes/api').fencelogsAdd);
app.post('/api/signup', require('./routes/api').signup);
app.get('/api/session', require('./routes/api').session);
app.get('/api/session/:sessionId', require('./routes/api').sessionCheck);
app.get('/api/around/:sessionId', require('./routes/api').around);
app.get('/api/schedule', login.ensureLoggedIn('/login'), require('./routes/api/schedule').schedule);
app.get('/api/geofences', require('./routes/api/geofences').get);
app.get('/api/geofences/sync', require('./routes/api/geofences').sync);
app.post('/api/geofences/:sessionId', require('./routes/api/geofences').add);
app.put('/api/geofences/:sessionId/:geofenceId', require('./routes/api/geofences').update);
app.get('/api/today', require('./routes/api').today);
app.get('/api/mqtt/message', login.ensureLoggedIn('/login'), require('./routes/api/mqtt').getMessage);
app.delete('/api/mqtt/message', login.ensureLoggedIn('/login'), require('./routes/api/mqtt').deleteTopic);
app.post('/api/mqtt/message', login.ensureLoggedIn('/login'), require('./routes/api/mqtt').postMessage);
app.get('/api/mqtt/topic', login.ensureLoggedIn('/login'), require('./routes/api/mqtt').getTopic);
app.post('/api/anamnesis', require('./routes/api/anamnesis').add);

// public (oauth2) api
app.get('/api/v1/user', passport.authenticate('bearer', { session: false }), require('./routes/api/v1/user').index);
app.get('/api/v1/fencelogs', passport.authenticate('bearer', {session: false}), require('./routes/api/v1/fencelogs').index);
app.get('/api/v1/schedules', passport.authenticate('bearer', {session: false}), require('./routes/api/v1/schedules').index);
app.post('/api/v1/subscription/zapier', passport.authenticate('bearer', {session: false}), require('./routes/api/v1/subscription').subscribeZapier);
app.delete('/api/v1/subscription/zapier', passport.authenticate('bearer', {session: false}), require('./routes/api/v1/subscription').unsubscribeZapier);

// oauth2 authentication / token routes
app.get('/oauth2/authorize', oauth2.authorization);
app.post('/oauth2/authorize/decision', oauth2.decision);
app.post('/oauth2/token', oauth2.token);

// socket.io for testing purpose only!!!
app.get('/api/socket.io/fencelogs', login.ensureLoggedIn('/login'), require('./routes/api/socket.io/fencelogs').index);

app.all('/api/*', function(req, res) {
  res.send({error: 'Not Found'}, 404);
});

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
