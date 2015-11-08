var uuid = require('node-uuid');

exports.get = function (req, res) {
  var sessionId = req.query.sessionId;
  if (typeof sessionId !== 'string') {
    res.json({error: 'bad request'}, 400);
  }

  var userId = null;
  var userObject = null;

  req.gf.async.series([
    function (cb) {
      req.gf.Session.findOne({sessionId: req.query.sessionId}, function (err, session) {
        if (err) {
          return res.json({error: 'internal server error 1'}, 500);
        }
        if (!session) {
          return res.json({error: 'unauthorized'}, 401);
        }

        userId = session.userId;

        cb();
      });
    },
    function (cb) {
      req.gf.User.findOne({_id: userId}, function (err, user) {
        if (err) {
          return res.json({error: 'internal server error'}, 500);
        }
        if (!user) {
          return res.json({error: 'user not found'}, 404);
        }

        userObject = user;

        cb();
      });
    },
    function (cb) {
      req.gf.Geofence.find({userId: userId, deleted: false}).sort({created_at: 1}).exec(function (err, geofences) {
        if (err) {
          return res.json({error: 'internal server error'}, 500);
        }

        res.json({error: false, geofences: geofences});
      });
    }
  ]);
}

exports.sync = function (req, res) {

  if (typeof req.query.lastSync !== 'string') {
    return res.json({error: 'lastSync missing'}, 400);
  }

  var userId = null;
  var userObject = null;

  req.gf.async.series([
    function (cb) {
      req.gf.Session.findOne({sessionId: req.query.sessionId}, function (err, session) {
        if (err) {
          return res.json({error: 'internal server error 1'}, 500);
        }
        if (!session) {
          return res.json({error: 'unauthorized'}, 401);
        }

        userId = session.userId;

        cb();
      });
    },
    function (cb) {
      req.gf.User.findOne({_id: userId}, function (err, user) {
        if (err) {
          return res.json({error: 'internal server error 2'}, 500);
        }
        if (!user) {
          return res.json({error: 'user not found'}, 404);
        }

        userObject = user;

        cb();
      });
    },
    function (cb) {
      var newDate = new Date(parseInt(req.query.lastSync) * 1000);
      console.log('newDate:'+newDate);
      req.gf.Geofence.find({userId: userId, "modified_at": {"$gt": newDate}}, function (err, geofences) {
        if (err) {
          return res.json({error: 'internal server error 3'}, 500);
        }
        if (!geofences) {
          return res.json({error: 'no geofences found'}, 404);
        }

        var deleted = [];

        var i = geofences.length;
        while (i--) { // loop in reverse to avoid problems when slicing elements
          var geofence = geofences[i];
          if (geofence.deleted === true) {
            deleted.push({
              _id: geofence._id,
              userId: geofence.userId,
              locationId: geofence.locationId,
              deleted: true,
              modified_at: geofence.modified_at,
              created_at: geofence.created_at
            });
            geofences.splice(i,1); // throw away this geofence
          }
        }

        res.json({error: false, geofences: geofences, deleted: deleted});
        cb();
      });
    }
  ]);
}

