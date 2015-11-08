var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId; //not needed here, but may be needed in another model file

var PasswordRequestSchema = new Schema({
    userId: {type: ObjectId},
    username: {type: String, "default": ''},
    token: {type: String, "default": ''},
    created_at: {type: Date, "default": Date.now}
});

module.exports = mongoose.model('password_requests', PasswordRequestSchema);