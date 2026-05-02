"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    console.error(err);
    if (err instanceof Error) {
        res.status(500).json({ success: false, message: err.message });
    }
    else {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}
