exports.showByLatLng = function(req, res) {
    require('../../lib/plugins').searchYelpByLatLng(req.params.lon, req.params.lat, req.params.category, function(locations) {
        res.send(locations);
    });
}

exports.showByLocation = function (req, res) {
    require('../../lib/plugins').searchYelpByLocation(req.params.location, req.params.category, function(locations) {
        res.send(locations);
    });
}