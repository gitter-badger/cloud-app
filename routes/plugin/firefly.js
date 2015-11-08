exports.show = function(req, res) {
    require('../../lib/plugins').getFireflyLocations(function(locations) {
        console.log('fetching item: ' + req.params.pluginItemId);
        var location = locations[parseInt(req.params.pluginItemId)-1000];
        res.render('plugin/firefly/location', {title: 'Geofancy', location: location});
    });
}