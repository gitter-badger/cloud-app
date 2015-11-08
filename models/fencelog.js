var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId; //not needed here, but may be needed in another model file
var moment = require('moment');

var FencelogSchema = new Schema({
    userId: {type: ObjectId},
    location: {type: [Number], index: '2dsphere'},
    locationId: {type: String, "default": ''},
    httpUrl: {type: String, "default":''},
    httpMethod: {type: String, "default":''},
    httpResponseCode : {type: Number},
    httpResponse: {type: String, "default":''},
    eventType: {type: String, "default":''},
    fenceType: {type: String, "default": 'geofence'},
    created_at: {type: Date, "default": Date.now},
    origin: {type: String, "default": "iOS App"}
});

// FencelogSchema.methods.created_at_date = function () {
//     return moment(this.created_at).format('DD.MM.YYYY')
// }

// FencelogSchema.methods.created_at_time = function () {
//     return moment(this.created_at).format('HH:mm:ss')
// }

module.exports = mongoose.model('fencelogs', FencelogSchema);
