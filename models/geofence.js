var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId; //not needed here, but may be needed in another model file

var GeofenceSchema = new Schema({
    userId: {type: ObjectId},
    created_at: {type: Date, "default": Date.now},
    modified_at: {type: Date, "default": Date.now},
    locationId: {type: String},
    location: {type: Object, default: {lon: 0.0, lat: 0.0, radius: 0}},
    triggerOnArrival: {type: Object, default: {enabled: false, method: 0, url: ''}},
    triggerOnLeave: {type: Object, default: {enabled: false, method: 0, url: ''}},
    basicAuth: {type: Object, default: {enabled: false, username: '', password: ''}},
    deleted: {type: Boolean, default: false},
    origin: {type: String, default: 'Unknown App'},
    uuid: {type: String, default: null}
});

module.exports = mongoose.model('geofences', GeofenceSchema);
