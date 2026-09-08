const jwt = require("jsonwebtoken");

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

        socket.join(socket.userId);

        onlineUsers.set(
            socket.userId,
            socket.id
        );

        io.emit(
            "onlineUsers",
            Array.from(onlineUsers.keys())
        );

        socket.on("sendMessage", (message) => {

            try {

                const receiverId =
                    typeof message.receiver === "object"
                        ? message.receiver._id
                        : message.receiver;

                if (!receiverId) {
                    return;
                }

                io.to(String(receiverId)).emit(
                    "receiveMessage",
                    message
                );

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