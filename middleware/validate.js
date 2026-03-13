'use strict';

// ── Simple, dependency-free input validation ─────────────────────────────────

const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
// Password must: ≥8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char

/**
 * Returns an array of error strings. Empty array = valid.
 */
function validateLoginBody({ email, password } = {}) {
    const errors = [];
    if (!email || typeof email !== 'string')         errors.push('email is required');
    else if (!EMAIL_RE.test(email.trim()))           errors.push('email is not valid');
    if (!password || typeof password !== 'string')   errors.push('password is required');
    return errors;
}

function validateCreateUserBody(body = {}) {
    const { firstName, lastName, emailAddress, password, contactNumber, country } = body;
    const errors = [];

    if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 1)
        errors.push('firstName is required');
    if (!lastName || typeof lastName !== 'string' || lastName.trim().length < 1)
        errors.push('lastName is required');
    if (!emailAddress || !EMAIL_RE.test(String(emailAddress).trim()))
        errors.push('emailAddress must be a valid email');
    if (!password || !PASSWORD_RE.test(password))
        errors.push('password must be ≥8 chars and include uppercase, lowercase, digit, and special character');
    if (!contactNumber || typeof contactNumber !== 'string' || !/^\+?[\d\s\-()]{7,20}$/.test(contactNumber))
        errors.push('contactNumber must be a valid phone number');
    if (!country || typeof country !== 'string' || country.trim().length < 2)
        errors.push('country is required');

    return errors;
}

function validateUpdateUserBody(body = {}) {
    const { firstName, lastName, emailAddress, contactNumber, country, password } = body;
    const errors = [];

    if (firstName !== undefined && (typeof firstName !== 'string' || firstName.trim().length < 1))
        errors.push('firstName must be a non-empty string');
    if (lastName !== undefined && (typeof lastName !== 'string' || lastName.trim().length < 1))
        errors.push('lastName must be a non-empty string');
    if (emailAddress !== undefined && !EMAIL_RE.test(String(emailAddress).trim()))
        errors.push('emailAddress must be a valid email');
    if (password !== undefined && !PASSWORD_RE.test(password))
        errors.push('password must be ≥8 chars and include uppercase, lowercase, digit, and special character');
    if (contactNumber !== undefined && !/^\+?[\d\s\-()]{7,20}$/.test(contactNumber))
        errors.push('contactNumber must be a valid phone number');
    if (country !== undefined && (typeof country !== 'string' || country.trim().length < 2))
        errors.push('country must be a valid string');

    return errors;
}

function validateIdParam({ id } = {}) {
    const errors = [];
    const parsed = parseInt(id, 10);
    if (!id || isNaN(parsed) || parsed < 1) errors.push('id must be a positive integer');
    return errors;
}

// ── Middleware factories ──────────────────────────────────────────────────────

/** Generic middleware that runs a validator function against req.body */
const validateBody = (validatorFn) => (req, res, next) => {
    const errors = validatorFn(req.body);
    if (errors.length) {
        return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    next();
};

/** Generic middleware that runs a validator function against req.params */
const validateParams = (validatorFn) => (req, res, next) => {
    const errors = validatorFn(req.params);
    if (errors.length) {
        return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    next();
};

// ── Sanitizers ────────────────────────────────────────────────────────────────

/** Strip leading/trailing whitespace from all string body fields */
const sanitizeBody = (req, _res, next) => {
    if (req.body && typeof req.body === 'object') {
        for (const key of Object.keys(req.body)) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        }
    }
    next();
};

module.exports = {
    validateLoginBody,
    validateCreateUserBody,
    validateUpdateUserBody,
    validateIdParam,
    validateBody,
    validateParams,
    sanitizeBody,
};
