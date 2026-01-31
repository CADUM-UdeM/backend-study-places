const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "";
const JWT_EXPIRES_IN = '30d';

function generateToken(userId) {
    return jwt.sign(
        { userId: userId.toString() },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
}

module.exports = {
    generateToken,
    verifyToken
};
