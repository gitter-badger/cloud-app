var fs = require('fs');
var mosca = require('mosca');
var crypto = require('crypto');
var Promise = require('bluebird');
var User = Promise.promisifyAll(require('../models/user'));
var Mqtt = Promise.promisifyAll(require('../models/mqtt'));

var moscalineBackend = {
  type: 'mongo',
  url: 'mongodb://localhost:27017/mqtt',
  pubsubCollection: 'messages',
  mongo: {},
  persistence: {
    factory: mosca.persistence.Redis
  }
};

var SECURE_KEY = __dirname + '/../secure/mqtt-key.pem';
var SECURE_CERT = __dirname + '/../secure/mqtt-cert.pem';

var secure = {
  keyPath: SECURE_KEY,
  certPath: SECURE_CERT
};

// try to use MQTT CERT and KEY to provide TLS security
var isSecure = (fs.existsSync(secure.keyPath) && fs.existsSync(secure.certPath));
var settings = {
  port: 1883,
  backend: moscalineBackend,
  secure: isSecure ? secure : undefined
};

var server = null;

var authenticate = function(client, username, password, callback) {
  var authorized = false;
  authenticateUser(client, username, password, callback);
}

var authorizePublish = function(client, topic, payload, callback) {
  authorizeForTopic(client, topic, callback);
}

var authorizeSubscribe = function(client, topic, callback) {
  authorizeForTopic(client, topic, callback);
}

var authenticateUser = function (client, username, password, callback) {
  if (typeof username !== 'object' || typeof password !== 'object') {
    return callback(new Error('Missing Credentials'), false);
  }
  User.find({username: username.toString()}).or([{password: crypto.createHash('sha1').update(password.toString()).digest('hex')}, {password: password.toString()}]).limit(1).exec(function (err, users) {
    var user = users[0];
    if (err) {
      return callback(err, false);
    }
    if (!user) {
      return callback(null, false);
    }
    client.user = user;
    callback(null, true);
  });
}

var authorizeForTopic = function (client, topic, callback) {
  var authed = false;
  var split = topic.split('/')[0];
  if (client.user.username.toString() === split) {
    authed = true;
  }
  callback(null, authed);
}

var Moscaline = module.exports = function Moscaline () {
};

Moscaline.prototype.start = function start (cb) {
  return new Promise(function (resolve, reject) {
    server = new mosca.Server(settings);

    server.on('clientConnected', function(client) {
      console.log('[Moscaline] Client connected', client.id);
    }.bind(this));

    server.on('published', function(packet, client) {
      var username = null;
      if (client && client.user) {
        username = client.user.username;
      }
      if (typeof username === 'string' || typeof packet.mqttorigin === 'string') {
        var direction;
        if (!username) {
          username = packet.topic.split('/')[0];
        }
        if (typeof packet.mqttorigin === 'string') {
          direction = packet.mqttorigin;
        }
        if (typeof username === 'string') {
          mqttorigin = username;
          User.findOneAsync({username: username})
          .then(function (user) {
            if (!user) {
              return console.log('No MQTT User found for Username: ' + username);
            }
            if (!packet.mqttorigin) {
              direction = 'in';
            }
            var mqtt = new Mqtt({
              topic: packet.topic,
              message: packet.payload.toString(),
              direction: direction,
              userId: user._id,
              clientId: (typeof client !== 'undefined' && client !== null) ? client.id : 'Server'
            })
            return mqtt.saveAsync();
          }.bind(this))
          .error(function (err) {
            console.log('Error while looking up MQTT User for Username: ' + username);
          })
          .catch(function (ex) {
            console.log('Caught Exception (' + ex + ') while looking up MQTT User for Username: ' + username);
          });
        }
      }
      if (packet.topic.indexOf('$SYS/') !== 0) {
        console.log('[Moscaline] Published', JSON.stringify(packet) + ' User: ' + username);
      }
    }.bind(this));

    server.on('subscribed', function (topic, client) {
      console.log('[Moscaline] Client ' + client.user.username + ' subscribed to: ' + topic);
    }.bind(this));

    server.on('ready', function () {
      server.authenticate = authenticate;
      server.authorizePublish = authorizePublish;
      server.authorizeSubscribe = authorizeSubscribe;
      console.log('[Moscaline] Mosca server is up and running, secure:', isSecure);
      resolve();
    }.bind(this));
  }.bind(this)).nodeify(cb);
}

Moscaline.prototype.publish = function publish (topic, message, qos, cb) {
  server.publish({topic: topic, payload: message, qos: qos, mqttorigin: 'out'}, cb);
}
