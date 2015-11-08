exports.username = function (req, res) {
    console.log(req.body.username);
    req.gf.User.findOne({username: req.body.username}, function (err, user) {
        console.log('Error: ' + err + ' User: ' + user);
        if(!err) {
            if(user) {
                res.send({error: 'Username not available'});
            } else {
                res.send({success: 'User not existing'});
            }
        } else {
            res.send({error: 'Server error'});
        }
    });
};

exports.fencelogs = function (req, res) {
    req.gf.Session.findOne({sessionId: req.params.sessionId}, function(err, session) {
        if (!err) {
            if (session) {
                req.gf.User.findOne({_id: session.userId}, function (err, user) {
                    if(!err) {
                        if(user) {
                            req.gf.Fencelog.find({userId: user._id}, {userId: 0, _id: 0, __v: 0}).sort('-created_at').exec(function (err, docs) {
                                if (!err) {
                                    res.send({success: 'OK', fencelogs: docs}, 200);
                                } else {
                                    res.send({error: 'Internal Server error'}, 500);
                                }
                            });
                        } else {
                            res.send({error: 'User not found'}, 404);
                        }
                    } else {
                        res.send({error: 'Internal Server error'}, 500);
                    }
                });
            } else {
                res.send({error: 'session invalid'}, 401);
            }
        } else {
            res.send({error: 'server error'}, 500);
        }
    });
};

exports.fencelogsAdd = function (req, res) {
    var Trigger = require('../lib/trigger');
    var trigger = new Trigger();
    req.gf.Session.findOne({sessionId: req.params.sessionId}, function (err, session) {
        if (!err) {
            if (session) {
                req.gf.User.findOne({_id: session.userId}, function (err, user) {
                    if (!err) {
                        if (user) {
                          var origin = ((typeof req.body.origin) == 'string') ? req.body.origin : 'Unknown';
                          var newFencelog = new req.gf.Fencelog({
                              userId: user._id,
                              location: [req.body.longitude, req.body.latitude],
                              locationId: req.body.locationId,
                              httpUrl: req.body.httpUrl,
                              httpMethod: req.body.httpMethod,
                              httpResponseCode : req.body.httpResponseCode,
                              httpResponse: req.body.httpResponse,
                              eventType: req.body.eventType,
                              fenceType: req.body.fenceType,
                              origin: origin
                          });
                          newFencelog.save(function(err) {
                              console.log('Fencelog Save Error: ' + err);
                              if (!err) {
                                  if (typeof req.gf.socketClients[user.username] === 'object') {
                                      var socket = req.gf.socketClients[user.username];
                                      socket.emit('fencelog', {event: 'add', fencelog: newFencelog});
                                  }
                                  trigger.triggerFencelog(newFencelog, function () {
                                      console.log('All triggers done');
                                  });
                                  res.send({success: 'OK', 'userId': user._id}, 200);
                              } else {
                                  res.send({error: 'Fencelog save failed', 'userId': user._id}, 500);
                              }
                          });
                        } else {
                            res.send({error: 'User not found'}, 404);
                        }
                    } else {
                        res.send({error: 'Internal Server error'}, 500);
                    }
                });
            } else {
                res.send({error: 'session invalid'}, 401);
            }
        } else {
            res.send({error: 'server error'}, 500);
        }
    });
};

exports.signup = function (req, res) {
    var crypto = require('crypto');

    if (crypto.createHash('sha1').update(req.body.username + ':' + req.body.password + '%' + req.body.email).digest('hex') !== req.body.token) {
        res.send({error: 'unauthorized'}, 401);
        return;
    }

    req.gf.User.findOne({$or: [{username: req.body.username}, {email: req.body.email}]}, function (err, user) {
        if (!err) {
            if (!user) {

                var new_user = new req.gf.User({
                    username: req.body.username,
                    email: req.body.email,
                    password: crypto.createHash('sha1').update(req.body.password).digest('hex')
                });

                new_user.save(function (err) {
                    if (err) {
                        res.send({error: 'signup error'}, 500);
                    } else {
                        res.send({success: 'signup success'}, 200);
                    }
                });

            } else {
                res.send({error: 'user existing'}, 409);
            }
        } else {
            res.send({error: 'server error'}, 500);
        }
    });
}

