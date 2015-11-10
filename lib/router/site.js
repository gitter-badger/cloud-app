'use strict';

// Timezone
var sessionifyTimezone = function (req, res, next){
  if (typeof req === 'undefined' || typeof req.session === 'undefined') {
    next();
    return;
  }
  req.session.timezone = req.body.timezone;
  next();
}

module.exports = function (app, tfa, passport, login) {
  app.get('/', tfa.ensure, require('../../routes').index);
  app.get('/auth/facebook', passport.authenticate('facebook', {scope: 'email'}));
  app.get('/auth/facebook/callback', passport.authenticate('facebook', {successRedirect: '/', failureRedirect: '/login'}));
  app.get('/auth/twitter', passport.authenticate('twitter'));
  app.get('/auth/twitter/callback', passport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/login' }));
  app.get('/location/:locationId', login.ensureLoggedIn('/login'), require('../../routes/location').index);
  app.get('/account', login.ensureLoggedIn('/login'), tfa.ensure, require('../../routes/account').index);
  app.get('/account/delete', login.ensureLoggedIn('/login'), require('../../routes/account').deleteAccount);
  app.get('/account/session/remove/:sessionId', login.ensureLoggedIn('/login'), require('../../routes/account').sessionRemove);
  app.get('/account/fencelog/remove/:fencelogId', login.ensureLoggedIn('/login'), require('../../routes/account').fencelogRemove);
  app.get('/account/app/unlink/:appId', login.ensureLoggedIn('/login'), require('../../routes/account').unlinkApp);
  app.get('/account/plugin/:pluginName/:pluginState', login.ensureLoggedIn('/login'), require('../../routes/account').setPluginState);
  app.get('/account/export/fencelogs', login.ensureLoggedIn('/login'), require('../../routes/account/export/fencelogs').fencelogs);
  app.get('/account/export/fencelogs.csv', login.ensureLoggedIn('/login'), require('../../routes/account/export/fencelogs').downloadAllFencelogsAsCsv);
  app.get('/account/export/fencelogs.json', login.ensureLoggedIn('/login'), require('../../routes/account/export/fencelogs').downloadAllFencelogsAsJson);
  app.get('/account/schedule', login.ensureLoggedIn('/login'), tfa.ensure, require('../../routes/account/schedule').index);
  app.post('/account/geofence/add', login.ensureLoggedIn('/login'), require('../../routes/account/geofence').add);
  app.get('/account/geofence/:id', login.ensureLoggedIn('/login'), require('../../routes/account/geofence').get);
  app.put('/account/geofence/:id', login.ensureLoggedIn('/login'), require('../../routes/account/geofence').update);
  app.get('/account/geofence', login.ensureLoggedIn('/login'), require('../../routes/account/geofence').all);
  app.delete('/account/geofence/:geofenceId/remove', login.ensureLoggedIn('/login'), require('../../routes/account/geofence').remove);
  app.get('/account/mqtt', login.ensureLoggedIn('/login'), tfa.ensure, require('../../routes/account/mqtt').index);
  app.get('/account/tfa', login.ensureLoggedIn('/login'), require('../../routes/account/tfa').index);
  app.post('/account/tfa', login.ensureLoggedIn('/login'), require('../../routes/account/tfa').activate);
  app.delete('/account/tfa', login.ensureLoggedIn('/login'), require('../../routes/account/tfa').disable);
  app.get('/two-factor', login.ensureLoggedIn('/login'), require('../../routes/two-factor').index);
  app.post('/two-factor', login.ensureLoggedIn('/login'), require('../../routes/two-factor').unlock);
  app.get('/developer', tfa.ensure, require('../../routes/developer').index);
  app.get('/developer/app/create', login.ensureLoggedIn('/login'), require('../../routes/developer').createApp);
  app.get('/developer/app/:appId', login.ensureLoggedIn('/login'), require('../../routes/developer').editApp);
  app.get('/support', require('../../routes/support').index);
  app.get('/legal', require('../../routes/legal').index);
  app.get('/youforgot', login.ensureNotLoggedIn('/account'), require('../../routes/youforgot').index);
  app.get('/newpassword/:token', login.ensureNotLoggedIn('/account'), require('../../routes/newpassword').index);
  app.get('/signup', login.ensureNotLoggedIn('/account'), require('../../routes/signup').index);
  app.get('/login', login.ensureNotLoggedIn('/account'), require('../../routes/login').index);
  app.get('/logout', function(req, res){ req.session.passport.tfa_done = false; req.logout(); res.redirect('/'); });
  app.post('/login', sessionifyTimezone, passport.authenticate('local', {successReturnToOrRedirect: '/', failureRedirect: '/login', failureFlash: true}));
  app.post('/signup', require('../../routes/signup').create);
  app.post('/youforgot', require('../../routes/youforgot').request);
  app.post('/account', login.ensureLoggedIn('/login'), require('../../routes/account').postIndex);
  app.post('/account/delete', login.ensureLoggedIn('/login'), require('../../routes/account').postDeleteAccount);
  app.post('/developer', login.ensureLoggedIn('/login'), require('../../routes/developer').saveApp);
  app.post('/support', require('../../routes/support').sendRequest);

  // plugins
  app.get('/plugin/firefly/:pluginItemId', login.ensureLoggedIn('/login'), require('../../routes/plugin/firefly').show);
  app.get('/plugin/yelp/:lon/:lat/:category', login.ensureLoggedIn('/login'), require('../../routes/plugin/yelp').showByLatLng);
  app.get('/plugin/yelp/:location/:category', login.ensureLoggedIn('/login'), require('../../routes/plugin/yelp').showByLocation);
};
