var json2csv = require('json2csv');
var nodemailer = require('nodemailer');
var config = require('../../../lib/config.js').getConfig();

var fencelogs = function (req, res) {
  res.render('account/export/fencelogs');
}

var dispatchFencelogMail = function (req, fencelogs, type, filename) {
    var transport = nodemailer.createTransport("SMTP", {
        host: config.mail_server,
        auth: {
            user: config.mail_user,
            pass: config.mail_password
        }
    });
    var mailOptions = {
        from: config.mail_from,
        to: req.session.passport.user.email,
        subject: "Geofancy - Exported Fencelogs as " + type,
        text: "Hey there " + req.session.passport.user.username + "!\nAttached you'll find your Fencelogs as " + type + "!\n\nCheers,\nyour Geofancy!",
        attachments: [
          {
            fileName: filename,
            contents: fencelogs
          }
        ]
    }
    transport.sendMail(mailOptions, function(err, response) {
      transport.close();
    });

}

var getAllFencelogs = function (req, cb) {
  req.gf.Fencelog.find({userId: req.session.passport.user._id}, {userId: 0}).sort('-created_at').exec(function(err, fencelogs) {
    var fencelogsResult = new Array();
    if (!err) {
      if (fencelogs) {
        for (var i = 0; i < fencelogs.length; i++) {
          var dbFencelog = fencelogs[i];
          var fencelog = {
            id: dbFencelog._id,
            longitude: dbFencelog.location[0],
            latitude: dbFencelog.location[1],
            created_at: dbFencelog.created_at,
            fenceType: dbFencelog.fenceType,
            eventType: dbFencelog.eventType,
            httpResponse: dbFencelog.httpResponse.trunc(50),
            httpMethod: dbFencelog.httpMethod,
            httpUrl: dbFencelog.httpUrl,
            locationId: dbFencelog.locationId
          }
          fencelogsResult.push(fencelog);
        }
      }
      cb(fencelogsResult);
    } else {
      cb();
    }
  });
}

var downloadAllFencelogsAsJson = function (req, res) {
  getAllFencelogs(req, function(fencelogsResult) {
    if (typeof(fencelogsResult) === 'object') {
      res.send(200);
      console.log('json:'+JSON.stringify(fencelogsResult));
      dispatchFencelogMail(req, JSON.stringify(fencelogsResult), "JSON", "fencelogs.json");
    } else {
      res.send(500);
    }
  });
}

var downloadAllFencelogsAsCsv = function (req, res) {
  getAllFencelogs(req, function(fencelogsResult) {
    if (typeof(fencelogsResult) === 'object') {
      json2csv({data: fencelogsResult, fields: ['id', 'longitude', 'latitude', 'created_at', 'fenceType', 'eventType', 'httpResponse', 'httpMethod', 'httpUrl', 'locationId']}, function(err, csv) {
        if (err) {
          res.send(500);
        } else {
          res.send(200);
          dispatchFencelogMail(req, csv, "CSV", "fencelogs.csv");
        }
      });
    } else {
      res.send(500);
    }
  });
}

module.exports = {
  fencelogs: fencelogs,
  downloadAllFencelogsAsCsv: downloadAllFencelogsAsCsv,
  downloadAllFencelogsAsJson: downloadAllFencelogsAsJson
}
