exports.index = function (req, res) {
    req.gf.Fencelog.find({userId: req.user._id}, {__v: 0}, function(err, fencelogs) {
        res.json(fencelogs);
    })
}