const jwt = require("jsonwebtoken");

function createToken(userId) {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
    );
}

module.exports = { createToken };
