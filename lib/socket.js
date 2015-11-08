'use strict';

var Promise = require('bluebird');
var socketio = require('socket.io')
var crypto = require('crypto');
var User = Promise.promisifyAll(require('../models/user'));
var Session = Promise.promisifyAll(require('../models/session'));

module.exports.listen = function(app, socketClients){
  var io = socketio.listen(app)
  var origin = 'Socket.io';
  var sessId;

  io.sockets.on('connection', function(socket){
    socket.on('session', function (credentials) {
      if (typeof credentials.username === 'string' && typeof credentials.password === 'string') {
        User.findOneAsync({$and: [{username: credentials.username}, {password: crypto.createHash('sha1').update(credentials.password).digest('hex')}]})
        .then(function (user) {
          console.log('[Socket.io] Authentication from ' + socket.handshake.address + ':', user ? 'Succeeded' : 'Failed');
          if (!user) {
            console.log('[Socket.io] Invalid credentials');
            return socket.emit('session', {error: 'invalid credentials'});
          }
          return Session.removeAsync({$and: [{userId: user._id}, {origin: origin}]});
        })
        .then(function (numberRemoved) {
          var msec = new Date().getTime().toString();
          sessid = crypto.createHash('sha1').update(user.username + '%' + msec).digest('hex');
          var new_session = new Session({
            userId: user._id,
            sessionId: sessid,
            origin: origin
          });
          return new_session.saveAsync();
        })
        .then(function () {
          if (err) {
            return socket.emit('session', {error: 'failed when generating session_id'});
          }
          socketClients[credentials.username] = socket;
          socket.emit('session', {session_id: sessid});
        })
        .error(function (err) {
          if (err) {
            console.log('[Socket.io] Error');
            return socket.emit('session', {error: 'server error'});
          }
        });
      }
    });
  })

  return io
}
