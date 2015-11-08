var request = require('request');

exports.allLocations = function (cb) {
    request({uri: "http://app.getfirefly.net/api/v1/locations", headers:{'X-FF-Apikey': "d0wnl0ad5"}}, function (err, response, body) {
        var responseObj = {};
        try {
            responseObj = JSON.parse(body);
        } catch (e) {
            console.log('Exception: ' + e);
        }
        if(responseObj.locations) {
            cb(null, responseObj.locations);
        } else {
            cb(new Error('Invalid response JSON'), new Array());
        }
    })
}