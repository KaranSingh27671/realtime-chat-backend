const jwt = require("jsonwebtoken");
const Message = require("../models/Message");

function setupSocket(io) {
    const onlineUsers = new Map();

    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            socket.userId = String(decoded.userId);

            next();

        } catch (error) {
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket) => {

        onlineUsers.set(socket.userId, socket.id);

        io.emit(
            "onlineUsers",
            Array.from(onlineUsers.keys())
        );

        socket.on("sendMessage", async (data) => {

            try {
                const { receiver, content } = data;

                if (!receiver || !content || !content.trim()) {
                    return;
                }

                const message = await Message.create({
                    sender: socket.userId,
                    receiver: receiver,
                    content: content.trim()
                });

                const receiverSocketId =
                    onlineUsers.get(receiver);

                socket.emit("newMessage", message);

                if (receiverSocketId) {
                    io.to(receiverSocketId).emit(
                        "newMessage",
                        message
                    );
                }

            } catch (error) {
                console.log(
                    "Socket message error:",
                    error.message
                );
            }
        });

        socket.on("disconnect", () => {

            onlineUsers.delete(socket.userId);

            io.emit(
                "onlineUsers",
                Array.from(onlineUsers.keys())
            );
        });

    });
}

module.exports = setupSocket;