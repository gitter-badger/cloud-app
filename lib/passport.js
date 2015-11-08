var passport = require('passport');
var config = require('./config.js').getConfig();

// mongodb schemas
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('../models/user');
var Client = require('../models/client');
var Session = require('../models/session');
var AccessToken = require('../models/access_token');

var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;

exports.passport = passport;

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// passport local strategy
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({$and: [{username: username}, {locked: false}]}, function (err, user) {
      console.log('> Login result: ' + err + ' User: ' + user);
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, {
          message: 'Incorrect username.'
        });
      }
      if (!user.validPassword(password, user.password)) {
        console.log('INCORRECT PASSWORD');
        return done(null, false, {
          message: 'Incorrect password.'
        });
      }
      console.log('SUCCESS!');
      user.loggedin_at = new Date;
      console.log('user: ' + JSON.stringify(user));
      user.save(function(err) {
        return done(null, user);
      });
    });
  }
));

// passport facebook strategy
passport.use(new FacebookStrategy({
    clientID: config.fb_app_id,
    clientSecret: config.fb_app_secret,
    callbackURL: config.fb_auth_callback
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(JSON.stringify(profile));
    // return;
    createAccount(profile, done)
  }
));

// passport twitter strategy
passport.use(new TwitterStrategy({
    consumerKey: config.tw_consumer_key,
    consumerSecret: config.tw_consumer_secret,
    callbackURL: config.tw_auth_callback
  },
  function(token, tokenSecret, profile, done) {
    console.log(JSON.stringify(profile));
    // return;
    createAccount(profile, done)
  }
));

// passport bearer strategy
passport.use(new BearerStrategy(
  function(token, done) {
    // User.findOne({ token: token }, function (err, user) {
    //   if (err) { return done(err); }
    //   if (!user) { return done(null, false); }
    //   return done(null, user, { scope: 'read' });
    // });
    AccessToken.findOne({token: token}, function(err, atoken) {
      if (err) {
        return done(err);
      }
      if (!atoken) {
        return done(null, false);
      }
      Client.findOne({clientId: atoken.clientId}, function (err, client) {
        if (err) {
          return done(err);
        }
        if (!client) {
          return done(null, false);
        }
        User.findOne({_id: atoken.userId}, function(err, user) {
          if (err) {
            return done(err);
          }
          if(!user) {
            return done(null, false);
          }
          return done(null, user, {scope: 'read'});
        });
      })
    });
  }
));

// passport basic strategy
passport.use(new BasicStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (!user.validPassword(password, user.password)) { return done(null, false); }
      return done(null, user);
    });
  }
));

// passport oauth2-client-password strategy
passport.use(new ClientPasswordStrategy(
  function(clientId, clientSecret, done) {
    Client.findOne({ clientId: clientId }, function (err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (client.clientSecret != clientSecret) { return done(null, false); }
      return done(null, client);
    });
  }
));

function createAccount(profile, done) {
  var searchQuery = {};
  var facebookId = '';
  var twitterId = '';
  var provider = profile.provider;
  if (provider === "facebook") {
    facebookId = profile.id;
    searchQuery = {facebookId: facebookId};
  } else {
    twitterId = profile.id;
    searchQuery = {twitterId: twitterId};
  }
  User.findOne(searchQuery, function (err, user) {
    if (err) {
      return done(err);
    }
    if (!user) {
      var finalUsername = profile.username;
      User.findOne({username: finalUsername}, function (err, existingUser) {
        if (existingUser) {
          finalUsername = profile.id;
        }
        var email = '';
        if (profile.email) {
          email = profile.email;
        } else if (profile.emails) {
          email = (profile.emails.length > 0)?profile.emails[0].value:'';
        } else {
          email = 'user' + profile.id + '@my.geofancy.com';
        }
        var newUser = new User({
          username: finalUsername,
          email: email,
          facebookId: facebookId,
          twitterId: twitterId
        });
        newUser.loggedin_at = new Date();
        newUser.save(function(err) {
          return done(err, newUser);
        });
      });
    } else {
      if (user.locked) {
        return done(null, null);
      }
      user.loggedin_at = new Date();
      user.save(function(err) {
        return done(err, user);
      })
    }
  });
}
