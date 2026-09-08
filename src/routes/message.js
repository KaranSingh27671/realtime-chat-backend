const express = require("express");

const mongoose = require("mongoose");

const Message = require("../models/Message");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.query.userId;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({
                message: "Valid userId is required"
            });
        }

        const messages = await Message.find({
            $or: [
                {
                    sender: req.userId,
                    receiver: userId
                },
                {
                    sender: userId,
                    receiver: req.userId
                }
            ]
        })
        .populate("sender", "username email")
        .populate("receiver", "username email")
        .sort({ createdAt: 1 });

        res.json(messages);

    } catch (error) {
        res.status(500).json({
            message: "Failed to load messages"
        });
    }
});


router.post("/", authMiddleware, async (req, res) => {
    try {
        const { receiver, content } = req.body;

        if (!mongoose.isValidObjectId(receiver)) {
            return res.status(400).json({
                message: "Invalid receiver"
            });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({
                message: "Message cannot be empty"
            });
        }

        const message = await Message.create({
            sender: req.userId,
            receiver: receiver,
            content: content.trim()
        });

        const populatedMessage = await message.populate(
            "sender receiver",
            "username email"
        );

        const io = req.app.get("io");

        if (io) {
            io.to(String(req.userId)).emit(
                "messageSent",
                populatedMessage
            );

            io.to(String(receiver)).emit(
                "receiveMessage",
                populatedMessage
            );
        }

        res.status(201).json(populatedMessage);

    } catch (error) {
        res.status(500).json({
            message: "Message creation failed"
        });
    }
});


module.exports = router;