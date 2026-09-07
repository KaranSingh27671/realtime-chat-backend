const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        emoji: {
            type: String,
            required: true
        }
    },
    {
        _id: false
    }
);

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        content: {
            type: String,
            required: true,
            maxlength: 5000
        },

        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        },

        reactions: {
            type: [reactionSchema],
            default: []
        },

        edited: {
            type: Boolean,
            default: false
        },

        deletedForEveryone: {
            type: Boolean,
            default: false
        },

        deletedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

messageSchema.index({
    sender: 1,
    receiver: 1,
    createdAt: -1
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;