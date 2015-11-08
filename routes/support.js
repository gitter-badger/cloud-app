exports.index = function (req, res) {
  res.render('support', {title: 'Geofancy'});
}

exports.sendRequest = function (req, res) {
  var nodemailer = require('nodemailer');
  var transport = nodemailer.createTransport("SMTP", {
    host: req.gf.config.mail_server,
    auth: {
      user: req.gf.config.mail_user,
      pass: req.gf.config.mail_password
    }
  });
  var mailOptions = {
    from: req.body.email,
    to: req.gf.config.mail_from,
    subject: "Geofancy Support",
    text: "User: " + req.body.username + "\n" + "E-Mail: " + req.body.email + "\nMessage:\n\n" + req.body.message
  }
  transport.sendMail(mailOptions, function (err, response) {
    transport.close();
  });
  res.render('support', {title: 'Geofancy', result: 'success'});
}
