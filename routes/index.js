var ffLocations = new Array();
var yelpLocations = false;
var welcome = null;

exports.index = function(req, res){
    welcome = (typeof req.query.welcome === 'string');
    if (!req.session.passport.user) {
        return res.render('index_logged_out', {title: 'Geofancy', welcome: welcome});
    }
    req.gf.User.findOne({_id: req.session.passport.user._id}, function(err, user) {
        if (err) {
            loadFencelogs(req, res);
            return;
        }
        if (!user) {
            loadFencelogs(req, res);
            return;
        }
        if (user.plugins.indexOf('yelp') >= 0) {
            yelpLocations = true;
        } else {
            yelpLocations = false;
        }
        if (user.plugins.indexOf('firefly') >= 0) {
            getFireflyLocations(req, function(locations) {
                ffLocations = new Array();
                for (var i = 0; i < locations.length; i++) {
                    ffLocations.push('['+locations[i].location.lat+', '+locations[i].location.lng+', '+100+i+']');
                }
                loadFencelogs(req, res);
            });
            return;
        }
        ffLocations = new Array();
        loadFencelogs(req, res);
        return;
    });
};

function loadFencelogs (req, res) {
    req.gf.Fencelog.find({userId: req.session.passport.user._id}, {_id: 1, location: 1}).sort('-created_at').limit(25).exec(function(err, fencelogs) {
        var markerCoords = new Array();
        for (var i = 0; i < fencelogs.length; i++) {
            markerCoords.push('['+fencelogs[i].location[0]+', '+fencelogs[i].location[1]+', \''+fencelogs[i]._id+'\']');
        }
        res.render('index', {title: 'Geofancy' , fencelogs: markerCoords, ffLocations: ffLocations, yelpLocations: yelpLocations, welcome: welcome});
    });
}

function getFireflyLocations(req, cb) {
    req.gf.User.findOne({_id: req.session.passport.user._id}, function(err, user) {
        if(!err) {
            if (user) {
                require('../lib/plugins').getFireflyLocations(function(locations) {
                    console.log('first loc:' + locations[0]);
                    cb(locations);
                });
            } else {
                cb();
            }
        } else {
            cb();
        }
    });
}

// function getYelpLocations(req, cb) {
//     req.gf.User.findOne({_id: req.session.passport.user._id}, function(err, user) {
//         if (!err) {
//             if (user) {
//                 require('../lib/plugins').searchYelp(lon, lat, term, function(locations) {
//                     cb(locations);
//                 });
//             }
//         }
//     });
// }
