var index = function (req, res) {
  res.render('account/mqtt', {title: 'Geofancy'});
}

exports.index = index;
