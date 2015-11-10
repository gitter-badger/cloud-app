'use strict';

module.exports = function (app, tfa, passport, login) {
  var site = require('./router/site')(app, tfa, passport, login);
  var api = require('./router/api')(app, tfa, passport, login);
  var oauth = require('./router/oauth')(app, tfa, passport, login);
  var socketio = require('./router/socketio')(app, tfa, passport, login);

  // Keep this last so we catch all other cases
  app.all('/api/*', function(req, res) {
    res.send({error: 'Not Found'}, 404);
  });
};
