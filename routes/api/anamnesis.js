var Promise = require('bluebird');
var Anamnesis = Promise.promisifyAll(require('../../models/anamnesis'));

var add = function add (req, res) {
  var a = new Anamnesis({
    username: req.body.username,
    device: req.body.device,
    data: req.body.data
  });
  a.saveAsync()
  .then(function (result) {
    res.json({
      error: null
    });
  })
  .error(function (err) {
    res.json(500, {
      error: err
    });
  });
};

exports.add = add;