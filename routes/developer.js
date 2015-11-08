var Client = require('../models/client');
var AccessToken = require('../models/access_token');
var AuthorizationCode = require('../models/authorization_code');

var utils = require('../lib/utils');
var dutil = require('../lib/date-util');

exports.createApp = function (req, res) {
    res.render('developer/app', {title: 'Geofancy'});
}

exports.editApp = function (req, res) {
    Client.findOne({_id: req.params.appId, userId: req.session.passport.user._id}, function (err, client) {
        if (!err) {
            if (client) {
                console.log('client: ' + JSON.stringify(client));
                res.render('developer/app', {title: 'Geofancy', app: client});
            }
        }
    });
}

exports.saveApp = function (req, res) {
    Client.findOne({_id: req.body.appid, userId: req.session.passport.user._id}, function (err, client) {
        if (!err) {
            if (!client) { // New Client
                var newApp = new Client({
                    userId: req.session.passport.user._id,
                    name: req.body.name,
                    redirectUri: (req.body.redirecturi.length === 0)?"urn:ietf:wg:oauth:2.0:oob":req.body.redirecturi,
                    clientId: utils.uid(32),
                    clientSecret: utils.uid(32)
                });

                newApp.save(function(err) {
                    closeColorbox(req, res);
                });
            } else { // Existing Client
                client.name = req.body.name;
                client.redirectUri = req.body.redirecturi;
                client.save(function(err) {
                    closeColorbox(req, res);
                });
            }
        }
    });
}

exports.index = index;

function closeColorbox (req, res) {
    res.render('developer/app', {title: 'Geofancy', save: true});
}

function index (req, res) {
    if (!req.session.passport.user) {
        return res.render('developer/developer', {title: 'Geofancy', clients: null});
    }
    if (typeof req.query.remove_app === 'string') {
        Client.findOne({_id: req.query.remove_app, userId: req.session.passport.user._id}, function (err, client) {
            if(!err) {
                if (client) {
                    client.remove(function (err) {
                        if (!err) {
                            AccessToken.find({clientId: client.clientId}).remove(function(err) {
                                AuthorizationCode.find({clientId: client.clientId}).remove(function(err) {
                                    listApps(req, res);
                                });
                            });
                        } else {
                            listApps(req, res);
                        }
                    });
                } else {
                    listApps(req, res);
                }
            } else {
                listApps(req, res);
            }
        });
    } else {
        listApps(req, res);
    }
}

function listApps(req, res) {
    var S = require('string');
    Client.find({userId: req.user._id}, function(err, clients) {
        var sanitizedClients = [];
        for (var i = clients.length - 1; i >= 0; i--) {
            var client = clients[i];
            client.name = S(client.name).truncate(25);
            client.redirectUri = S(client.redirectUri).truncate(25);
            var formatted_date = moment(client.created_at).format('DD.MM.YYYY HH:mm:ss');
            if (typeof req.session.timezone !== 'undefined' && req.session.timezone.length > 0) {
                formatted_date = dutil().to_moment(client.created_at, req.session.timezone).format('DD.MM.YYYY HH:mm:ss');
            }
            client.created_at_formatted = formatted_date;
            sanitizedClients.push(client);
        };
        res.render('developer/developer', {title: 'Geofancy', clients: sanitizedClients});
    });
}
