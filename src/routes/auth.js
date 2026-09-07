const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

function createToken(userId) {
    return jwt.sign(
        { userId: String(userId) },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

function safeUser(user) {
    return {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio
    };
}

router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: cleanEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        const user = await User.create({
            username: username.trim(),
            email: cleanEmail,
            password: hashedPassword
        });

        const token = createToken(user._id);

        res.status(201).json({
            message: "Registration successful",
            token,
            user: safeUser(user)
        });

    } catch (error) {
        res.status(500).json({
            message: "Registration failed"
        });
    }
});


router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: cleanEmail
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = createToken(user._id);

        res.json({
            message: "Login successful",
            token,
            user: safeUser(user)
        });

    } catch (error) {
        res.status(500).json({
            message: "Login failed"
        });
    }
});


router.get(
    "/me",
    authMiddleware,
    async (req, res) => {
        try {
            const user = await User.findById(
                req.userId
            );

            if (!user) {
                return res.status(404).json({
                    message: "User not found"
                });
            }

            res.json(safeUser(user));

        } catch (error) {
            res.status(500).json({
                message: "Failed to load user"
            });
        }
    }
);


router.get(
    "/users",
    authMiddleware,
    async (req, res) => {
        try {
            const users = await User.find({
                _id: { $ne: req.userId }
            }).select("username email bio");

            res.json(users);

        } catch (error) {
            res.status(500).json({
                message: "Failed to load users"
            });
        }
    }
);


module.exports = router;