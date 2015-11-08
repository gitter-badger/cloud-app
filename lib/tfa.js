module.exports.ensure = function ensure (req, res, next) {
  if (!req.session.passport.user) {
    return next();
  }
  if (req.session.passport.user.tfa.enabled === false) {
    return next();
  }
  if (typeof req.session.passport.tfa_done === 'undefined') {
    req.session.passport.tfa_done = false;
  }
  if (typeof req.session.passport.tfa_session_id === 'undefined') {
    req.session.passport.tfa_session_id = req.sessionID;
  }
  if (req.session.passport.tfa_done === false || req.session.passport.tfa_session_id !== req.sessionID) {
    return res.redirect('/two-factor');
  };
  next();
};