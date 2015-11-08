var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId; //not needed here, but may be needed in another model file
var crypto = require('crypto');

var UserSchema = new Schema({
    username: {type: String, "default": '', index: {unique: true}},
    password: {type: String, "default": ''},
    email: {type: String, "default": ''},
    locked: {type: Boolean, "default": false},
    facebookId: {type: String, "default": ''},
    twitterId: {type: String, "default": ''},
    created_at: {type: Date, "default": Date.now},
    loggedin_at: {type: Date},
    plugins: {type: Array, "default": []},
    permissions: {type: Array, "default": []},
    tfa: {type: Object, "default": {
        enabled: false,
        method: 'authenticator',
        secret: null
    }},
    mobileNo: {type: String, "default": null}
});

UserSchema.methods.validPassword = function(pwd, userPassword) {
    var hash = crypto.createHash('sha1').update(pwd).digest('hex');
    return (hash === userPassword);
};

module.exports = mongoose.model('users', UserSchema);