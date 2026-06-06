import { io } from "socket.io-client";
import { setConnected } from "../slices/socketSlice.js";
import {
  addTaskFromSocket,
  updateTaskFromSocket,
  removeTaskFromSocket,
  fetchTasksForBoard,
} from "../slices/taskSlice.js";
import { syncBoardMembers } from "../slices/boardSlice.js";
import { setMemberTyping, clearMemberTyping } from "../slices/memberSlice.js";

let socket = null;

export const initiateSocketConnection = (userId, dispatch) => {
  if (socket) return socket;

  socket = io("http://localhost:5000", {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    dispatch(setConnected(true));
    socket.emit("user-online", { userId });
  });

  socket.on("disconnect", () => {
    dispatch(setConnected(false));
  });

  // Listeners for task updates
  socket.on("task-created", ({ task }) => {
    dispatch(addTaskFromSocket(task));
  });

  socket.on("task-updated", ({ task }) => {
    dispatch(updateTaskFromSocket(task));
  });

  socket.on("task-deleted", ({ taskId }) => {
    dispatch(removeTaskFromSocket(taskId));
  });

  socket.on("task-moved", ({ task, boardId }) => {
    // When moved, re-sequencing happens on the server.
    // Fetching the fresh state is the most reliable way to align all users.
    if (task && task.boardId) {
      dispatch(fetchTasksForBoard(task.boardId));
    }
  });

  // Presence and status sync
  socket.on("member-status-change", (data) => {
    dispatch(syncBoardMembers(data));
  });

  socket.on("user-offline", (data) => {
    dispatch(syncBoardMembers({ userId: data.userId, isOnline: false }));
  });

  // Typing indicators
  socket.on("typing-start", ({ userName, taskId }) => {
    dispatch(setMemberTyping({ taskId, userName }));
  });

  socket.on("typing-stop", ({ taskId }) => {
    dispatch(clearMemberTyping({ taskId }));
  });

  // Board sync
  socket.on("board-refresh", ({ boardId }) => {
    dispatch(fetchTasksForBoard(boardId));
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinBoardRoom = (boardId, user) => {
  if (socket) {
    socket.emit("join-board", { boardId, user });
  }
};

export const leaveBoardRoom = (boardId, user) => {
  if (socket) {
    socket.emit("leave-board", { boardId, user });
  }
};

export const emitTaskCreated = (boardId, task) => {
  if (socket) {
    socket.emit("task-created", { boardId, task });
  }
};

export const emitTaskUpdated = (boardId, task) => {
  if (socket) {
    socket.emit("task-updated", { boardId, task });
  }
};

export const emitTaskDeleted = (boardId, taskId) => {
  if (socket) {
    socket.emit("task-deleted", { boardId, taskId });
  }
};

export const emitTaskMoved = (boardId, task) => {
  if (socket) {
    socket.emit("task-moved", { boardId, task });
  }
};

export const emitTypingStart = (boardId, userName, taskId) => {
  if (socket) {
    socket.emit("typing-start", { boardId, userName, taskId });
  }
};

export const emitTypingStop = (boardId, userName, taskId) => {
  if (socket) {
    socket.emit("typing-stop", { boardId, userName, taskId });
  }
};

export const emitBoardSync = (boardId) => {
  if (socket) {
    socket.emit("board-sync", { boardId });
  }
};
