var crypto = require('crypto');
var moment = require('moment');
var dutil = require('../lib/date-util');

var setPluginState = function (req, res, next) {
    var allowedPlugins = ['firefly', 'yelp'];
    req.gf.User.findOneAsync({_id: req.session.passport.user._id})
    .then(function (user) {
      if (!user) {
        return index(req, res, next);
      }
      if (allowedPlugins.indexOf(req.params.pluginName) === -1) {
        return index (req, res, next);;
      }
      if (req.params.pluginState === 'activate') {
          console.log('activate');
          if (user.plugins.indexOf(req.params.pluginName) === -1) {
              user.plugins.push(req.params.pluginName);
          }
      } else if (req.params.pluginState === 'deactivate') {
          var pos = user.plugins.indexOf(req.params.pluginName);
          if (pos >= 0) {
              user.plugins.splice(pos, 1);
              req.session.passport.user.plugins.splice(pos, 1);
              console.log('plugins: ' + req.session.passport.user.plugins);
          }
      }
      return user.saveAsync();
    })
    .then(function () {
      index(req, res, next);
    })
    .error(function (err) {
      index(req, res, next);
    });
}

var unlinkApp = function (req, res, next) {
    var tokensQuery = new Array();
    req.gf.Client.findOneAsync({_id: req.params.appId})
    .then (function (client) {
      return req.gf.AccessToken.findAsync({clientId: client.clientId, userId: req.session.passport.user._id});
    })
    .then (function (tokens) {
      if (tokens) {
        if (tokens) {
            for (var i = 0; i < tokens.length; i++) {
                tokensQuery.push({_id: tokens[i]._id});
            }
        }
      }
      return req.gf.AccessToken.find({$or: tokensQuery}).remove(function(err) {
          console.log('remove finished');
          index(req, res, next);
      });
  })
  .error(function (err) {
    index(req, res, next);
  });
}

var sessionRemove = function (req, res, next) {
    req.gf.Session.findOne({$and: [{sessionId: req.params.sessionId}, {userId: req.session.passport.user._id}]}, function(err, session) {
        if (!err) {
            if (session) {
                session.remove(function(err) {
                    index(req, res);
                });
            } else {
                index(req, res);
            }
        } else {
            index(req, res);
        }
    });
}

var fencelogRemove = function (req,res, next) {
    req.gf.Fencelog.findOne({$and: [{userId: req.session.passport.user._id}, {_id: req.params.fencelogId}]}, function(err, fencelog) {
        if (!err) {
            if (fencelog) {
                fencelog.remove(function(err) {
                    index(req, res);
                });
            } else {
                index(req, res);
            }
        } else {
            index(req, res);
        }
    });
}

var deleteAccount = function (req, res, next) {
    res.render('account/delete');
}

var postDeleteAccount = function (req, res, next) {
    if (req.session.passport.user._id === req.body.id) {
        var userId = req.session.passport.user._id;
        var toRemove = [];
        req.gf.async.series([
            function (cb) { // Remove all Fencelogs
                req.gf.Fencelog.remove({userId: userId}, function (err) {
                    cb();
                });
            },
            function (cb) { // Remove all authorization codes (oAuth v2 API)
                req.gf.AuthorizationCode.remove({userId: userId}, function (err) {
                    cb();
                });
            },
            function (cb) { // Remove all access tokens (oAuth v2 API)
                req.gf.AccessToken.remove({userId: userId}, function (err) {
                    cb();
                });
            },
            function (cb) { // Enumerate all oAuth v2 Clients
                req.gf.Client.find({userId: userId}, function (err, clients) {
                    for (var i = 0; i < clients.length; i++) {
                        toRemove.push({clientId: clients[i].clientId});
                    }
                    cb();
                });
            },
            function (cb) { // Remove all access tokens bound to other users but on this users' client
                req.gf.AccessToken.remove({$or: toRemove}, function (err) {
                    cb();
                });
            },
            function (cb) { // Remove all oAuth v2 Clients
                req.gf.Client.remove({userId: userId}, function (err) {
                    cb();
                });
            },
            function (cb) { // Remove all proprietary API sessions
                req.gf.Session.remove({userId: userId}, function (err) {
                    cb();
                });
            },
            function (cb) { // Remove all MQTT Messages
                req.gf.Mqtt.remove({userId: userId}, function (err) {
                    cb();
                });
            },
            function (cb) { // Finally remove the user himself
                req.gf.User.remove({_id: userId}, function (err) {
                    res.redirect('/logout');
                });
            }
        ]);
    } else {
        res.json({error: true}, 500);
    }
}

var postIndex = function (req, res, next) {
    if(req.body.changepw === 'true') {
        console.log('User want\'s to change his password!');
        if(req.body.password1.length > 0 && (req.body.password1 === req.body.password2)) {
            console.log('Passwords match!');
            console.log('req.gf.User.username: ' + req.session.passport.user.username + ' req.gf.User.email: ' + req.session.passport.user.email);
             req.gf.User.findOne({$and: [{username: req.session.passport.user.username}, {email: req.session.passport.user.email}]}, function(err, user) {
                if (!err) {
                    if (user) {
                        var hashed_pw = crypto.createHash('sha1').update(req.body.password1).digest('hex');
                        user.password = hashed_pw;
                        user.save(function(err) {
                            if (!err) {
                                req.success = 'Password saved!';
                            } else {
                               failure =
                               req.failure = 'Password could not be saved!';
                            }
                            index(req, res, next);
                        });
                    } else {
                        req.failure = 'Password has not been saved!';
                        index(req, res, next)
                    }
                } else {
                    req.failure = 'Password was not saved!';
                    index(req, res, next);
                }
            });
        } else {
            console.log('Passwords don\'t match!');
            req.failure = 'Passwords did not match!';
            index(req, res, next);
        }
    }
}

