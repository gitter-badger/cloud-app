var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId; //not needed here, but may be needed in another model file

var ClientSchema = new Schema({
    userId: {type: ObjectId},
    name: {type: String, "default": ''},
    clientId: {type: String, "default": ''},
    clientSecret: {type: String, "default": ''},
    redirectUri: {type: String, "default": 'urn:ietf:wg:oauth:2.0:oob'},
    created_at: {type: Date, "default": Date.now}
});

module.exports = mongoose.model('clients', ClientSchema);