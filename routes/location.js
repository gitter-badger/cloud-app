var mongoose = require('mongoose');
var moment = require('moment');
var dutil = require('../lib/date-util.js');

exports.index = function(req, res) {
    console.log('looking up locationId: ' + req.params.locationId);
    var id = mongoose.Types.ObjectId(req.params.locationId);
    req.gf.Fencelog.findOne({$and: [{_id: id}, {userId: req.session.passport.user._id}]}, function (err, fencelog) {
        if (!err) {
            if(fencelog) {
                fencelog.created_at_date = moment(fencelog.created_at).format('DD.MM.YYYY');
                fencelog.created_at_time = moment(fencelog.created_at).format('HH:mm:ss');
                if (typeof req.session.timezone !== 'undefined' && req.session.timezone.length > 0) {
                    fencelog.created_at_date = dutil().to_moment(fencelog.created_at, req.session.timezone).format('DD.MM.YYYY');
                    fencelog.created_at_time = dutil().to_moment(fencelog.created_at, req.session.timezone).format('HH:mm:ss');
                }
                console.log('Showing Fencelog: ' + fencelog._id);
                res.render('location', {title: 'Geofancy', fencelog: fencelog});
            } else {
                console.log('NOT showing Fencelog.');
                res.render('location', {title: 'Geofancy'});
            }
        } else {
            console.log('Error when retrieving Fencelog');
            res.render('location', {title: 'Geofancy'});
        }
    });
};
