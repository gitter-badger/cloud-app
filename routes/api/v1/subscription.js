exports.subscribeZapier = function (req, res) {
    var subscriptionsToRemove = [];
    req.gf.async.series([
        function (cb) {
            req.gf.Subscription.find({userId: req.user._id, service: 'zapier'}, function (err, subscriptions) {
                if (!err) {
                    for (var i = subscriptions.length - 1; i >= 0; i--) {
                        subscriptionsToRemove.push({_id: subscriptions[i]._id});
                    };
                }
                cb();
            });
        },
        function (cb) {
            req.gf.Subscription.remove({$or: subscriptionsToRemove}, function (err) {
                cb();
            });
        },
        function (cb) {
            var newSubscription = new req.gf.Subscription({
                userId: req.user._id,
                service: 'zapier',
                uri: req.body.target_url,
                event: (typeof req.body.event === 'string') ? req.body.event : ''
            });
            newSubscription.save(function (err) {
                cb();
            });
        },
        function (cb) {
            res.json({success: 'ok'});
        }
    ])
}

exports.unsubscribeZapier = function (req, res) {
    req.gf.Subscription.remove({userId: req.user._id, service: 'zapier'}, function (err) {
        res.json({success: 'ok'});
    })
}