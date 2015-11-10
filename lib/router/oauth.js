'use strict';

var oauth2 = require('../oauth2');

module.exports = function (app, tfa, passport, login) {
  // public (oauth2) api
  app.get('/api/v1/user', passport.authenticate('bearer', { session: false }), require('../../routes/api/v1/user').index);
  app.get('/api/v1/fencelogs', passport.authenticate('bearer', {session: false}), require('../../routes/api/v1/fencelogs').index);
  app.get('/api/v1/schedules', passport.authenticate('bearer', {session: false}), require('../../routes/api/v1/schedules').index);
  app.post('/api/v1/subscription/zapier', passport.authenticate('bearer', {session: false}), require('../../routes/api/v1/subscription').subscribeZapier);
  app.delete('/api/v1/subscription/zapier', passport.authenticate('bearer', {session: false}), require('../../routes/api/v1/subscription').unsubscribeZapier);

  // oauth2 authentication / token routes
  app.get('/oauth2/authorize', oauth2.authorization);
  app.post('/oauth2/authorize/decision', oauth2.decision);
  app.post('/oauth2/token', oauth2.token);
};
