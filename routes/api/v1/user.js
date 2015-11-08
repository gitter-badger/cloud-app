exports.index = function (req, res) {
    req.gf.Fencelog.count({userId: req.user._id}, function(err, count) {
        res.json({_id: req.user._id, created_at: req.user.created_at, email: req.user.email, username: req.user.username, fencelog_count: count});
    });
}