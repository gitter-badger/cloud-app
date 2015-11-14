'use strict';

var uuid = require('node-uuid');
var Promise = require('bluebird');

exports.get = function (req, res) {
  req.gf.Geofence.find({userId: req.user._id, deleted: false}).sort({created_at: 1})
  .execAsync().then(function (geofences) {
    res.json({error: false, geofences: geofences});
  })
  .error (function (err) {
    res.json({error: 'internal server error'}, 500);
  })
  .catch (function (e) {
    console.log('Caught exception on /api/v1/geofences: ', e);
    res.json({error: 'internal server error'}, 500);
  });
};

exports.post = function (req, res) {
  createGeofence(req)
  .then(function (geofence) {
    return geofence.saveAsync();
  }).then(function () {
    res.json({error: false}, 201);
  })
  .error(function (err) {
    res.json({error: 'internal server error'}, 500);
  })
  .catch(function (e) {
    res.json({error: 'internal server error'}, 500);
  });
};

var createGeofence = function createGeofence (req) {
  return new Promise(function (resolve, reject) {
    var geofenceCount = 0;
    var origin = 'oAuth';
    if (typeof req.body.origin === 'string' && req.body.origin.length > 0) {
      origin = req.body.origin;
    }
    req.gf.Geofence.countAsync({userId: req.user._id})
    .then(function (count) {
      geofenceCount = count + 1;
      var newGeofence = new req.gf.Geofence({
        userId: req.user._id,
        origin: origin,
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
      resolve(newGeofence);
    })
    .error(function (error) {
      reject(error);
    })
    .catch(function (e) {
      reject(e);
    });
  });
};