exports.add = function (req, res) {

  var userId = null;
  var userObject = null;
  var geofenceCount = 0;

  req.gf.async.series([
    function (cb) {
      req.gf.Session.findOne({sessionId: req.params.sessionId}, function (err, session) {
        if (err) {
          return res.json({error: 'internal server error 4'}, 500);
        }
        if (!session) {
          return res.json({error: 'unauthorized'}, 401);
        }

        userId = session.userId;
        cb();
      });
    },
    function (cb) {
      req.gf.Geofence.count({userId: userId}, function (err, count) {
        if (!err) {
          geofenceCount = count + 1;
        }
        cb();
      });
    },
    function (cb) {
      req.gf.User.findOne({_id: userId}, function (err, user) {
        if (err) {
          return res.json({error: 'internal server error 2'}, 500);
        }
        if (!user) {
          return res.json({error: 'user not found'}, 404);
        }

        userObject = user;

        cb();
      });
    },
    function (cb) {
      req.gf.Geofence.count({userId: userObject._id, deleted: false}, function (err, count) {
        if (err) {
          return res.send({error: true}, 500);
        }
        console.log('count:'+count);
        if (count >= 20) {
          // limit has been reached
          return res.send({error: 'geofence limit reached'}, 509);
        }
        cb();
      });
    },
    function (cb) {
      var newGeofence = new req.gf.Geofence({
        userId: userObject._id,
        origin: req.body.origin,
        uuid: uuid.v4(),
        locationId: req.body.locationId ? req.body.locationId : 'Location ' + geofenceCount,
        location: {
          lon: parseFloat(req.body.lon),
          lat: parseFloat(req.body.lat),
          radius: parseInt(req.body.radius)
        },
        triggerOnArrival: {
          enabled: (parseInt(req.body.triggerOnArrival) === 1) ? true : false,
          method: parseInt(req.body.triggerOnArrivalMethod),
          url: req.body.triggerOnArrivalUrl
        },
        triggerOnLeave: {
          enabled: (parseInt(req.body.triggerOnLeave) === 1) ? true : false,
          method: parseInt(req.body.triggerOnLeaveMethod),
          url: req.body.triggerOnLeaveUrl
        },
        basicAuth: {
          enabled: (parseInt(req.body.basicAuth) === 1) ? true : false,
          username: req.body.basicAuthUsername,
          password: req.body.basicAuthPassword
        }
      });
      newGeofence.save(function(err) {
        if (err) {
          return res.json({error: true}, 500);
        }
        res.json({error: false});
        cb();
      });
    }
  ]);
}

exports.update = function (req, res) {

  var userId = null;
  var userObject = null;
  var geofenceCount = 0;

  req.gf.async.series([
    function (cb) {
      req.gf.Session.findOne({sessionId: req.params.sessionId}, function (err, session) {
        if (err) {
          return res.json({error: 'internal server error 4'}, 500);
        }
        if (!session) {
          return res.json({error: 'unauthorized'}, 401);
        }

        userId = session.userId;
        cb();
      });
    },
    function (cb) {
      req.gf.Geofence.count({userId: req.session.passport.user._id}, function (err, count) {
        if (!err) {
          geofenceCount = count + 1;
        }
        cb();
      });
    },
    function (cb) {
      req.gf.User.findOne({_id: userId}, function (err, user) {
        if (err) {
          return res.json({error: 'internal server error 2'}, 500);
        }
        if (!user) {
          return res.json({error: 'user not found'}, 404);
        }

        userObject = user;

        cb();
      });
    },
    function (cb) {
      req.gf.Geofence.findOne({_id: req.params.geofenceId}, function (err, geofence) {
        if (err) {
          return res.json({error: 'geofence not found'}, 404);
        }
        geofence.userId = userObject._id;
        geofence.locationId = req.body.locationId ? req.body.locationId : 'Location ' + geofenceCount,
        geofence.location = {
          lon: parseFloat(req.body.lon),
          lat: parseFloat(req.body.lat),
          radius: parseInt(req.body.radius)
        },
        geofence.triggerOnArrival = {
          enabled: (parseInt(req.body.triggerOnArrival) === 1) ? true : false,
          method: req.body.triggerOnArrivalMethod,
          url: req.body.triggerOnArrivalUrl
        },
        geofence.triggerOnLeave = {
          enabled: (parseInt(req.body.triggerOnLeave) === 1) ? true : false,
          method: req.body.triggerOnLeaveMethod,
          url: req.body.triggerOnLeaveUrl
        },
        geofence.basicAuth = {
          enabled: (parseInt(req.body.basicAuth) === 1) ? true : false,
          username: req.body.basicAuthUsername,
          password: req.body.basicAuthPassword
        }
        geofence.save(function(err) {
          if (err) {
            return res.json({error: true}, 500);
          }
          res.json({error: false});
          cb();
        });
      });
    }
  ]);
}
