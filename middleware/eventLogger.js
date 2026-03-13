'use strict';

const fs          = require('fs');
const fsPromises  = require('fs').promises;
const path        = require('path');
const { v4: uuidv4 } = require('uuid');

const LOG_DIR = path.join(__dirname, '..', 'logs');

// Ensure log directory exists synchronously on startup
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Append a line to a named log file inside /logs.
 * Non-blocking — errors are printed to stderr but never thrown.
 */
const logEvent = async (message, fileName) => {
    const filePath = path.join(LOG_DIR, fileName);
    const line     = `[${new Date().toISOString()}] ${message}\n`;
    try {
        await fsPromises.appendFile(filePath, line, 'utf8');
    } catch (err) {
        console.error('[Logger] Failed to write log:', err.message);
    }
};

/**
 * Express request-logging middleware.
 * Also stamps a unique X-Request-Id onto every request for tracing.
 */
const requestLogger = (req, res, next) => {
    const requestId = uuidv4();
    req.requestId   = requestId;
    res.setHeader('X-Request-Id', requestId);

    const { method, originalUrl, ip } = req;
    const origin    = req.headers.origin || '-';
    const userAgent = req.headers['user-agent'] || '-';

    logEvent(
        `${method} ${originalUrl} | ip=${ip} | origin=${origin} | ua="${userAgent}" | rid=${requestId}`,
        'requests.log',
    );

    // Log response status once finished
    res.on('finish', () => {
        logEvent(
            `RESPONSE ${res.statusCode} | ${method} ${originalUrl} | rid=${requestId}`,
            'requests.log',
        );
    });

    next();
};

/**
 * Write a security/audit event to audit.log.
 */
const auditLog = (action, details = {}) => {
    const message = `${action} | ${JSON.stringify(details)}`;
    logEvent(message, 'audit.log');
};

module.exports = { logEvent, requestLogger, auditLog };
