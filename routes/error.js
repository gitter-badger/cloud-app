exports.error404 = function (req, res) {
    res.status(404);
    res.render('error/404', {title: 'Geofancy'});
}
