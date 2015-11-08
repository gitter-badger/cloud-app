var Promise = require('bluebird');
var speakeasy = require('speakeasy');
var User = Promise.promisifyAll(require('../../models/user'));
var qrcode = require('qrcode-js');

var index = function (req, res) {
  var tfa = speakeasy.generate_key({length: 20, google_auth_qr: true, name: 'Geofancy'});
  var base64qr = qrcode.toDataURL('otpauth://totp/Geofancy?secret=' + tfa.base32, 4);
  res.render('account/tfa', {title: 'Geofancy', tfa: {uri: base64qr, secret: tfa.base32}});
}

var activate = function (req, res) {
  if (!req.session.passport.user) {
    return res.json({error: 'unauthorized'}, 401);
  }

  var tfaToken = speakeasy.time({
    key: req.body.secret,
    encoding: 'base32'
  });

  if (tfaToken !== req.body.token) {
    return res.json({
      error: new Error('Invalid 2FA Token')
    }, 401);
  };

  User.findOneAsync({_id: req.session.passport.user._id})
  .then(function (user) {
    user.tfa = {
      enabled: true,
      secret: req.body.secret
    };
    return user.saveAsync();
  })
  .then(function (err) {
    res.json({
      error: null
    }, 200);
  })
  .error(function (err) {
    res.json({
      error: new Error('Something went wrong')
    }, 500);
  });
}

var disable = function (req, res) {
  User.findOneAsync({_id: req.session.passport.user._id})
  .then(function (user) {
    user.tfa = {
      enabled: false,
      secret: null
    };
    return user.saveAsync();
  })
  .then(function (err) {
    res.json({
      error: null
    }, 200);
  })
  .error(function (err) {
    res.json({
      error: new Error('Something went wrong')
    }, 500);
  });
}

exports.index = index;
exports.activate = activate;
exports.disable = disable;