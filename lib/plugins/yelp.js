var yelp = require("yelp").createClient({
  consumer_key: "LoJT6D4Xam7qDv2FHu4AOw", 
  consumer_secret: "ib0y0_q2wuHy_TMmu6oZI5L4OxM",
  token: "K80wUzN9xkMl6pPG_UtcrdAXqTAvIav1",
  token_secret: "sil2fElg0XfGiRg7Ta5HB6qgVTw"
});

exports.searchYelpByLatLng = function (lon, lat, term, cb) {
    yelp.search({term: term, ll: lat+","+lon+",,,"}, function(error, data) {
      cb(data);
    });
}

exports.searchYelpByLocation = function (location, term, cb) {
    yelp.search({term: term, location: location}, function(error, data) {
      cb(data);
    });
}