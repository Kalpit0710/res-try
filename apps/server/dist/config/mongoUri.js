"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeMongoUri = normalizeMongoUri;
function normalizeMongoUri(uri, defaultDatabase = 'srms') {
    try {
        const parsed = new URL(uri);
        const pathname = parsed.pathname.replace(/^\/+/, '');
        if (!pathname) {
            parsed.pathname = `/${defaultDatabase}`;
            return parsed.toString();
        }
        return parsed.toString();
    }
    catch {
        if (uri.endsWith('/'))
            return `${uri}${defaultDatabase}`;
        return uri;
    }
}
