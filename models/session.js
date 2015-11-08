var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId; //not needed here, but may be needed in another model file
var moment = require('moment');
var crypto = require('crypto');

var SessionSchema = new Schema({
    userId: {type: ObjectId},
    sessionId: {type: String, "default": ''},
    origin: {type: String, "default": 'Unknown'},
    created_at: {type: Date, "default": Date.now},
    modified_at: {type: Date, default: Date.now}
});

module.exports = mongoose.model('sessions', SessionSchema);
