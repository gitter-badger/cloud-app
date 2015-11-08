var nodemailer = require('nodemailer');
var crypto = require('crypto');

exports.index = function(req, res) {
    res.render('youforgot', {title: 'Geofancy'});
}

exports.request = function(req, res) {
    console.log('Looking for: ' + req.body.username);
    req.gf.User.findOne({$or: [{username: req.body.username}, {email: req.body.username}]}, function (err, user) {
        if(!err) {
            if(user) {
                var password_token = crypto.createHash('sha1').update(user.username + Date.now).digest('hex');
                var new_password_request = new req.gf.PasswordRequest({
                    userId: user._id,
                    token: password_token
                });
                new_password_request.save(function(err) {
                    if (!err) {
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
                            subject: "Lost Geofancy Passwort",
                            text: "Howdy! Click the following Link to get your new Geofancy Password! " + req.root + "/newpassword/" + password_token
                        }
                        transport.sendMail(mailOptions, function(err, response) {
                          transport.close();
                        });
                        res.render('youforgot', {title: 'Geofancy', message:'Please check your Inbox for new credentials', color:'green'});
                    } else {
                        res.render('youforgot', {title: 'Geofancy', message:'There was an error sending the Mail', color:'red'});
                    }
                });
            } else {
                res.render('youforgot', {title: 'Geofancy', message:"We couldn't find that User", color:'red'});
            }
        } else {
            res.render('youforgot', {title: 'Geofancy', message:'Server error', color:'red'});
        }
    })
}
