"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function trimRequestBody(req, res, next) {
    if (req.body) {
        req.body = deepTrim(req.body);
    }
    if (req.query) {
        req.query = deepTrim(req.query);
    }
    if (req.params) {
        req.params = deepTrim(req.params);
    }
    next();
}
function deepTrim(data) {
    if (typeof data === 'string') {
        return data.trim();
    }
    if (Array.isArray(data)) {
        return data.map(item => deepTrim(item));
    }
    if (typeof data === 'object' && data !== null) {
        return Object.entries(data).reduce((acc, [key, value]) => {
            acc[key] = deepTrim(value);
            return acc;
        }, {});
    }
    return data;
}
exports.default = trimRequestBody;
