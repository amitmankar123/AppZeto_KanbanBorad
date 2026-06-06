import User from "../models/User.js";

// Maps socket.id to userId and details
const activeSockets = new Map();

export const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User Online Status Setup
    socket.on("user-online", async ({ userId }) => {
      if (!userId) return;
      
      activeSockets.set(socket.id, userId);
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
        io.emit("member-status-change", { userId, isOnline: true });
        console.log(`User online: ${userId}`);
      } catch (err) {
        console.error("Error setting user online:", err);
      }
    });

    // Board joining
    socket.on("join-board", ({ boardId, user }) => {
      if (!boardId) return;
      socket.join(boardId);
      console.log(`User ${user?.name || socket.id} joined board: ${boardId}`);

      // Notify others in room
      socket.to(boardId).emit("member-status-change", {
        userId: user?._id,
        isOnline: true,
        boardId,
      });
    });

    // Board leaving
    socket.on("leave-board", ({ boardId, user }) => {
      if (!boardId) return;
      socket.leave(boardId);
      console.log(`User ${user?.name || socket.id} left board: ${boardId}`);
    });

    // Task Events
    socket.on("task-created", ({ boardId, task, eventId }) => {
      socket.to(boardId).emit("task-created", { task, eventId });
    });

    socket.on("task-updated", ({ boardId, task, eventId }) => {
      socket.to(boardId).emit("task-updated", { task, eventId });
    });

    socket.on("task-deleted", ({ boardId, taskId, eventId }) => {
      socket.to(boardId).emit("task-deleted", { taskId, eventId });
    });

    socket.on("task-moved", ({ boardId, task, eventId }) => {
      socket.to(boardId).emit("task-moved", { task, eventId });
    });

    // Typing Indicators
    socket.on("typing-start", ({ boardId, userName, taskId }) => {
      socket.to(boardId).emit("typing-start", { userName, taskId });
    });

    socket.on("typing-stop", ({ boardId, userName, taskId }) => {
      socket.to(boardId).emit("typing-stop", { userName, taskId });
    });

    // Sync board state
    socket.on("board-sync", ({ boardId, state }) => {
      socket.to(boardId).emit("board-refresh", { boardId, state });
    });

    // Reconnection and recovery
    socket.on("reconnect-board", ({ boardId, userId }) => {
      if (boardId) {
        socket.join(boardId);
        console.log(`Socket reconnected & recovered room ${boardId} for user ${userId}`);
      }
    });

    // Disconnect
    socket.on("disconnect", async () => {
      const userId = activeSockets.get(socket.id);
      console.log(`Socket disconnected: ${socket.id} (user: ${userId})`);

      if (userId) {
        activeSockets.delete(socket.id);

        // Optional: Check if user has other tabs open before setting offline
        const isStillConnected = Array.from(activeSockets.values()).includes(userId);
        if (!isStillConnected) {
          try {
            await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
            io.emit("member-status-change", { userId, isOnline: false });
            io.emit("user-offline", { userId });
          } catch (err) {
            console.error("Error setting user offline:", err);
          }
        }
      }
    });
  });
};
