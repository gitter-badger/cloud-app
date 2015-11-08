var firefly = require('./plugins/firefly');
var yelp = require('./plugins/yelp');

exports.getFireflyLocations = function (cb) {
    firefly.allLocations(function(err, locations){
        cb(locations);
    });
}

exports.searchYelpByLatLng = function (lon, lat, term, cb) {
    yelp.searchYelpByLatLng(lon, lat, term, cb);
}

exports.searchYelpByLocation = function (location, term, cb) {
    yelp.searchYelpByLocation(location, term, cb);
}