var scheduler = require('../../../lib/fencelogScheduler');

exports.index = function (req, res) {
  var fromDate = new Date(parseInt(req.query.from) * 1000); // * 1000 converts unix timestamp (sec) to msec
  var toDate = new Date(parseInt(req.query.to) * 1000);

  var query = {userId: req.session.passport.user._id, "created_at": {"$gte": fromDate, "$lt": toDate}};
  req.gf.Fencelog.find(query).sort('created_at').exec(function (err, fencelogs) {
    var success = 0;
    var schedules = [];
    if (err) {
      return res.send(500);
    }
    if (typeof(fencelogs) === 'object') {
      if (fencelogs.length === 0) {
        return res.send(404);
      }
      success = 1;
      schedules = scheduler.getSchedules(fencelogs, 'api');
      return res.json(schedules);
    }

    return res.send(500);
  });
}
