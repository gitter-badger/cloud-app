var generatePassword = require('password-generator');
var crypto = require('crypto');
var nodemailer = require('nodemailer');

exports.index = function (req, res) {
    var token = req.params.token;
    req.gf.PasswordRequest.findOneAndRemove({token: token}, function(err, password_request) {
        if (!err) {
            if (password_request) {
                var new_password = generatePassword();
                req.gf.User.findOne({_id: password_request.userId}, function(err, user) {
                    if (!err) {
                        if (user) {
                            user.password = crypto.createHash('sha1').update(new_password).digest('hex');
                            user.save(function(err) {
                                var transport = nodemailer.createTransport("SMTP", {
                                    host: req.gf.config.mail_server,
                                    auth: {
                                        user: req.gf.config.mail_user,
                                        pass: req.gf.config.mail_password
                                    }
                                });
                                var mailOptions = {
                                    from: req.gf.config.mail_from,
                                    to: user.email,
                                    subject: "New Geofancy Passwort",
                                    text: "Howdy! Here goes your new Geofancy Password, keep it safe: " + new_password
                                }
                                transport.sendMail(mailOptions, function(err, response) {
                                  transport.close();
                                });
                                res.render('newpassword', {title: 'Geofancy', message: 'Check you inbox for your new Password', color: 'green'});
                            });
                        } else {
                            res.render('newpassword', {title: 'Geofancy', message: 'An error occured', color: 'red'});
                        }
                    } else {
                        res.render('newpassword', {title: 'Geofancy', message: 'An error occured', color: 'red'});
                    }
                });
            } else {
                res.render('newpassword', {title: 'Geofancy', message: 'An error occured', color: 'red'});
            }
        } else {
            res.render('newpassword', {title: 'Geofancy', message: 'An error occured', color: 'red'});
        }
    });
}
