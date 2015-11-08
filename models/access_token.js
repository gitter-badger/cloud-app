var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId; //not needed here, but may be needed in another model file

var AccessTokenSchema = new Schema({
    userId: {type: ObjectId},
    clientId: {type: String, "default": ''},
    token: {type: String, "default": ''},
    created_at: {type: Date, "default": Date.now}
});

module.exports = mongoose.model('access_tokens', AccessTokenSchema);