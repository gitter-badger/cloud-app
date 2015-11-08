var uuid = require('node-uuid');

exports.add = function (req, res) {
  var geofenceCount = 0;
  req.gf.async.series([
    function (cb) {
      req.gf.Geofence.count({userId: req.session.passport.user._id, deleted: false}, function (err, count) {
        if (err) {
          return res.send({error: true}, 500);
        }
        console.log('count:'+count);
        if (count >= 20) {
          // limit has been reached
          return res.send({error: true}, 509);
        }
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
      var newGeofence = new req.gf.Geofence({
        userId: req.session.passport.user._id,
        locationId: req.body.locationId ? req.body.locationId : 'Location ' + geofenceCount,
        location: req.body.location,
        triggerOnArrival: req.body.triggerOnArrival,
        triggerOnLeave: req.body.triggerOnLeave,
        basicAuth: req.body.basicAuth,
        origin: 'Web App',
        uuid: uuid.v4()
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

exports.get = function (req, res) {
  req.gf.Geofence.findOne({userId: req.session.passport.user._id, _id: req.params.id}, function (err, geofence) {
    if (err) {
      return res.json({error: true}, 500);
    }
    res.json({error: false, geofence: geofence});
  });
}

exports.update = function (req, res) {
  var geofenceCount = 0;
  req.gf.async.series([
    function (cb) {
      req.gf.Geofence.count({userId: req.session.passport.user._id}, function (err, count) {
        if (!err) {
          geofenceCount = count + 1;
        }
        cb();
      });
    },
    function (cb) {
      req.gf.Geofence.findOne({userId: req.session.passport.user._id, _id: req.params.id}, function (err, geofence) {
        if (err) {
          return res.json({error: true}, 500);
        }
        if (!geofence) {
          return res.json({error: true}, 500);
        }

        geofence.locationId = req.body.locationId ? req.body.locationId : 'Location ' + geofenceCount;
        geofence.location = req.body.location;
        geofence.triggerOnArrival = req.body.triggerOnArrival;
        geofence.triggerOnLeave = req.body.triggerOnLeave;
        geofence.basicAuth = req.body.basicAuth;
        geofence.modified_at = new Date();

        geofence.save(function(err) {
          res.json({error: false});
          cb();
        });
      });
    }
  ]);
}

exports.all = function (req, res) {
  req.gf.Geofence.find({userId: req.session.passport.user._id, deleted: false}, function (err, geofences) {
    if (err) {
      return res.json({error: true}, 500);
    }
    res.json({error: false, count: geofences.length, geofences: geofences});
  });
}

exports.remove = function (req, res) {
  req.gf.Geofence.find({userId: req.session.passport.user._id, _id: req.params.geofenceId}).limit(1).exec(function(error, geofences) {
    if (error) {
      return res.json({error: true}, 500);
    }
    if (geofences.length !== 1) {
      return res.json({error: true}, 500);
    }
    var geofence = geofences[0];
    geofence.deleted = true;
    geofence.save(function(err) {
      if (err) {
        return res.json({error: true}, 500);
      }
      res.json({error: false});
    });
  });
}
