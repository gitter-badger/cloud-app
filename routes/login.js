exports.index = function (req, res) {
    res.render('login', {title: 'Geofancy', message: req.flash('error')});
};
