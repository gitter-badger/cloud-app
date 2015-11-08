var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId; //not needed here, but may be needed in another model file

var SubscriptionSchema = new Schema({
    userId: {type: ObjectId},
    service: {type: String, "default": ''},
    uri: {type: String, "default": ''},
    event: {type: String, "default": ''}

});

module.exports = mongoose.model('subscriptions', SubscriptionSchema);