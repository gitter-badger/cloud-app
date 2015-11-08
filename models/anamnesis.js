var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId; //not needed here, but may be needed in another model file
var moment = require('moment');

var AnamnesisSchema = new Schema({
    created_at: {type: Date, "default": Date.now},
    username: {type: String},
    device: {type: Object},
    data: {type: Object}
});

module.exports = mongoose.model('anamnesis', AnamnesisSchema);