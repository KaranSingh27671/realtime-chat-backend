const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {

    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authorization token required"
        });
    }

    const token = header.slice(7).trim();

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.userId = String(decoded.userId);

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

module.exports = authMiddleware;