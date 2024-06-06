const { RateLimiterMemory } = require('rate-limiter-flexible');

// Request Amount Limiting
const rateLimiter = new RateLimiterMemory({
    points: 100, // 100 requests
    duration: 15 * 60, // Per 15 minutes
});

const rateLimitMethod = function rateLimitMiddleware(req, res, next) {
    const key = req.user ? req.user.id : req.ip;
    rateLimiter.consume(key)
        .then(() => {
            next();
        })
        .catch(() => {
            res.status(429).send('Too Many Requests');
        });
};

module.export = rateLimitMethod;
