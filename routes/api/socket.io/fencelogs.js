exports.index = function (req, res) {
  var result = {};
  var socket = null;
  req.gf.async.series([
    function (cb) {
      socket = req.gf.socketClients[req.session.passport.user.username];
      return cb();
    },
    function (cb) {
      if (typeof socket === 'object') {
        req.gf.Fencelog.find({userId: req.session.passport.user._id}, function (err, fencelogs) {
          if (!err) {
            if (fencelogs) {
              socket.emit('fencelog', {event: 'list', fencelogs: fencelogs});
              result.success = 'fencelogs sent to socket.io client';
              return cb();
            }
          }
          result.error = 'error when sending fencelogs to socket.io. no fencelogs present?';
          return cb();
        });
      } else {
        result.error = 'error when sending fencelogs to socket.io. seems like no client is authenticated with the socket.io api';
          return cb();
      }
    },
    function (cb) {
      res.send(result);
      return cb();
    }
  ]);
}
