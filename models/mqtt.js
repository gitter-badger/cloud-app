var Promise = require('bluebird');
var mongoose = Promise.promisifyAll(require('mongoose'));
var Schema = mongoose.Schema;

var MqttSchema = new Schema({
    userId: {type: Schema.ObjectId},
    created_at: {type: Date, "default": Date.now},
    modified_at: {type: Date, "default": Date.now},
    topic: {type: String, default: null},
    message: {type: String, default: null},
    direction: {type: String, default: null},
    clientId: {type: String, default: 'Unknown'}
});

module.exports = mongoose.model('mqtts', MqttSchema);
