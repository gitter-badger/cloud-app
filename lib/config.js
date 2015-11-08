exports.getConfig = function(){
  var fs = require('fs');
  var config = {
    "hostname": "process.env.HOSTNAME",
    "servername": process.env.SERVERNAME,

    "mongodb_url": process.env.MONGOLAB_URI,
    "redis_url": process.env.REDISCLOUD_URL,

    "status_mail_recipient": "support@geofancy.com",

    "mail_from": "",
    "mail_server": "",
    "mail_user": "",
    "mail_password": "",

    "fb_app_id": "",
    "fb_app_secret": "",
    "fb_auth_callback": "https://my.geofancy.com/auth/facebook/callback",

    "tw_consumer_key": "",
    "tw_consumer_secret": "",
    "tw_auth_callback": "https://my.geofancy.com/auth/twitter/callback",

    "is_json": false
  };

  if(fs.existsSync('config.json')) {
    config = require('../config.json');
    config.is_json = true;
  }

  return config;
}
