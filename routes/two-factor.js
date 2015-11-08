var Promise = require('bluebird');
var User = Promise.promisifyAll(require('../models/user'));
var speakeasy = require('speakeasy');

module.exports.index = function index (req, res) {
  res.render('two-factor', {title: 'Geofancy'});
}

module.exports.unlock = function unlock (req, res) {
  if (!req.session.passport.user) {
    return res.error(500);
  }
  if (req.session.passport.user.tfa.enabled === false) {
    return res.error(412);
  }
  if (typeof req.body.token === 'undefined') {
    return res.error(400);
  }

  User.findOneAsync({_id: req.session.passport.user._id})
  .then(function (user) {
    var tfaToken = speakeasy.time({
      key: user.tfa.secret,
      encoding: 'base32'
    });

    if (req.body.token !== tfaToken) {
      return res.json({
        error: new Error('Wrong 2FA Token')
      }, 401);
    }

    req.session.passport.tfa_done = true;

    return res.json({
      error: null
    }, 200);
  })
  .error(function (err) {
    res.json({
      error: err
    }, 500);
  });
}
