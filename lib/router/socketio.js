'use strict';

module.exports = function (app, tfa, passport, login) {
  // socket.io for testing purpose only!!!
  app.get('/api/socket.io/fencelogs', login.ensureLoggedIn('/login'), require('../../routes/api/socket.io/fencelogs').index);
};
