'use strict';

const { logEvent } = require('./eventLogger');

const IS_PROD = process.env.NODE_ENV === 'production';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    const status  = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Always log internally
    logEvent(
        `ERROR ${status} | ${err.name}: ${message} | path=${req.originalUrl} | rid=${req.requestId || '-'}`,
        'errors.log',
    );

    if (status >= 500) {
        console.error('[ERROR]', err);
    }

    // NEVER expose stack traces or internal details in production
    const body = IS_PROD && status >= 500
        ? { error: 'Internal Server Error' }
        : { error: message };

    // Attach request ID for client-side tracing
    if (req.requestId) body.requestId = req.requestId;

    res.status(status).json(body);
};

module.exports = errorHandler;
