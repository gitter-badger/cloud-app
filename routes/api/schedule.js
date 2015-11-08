var scheduler = require('../../lib/fencelogScheduler');

exports.schedule = function (req, res) {
  var fromDate = new Date(parseInt(req.query.from));
  var toDate = new Date(parseInt(req.query.to));

  // console.log('from: ' + req.query.from + ' fromDate: ' + fromDate);
  // console.log('to: ' + req.query.to + ' toDate: ' + toDate);

  var query = {userId: req.session.passport.user._id, "created_at": {"$gte": fromDate, "$lt": toDate}};
  req.gf.Fencelog.find(query).sort('created_at').exec(function (err, fencelogs) {
    var success = 0;
    var schedules = [];
    if (err) {
      fencelogs == null;
    }
    if (typeof(fencelogs) === 'object') {
      success = 1;
      schedules = scheduler.getSchedules(fencelogs, 'calendar');
    }

    res.json({success: success, result: schedules});
  });
}
