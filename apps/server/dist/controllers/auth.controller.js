"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.logout = logout;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'admin';
// Store hashed password at startup
let hashedAdminPassword = null;
async function getHashedPassword() {
    if (!hashedAdminPassword) {
        const plain = process.env.ADMIN_PASSWORD ?? 'Admin@1234';
        hashedAdminPassword = await bcryptjs_1.default.hash(plain, 10);
    }
    return hashedAdminPassword;
}
async function login(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ success: false, message: 'Username and password are required' });
        return;
    }
    const hashed = await getHashedPassword();
    const validUser = username === ADMIN_USERNAME;
    const validPass = await bcryptjs_1.default.compare(password, hashed);
    if (!validUser || !validPass) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
    }
    const token = jsonwebtoken_1.default.sign({ adminId: 'admin' }, process.env.JWT_SECRET ?? 'secret', { expiresIn: '8h' });
    res.json({ success: true, data: { token, expiresIn: 8 * 60 * 60 } });
}
function logout(_req, res) {
    // Client-side token removal — server is stateless
    res.json({ success: true, message: 'Logged out' });
}
