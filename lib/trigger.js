var Subscription = require('../models/subscription');
var Q = require('q');
var Promise = require('bluebird');
var Moscaline = require('./moscaline');
var User = Promise.promisifyAll(require('../models/user'));

var Trigger = module.exports = function Trigger () {
  this.moscaline = new Moscaline();
};

Trigger.prototype.triggerFencelog = function triggerFencelog (fencelog, cb) {
  return new Promise(function (resolve, reject) {
    var aUser;
    var payload;
    User.findOneAsync({_id: fencelog.userId})
    .then(function (user) {
      aUser = user;
      payload = {
        time: Date.now(),
        location: {
          id: fencelog.locationId,
          longitude: fencelog.location[0],
          latitude: fencelog.location[1]
        },
        fencelog: {
          type: fencelog.fenceType,
          event: fencelog.eventType
        },
        http: {
          method: fencelog.httpMethod,
          url: fencelog.httpUrl,
          statusCode: fencelog.httpResponseCode
        }
      };
      return this.moscaline.publish(user.username + '/' + fencelog.fenceType + '/' + fencelog.locationId + '/' + fencelog.eventType, JSON.stringify(payload), 0);
    }.bind(this))
    .then(function () {
      return this.moscaline.publish(aUser.username + '/' + fencelog.fenceType + '/' + fencelog.locationId, JSON.stringify(payload), 0);
    }.bind(this))
    .then(function () {
      triggerSubscriptions(fencelog, cb);
    });
  }.bind(this)).nodeify(cb)
};

function triggerSubscriptions (fencelog, cb) {
  var allRequests = [];
  Subscription.find({userId: fencelog.userId}, function (err, subscriptions) {
    if (!err) {
      if (subscriptions.length > 0) {
        for (var i = subscriptions.length - 1; i >= 0; i--) {
          var subscription = subscriptions[i];
          if (subscription.service === 'zapier') { // Zapier REST Hook Subscription
            var options = {
              uri: subscription.uri,
              method: 'POST',
              timeout: 3000,
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(sanitizeFencelog(fencelog))
            };
          }
          allRequests.push(doHttpRequest(options));
          Q.all(allRequests).then(function (data) {
            cb();
          });
        }
      } else {
        cb();
      }
    } else {
      cb();
    }
  });
}

function sanitizeFencelog(fencelog) {
  delete fencelog._v;
  delete fencelog.userId;
  delete fencelog._id;
  return fencelog;
}

function doHttpRequest(options) {
  var request = Q.denodeify(require('request'));
  return request(options).then(function(resultParams) {
    return resultParams[0];
  });
}