var index = function (req, res, next) {
    var sessionsResult = new Array();
    var tokensResult = new Array();
    var clientsResult = new Array();
    var currentPage = (req.query.page === undefined)?1:req.query.page;
    var pluginsActive = {firefly: false, yelp: false};
    var theUser;

    req.gf.async.series([
        function(cb){
            req.gf.Session.find({userId: req.session.passport.user._id}).sort('-created_at').exec(function(err, sessions) {
                for (var i = 0; i < sessions.length; i++) {
                    var session = sessions[i];
                    var formatted_date = moment(session.created_at).format('DD.MM.YYYY HH:mm:ss');
                    if (typeof req.session.timezone !== 'undefined' && req.session.timezone.length > 0) {
                        formatted_date = dutil().to_moment(session.created_at, req.session.timezone).format('DD.MM.YYYY HH:mm:ss');
                    }
                    session.created_at_formatted = formatted_date;
                    session.origin = session.origin.length>15 ? session.origin.substr(0,14)+'...' : session.origin;
                    sessionsResult.push(session);
                }
                cb();
            })
        },
        function(cb){
            req.gf.AccessToken.find({userId: req.session.passport.user._id}).sort('-created_at').exec(function(err, tokens) {
                for (var i = 0; i < tokens.length; i++) {
                    var token = tokens[i];
                    var formatted_date = moment(token.created_at).format('DD.MM.YYYY HH:mm:ss');
                    if (typeof req.session.timezone !== 'undefined' && req.session.timezone.length > 0) {
                        formatted_date = dutil().to_moment(token.created_at, req.session.timezone).format('DD.MM.YYYY HH:mm:ss');
                    }
                    token.created_at_formatted = formatted_date;
                    tokensResult.push(token);
                }
                cb();
            })
        },
        function(cb) {
            qobs = new Array();
            for (var i = 0; i < tokensResult.length; i++) {
                qobs.push({clientId: tokensResult[i].clientId});
            }
            var query = {$or:qobs}
            req.gf.Client.find(query, function(err, clients) {
                if (!err) {
                    if (clients) {
                        for (var i = 0; i < clients.length; i++) {
                            for (var j = 0; j < tokensResult.length; j++) {
                                if (tokensResult[j].clientId === clients[i].clientId) {
                                  var clientName = clients[i].name.length>15 ? clients[i].name.substr(0,14)+'...' : clients[i].name;
                                  clientsResult.push({firstUse: tokensResult[j].created_at_formatted, name: clientName, id: clients[i]._id});
                                  break;
                                }
                            }
                        }
                    }
                }
                cb();
            });
        },
        function(cb) {
            req.gf.User.findOne({_id: req.session.passport.user._id}, function(err, user) {
                if (!err) {
                    if (user) {
                        theUser = user;
                        if(user.plugins.indexOf('firefly') >= 0) { // Firefly active
                            pluginsActive.firefly = true;
                        }
                        if(user.plugins.indexOf('yelp') >= 0) { // Yelp active
                            pluginsActive.yelp = true;
                        }
                        cb();
                    } else {
                        cb();
                    }
                } else {
                    cb();
                }
            });
        },
        function(cb) {
            if (isNaN(currentPage) || currentPage < 1) {
                currentPage = 1;
            }
            req.gf.Fencelog.count({userId: req.session.passport.user._id}, function(err,c) {
                if (currentPage > Math.ceil(c/10)) {
                    currentPage = Math.ceil(c/10);
                };
                req.gf.Fencelog.find({userId: req.session.passport.user._id}).skip((currentPage - 1) * 10).limit(10).sort('-created_at').exec(function(err, fencelogs) {
                    var fencelogsResult = new Array();
                    if (!err) {
                        if (fencelogs) {
                            for (var i = 0; i < fencelogs.length; i++) {
                                var fencelog = fencelogs[i];
                                var formatted_date = moment(fencelog.created_at).format('DD.MM.YYYY HH:mm:ss');
                                if (typeof req.session.timezone !== 'undefined' && req.session.timezone.length > 0) {
                                    formatted_date = dutil().to_moment(fencelog.created_at, req.session.timezone).format('DD.MM.YYYY HH:mm:ss');
                                }
                                fencelog.created_at_formatted = formatted_date;
                                fencelog.icon = (fencelog.fenceType === 'ibeacon')?'icon-ibeacon.png':'icon-geofence.png';
                                fencelogsResult.push(fencelog);
                            }
                        }
                    }
                    var account = { avatar: crypto.createHash('md5').update(req.session.passport.user.email).digest("hex"), tfa: theUser.tfa.enabled===true };
                    var fencelogsSessions = {fencelogs: fencelogsResult, sessions: sessionsResult, clients: clientsResult, plugins:pluginsActive, tokens: tokensResult, pages: {max: c, current: currentPage}};
                    res.render('account/index', {title: 'Geofancy', fencelogsSessions: fencelogsSessions, success: req.success, failure: req.failure, account: account});
                });
            });
        }
    ]);
}

module.exports = {
    index: index,
    postIndex: postIndex,
    sessionRemove: sessionRemove,
    fencelogRemove: fencelogRemove,
    unlinkApp: unlinkApp,
    setPluginState: setPluginState,
    deleteAccount: deleteAccount,
    postDeleteAccount: postDeleteAccount
};