exports.session = function (req, res) {
    var crypto = require('crypto');

    if ((typeof req.query.username) !== 'string' || (typeof req.query.password) !== 'string') {
        res.send({error: 'user not existing'}, 404);
        return;
    };

    if (req.query.username.length === 0 || req.query.password.length === 0) {
      res.send({error: 'user not existing'}, 404);
      return;
    }

    req.gf.User.findOne({$and: [{username: req.query.username}, {password: crypto.createHash('sha1').update(req.query.password).digest('hex')}]}, function (err, user) {
        if (!err) {
            if (user) {
              var origin = (typeof req.query.origin) !== 'string' ? 'Unknown App' : req.query.origin;
                req.gf.Session.remove({userId: user._id, origin: origin}, function(err, numberRemoved) {
                    var msec = new Date().getTime().toString();
                    var sessid = crypto.createHash('sha1').update(user.username + '%' + msec).digest('hex');
                    var new_session = new req.gf.Session({
                        userId: user._id,
                        sessionId: sessid,
                        origin: origin
                    });
                    new_session.save(function(err) {
                        if (!err) {
                            res.send({success: sessid});
                        } else {
                            res.send({error: 'server error'}, 500);
                        }
                    });
                });
            } else {
                res.send({error: 'user not existing'}, 404);
            }
        } else {
            res.send({error: 'server error'}, 500);
        }
    });
}

exports.sessionCheck = function (req, res) {
    req.gf.Session.findOne({sessionId: req.params.sessionId},function (err, session) {
      if (err) {
        return res.send({error: 'server error'}, 500);
      }

      if (!session) {
        return res.send({error: 'session invalid'}, 401);
      }

      if ((typeof req.query.origin) === 'string') {
        session.origin = req.query.origin;
      }

      req.gf.async.series([
        function (cb) {
          session.save(function(){
            cb();
          });
        },
        function () {
          res.send({success: 'session valid'}, 200);
        }
        ]);
    });
}

exports.around = function (req, res) {
    req.gf.Session.findOne({sessionId: req.params.sessionId},function (err, session) {
        if (!err) {
            if (session) {
                // Session valid, check which plugins are active
                req.gf.User.findOne({_id: session.userId}, function (err, user) {
                    if (!err) {
                        if (user) {
                            var plugins = require('../lib/plugins');
                            var ffLocations = new Array();
                            var yelpResult = {success: false, locations: new Array()};
                            req.gf.async.series([
                                // Firefly
                                function (cb) {
                                    if (user.plugins.indexOf('firefly') >= 0) {
                                        plugins.getFireflyLocations(function(locations){
                                            ffLocations = locations;
                                            cb();
                                        });
                                    } else {
                                        cb();
                                    }
                                },
                                // Yelp
                                function (cb) {
                                    if (user.plugins.indexOf('yelp') >= 0) {
                                        plugins.searchYelpByLatLng(req.query.lon, req.query.lat, req.query.term, function (data) {
                                            if(data.businesses) {
                                                finalLocations = new Array();
                                                for (var i = 0; i < data.businesses.length; i++) {
                                                    finalLocations.push({
                                                        name: data.businesses[i].name,
                                                        location: data.businesses[i].location,
                                                        image_url: data.businesses[i].image_url,
                                                        url: data.businesses[i].url,
                                                        mobile_url: data.businesses[i].mobile_url
                                                    });
                                                }
                                                yelpResult.success = true;
                                                yelpResult.locations = finalLocations;
                                                cb();
                                            } else {
                                                cb();
                                            }
                                        });
                                    } else {
                                        cb();
                                    }
                                },
                                function (cb) {
                                    res.send({firefly: ffLocations, yelp: yelpResult}, 200);
                                }
                            ]);
                        } else {
                            res.send({error: 'server error'}, 500);
                        }
                    } else {
                        res.send({error: 'server error'}, 500);
                    }
                });
            } else {
                res.send({error: 'session invalid'}, 401);
            }
        } else {
            res.send({error: 'server error'}, 500);
        }
    });
}

function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}

exports.today = function (req, res) {
  var aSession;
  var aUser;
  req.gf.async.series([
    function (cb) {
      req.gf.Session.findOne({sessionId: req.query.sessionId},function (err, session) {
        if (err) {
          return res.json({error: 'internal server error'}, 500);
        }
        if (!session) {
          return res.json({error: 'unauthorized'}, 401);
        }
        aSession = session;
        cb();
      });
    },
    function (cb) {
      req.gf.User.findOne({_id: aSession.userId}, function (err, user) {
        if (err || !user) {
          return res.json({error: 'internal server error'}, 500);
        }
        aUser = user;
        cb();
      });
    },
    function (cb) {
      req.gf.Fencelog.findOne({userId: aUser._id}).sort({created_at:-1}).exec(function (err, fencelog) {
        if (err) {
          return res.json({error: 'internal server error'}, 500);
        }
        if (!fencelog) {
          return res.json({error: 'not found'}, 404);
        }
        res.json({error: false, fencelog: fencelog});
      });
    }
  ]);
}
