const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
        return res.status(401).json({
            message: "Access Denied! header empty",
        });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            message: "Access Denied! Token missing",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(403).json({
            message: "Session expired. Please log in again.",
        });
    }
}

module.exports = verifyToken;
