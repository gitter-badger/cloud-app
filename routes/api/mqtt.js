var Promise = require('bluebird');
var Mqtt = require('../../models/mqtt');
var User = Promise.promisifyAll(require('../../models/user'));
var _ = require('underscore');

var getMessage = function (req, res) {
  var currentPage = req.query.page;
  var allCount = 0;
  if (typeof req.session.passport.user === 'undefined') {
    return res.send(401);
  }
  if (typeof req.query.topic !== 'string') {
    return res.send(400);
  }
  if (isNaN(currentPage) || currentPage < 1) {
    currentPage = 1;
  }
  Mqtt.countAsync({userId: req.session.passport.user._id, topic: req.query.topic})
  .then(function (count) {
    allCount = count;
    if (currentPage > Math.ceil(count/1)) {
      currentPage = Math.ceil(count/1);
    }
    return Mqtt.find({userId: req.session.passport.user._id, topic: req.query.topic}).sort('-created_at').skip((currentPage - 1) * 10).limit(10).execAsync();
  })
  .then(function (messages) {
    return res.json({count: allCount, messages: messages});
  })
  .error(function (err) {
    res.send(500);
  });
}

var getTopic = function (req, res) {
  getAllMessages(req.session.passport.user)
  .then(function (messages) {
    return groupTopics(messages);
  })
  .then(function (topics) {
    console.log('topics: ' + topics);
    allTopics = topics;
  })
  .then (function () {
    res.json({count: allTopics.length, topics: allTopics});
  })
  .error(function (err) {
    res.send(500);
  });
}

var groupTopics = function (messages) {
  return new Promise(function (resolve, reject) {
    var sanitizedTopic = [];
    topics = _.keys(_.groupBy(messages, 'topic'));
    // topics.forEach(function (topic) {
    //   sanitizedTopic.push(topic.substring(topic.indexOf("/")).slice(1));
    // });
    resolve(topics);
  });
}

var getAllMessages = function (user) {
  return new Promise (function (resolve, reject) {
    Mqtt.find({userId: user._id}).sort('-created_at').execAsync()
    .then(function (mqtts) {
      resolve(mqtts);
    })
    .error(function (err) {
      reject(error);
    })
    .catch(function (ex) {
      reject(ex);
    });
  });
}

var deleteTopic = function (req, res) {
  Mqtt.removeAsync({userId: req.session.passport.user._id, topic: req.query.topic})
  .then(function (result) {
    res.send(200);
  })
  .error(function (err) {
    res.send(500);
  })
  .catch(function (ex) {
    res.send(500);
  });
}

var postMessage = function (req, res) {
  if (typeof req.body.topic === 'undefined' || req.body.topic.length === 0 ||
      typeof req.body.payload !== 'string' || req.body.payload.length === 0) {
    return res.json({error: 'Bad Request'}, 400);
  }
  var username = req.body.topic.split('/')[0];
  if (req.session.passport.user.username !== username) {
    return res.json({error: 'Wrong Username'}, 400);
  }
  User.findOneAsync({username: username})
  .then(function (user) {
    if (!user) {
      return res.json({error: 'User not found'}, 404);
    }
    if (typeof req.body.qos !== 'number' || req.body.qos  < 0 || req.body.qos > 1) {
      return res.json({error: 'Invalid QoS'}, 400);
    }
    req.gf.moscaline.publish(req.body.topic, req.body.payload, req.body.qos, function () {
      res.json({
        error: null, mqtt: {
          topic: req.body.topic,
          message: req.body.payload,
          direction: 'out'
        }
      });
    });
  })
  .error(function (err) {
    res.json({error: err}, 500);
  })
  .catch(function (ex) {
    console.log('Exception raised: ' + ex);
    res.send(500);
  });
}

exports.getMessage = getMessage;
exports.deleteTopic = deleteTopic;
exports.postMessage = postMessage;
exports.getTopic = getTopic;
