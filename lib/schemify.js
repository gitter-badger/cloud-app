'use strict';

var Promise = require('bluebird');

var User = Promise.promisifyAll(require('../models/user'));
var PasswordRequest = Promise.promisifyAll(require('../models/password_request'));
var Fencelog = Promise.promisifyAll(require('../models/fencelog'));
var Session = Promise.promisifyAll(require('../models/session'));
var AccessToken = Promise.promisifyAll(require('../models/access_token'));
var Client = Promise.promisifyAll(require('../models/client'));
var AuthorizationCode = Promise.promisifyAll(require('../models/authorization_code'));
var Subscription = Promise.promisifyAll(require('../models/subscription'));
var Geofence = Promise.promisifyAll(require('../models/geofence'));
var Mqtt = Promise.promisifyAll(require('../models/mqtt'));

module.exports = function (req, res, next) {
  if(!req.gf.User) { req.gf.User = User; }
  if(!req.gf.PasswordRequest) { req.gf.PasswordRequest = PasswordRequest; }
  if(!req.gf.Fencelog) { req.gf.Fencelog = Fencelog; }
  if(!req.gf.Session) { req.gf.Session = Session; }
  if(!req.gf.AccessToken) { req.gf.AccessToken = AccessToken; }
  if(!req.gf.Client) { req.gf.Client = Client; }
  if(!req.gf.AuthorizationCode) { req.gf.AuthorizationCode = AuthorizationCode; }
  if(!req.gf.Subscription) { req.gf.Subscription = Subscription; }
  if(!req.gf.Geofence) { req.gf.Geofence = Geofence; }
  if(!req.gf.Mqtt) { req.gf.Mqtt = Mqtt; }
  next();
};
