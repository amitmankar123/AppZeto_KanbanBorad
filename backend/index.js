import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import connectDB from "./src/config/db.js";

// Routers
import authRouter from "./src/routers/auth.js";
import boardRouter from "./src/routers/boards.js";
import taskRouter from "./src/routers/tasks.js";
import commentRouter from "./src/routers/comments.js";
import activityRouter from "./src/routers/activity.js";
import attachmentRouter from "./src/routers/attachments.js";

// Socket Handler
import { setupSocket } from "./src/sockets/socketHandler.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Enable CORS for API requests
app.use(
  cors({
    origin: "*", // Adjust as necessary for production security
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve file uploads statically
app.use("/uploads", express.static("uploads"));

// Connect DB
connectDB();

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

setupSocket(io);

// Make io accessible in request objects if needed
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/boards", boardRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/comments", commentRouter);
app.use("/api/activity", activityRouter);
app.use("/api/attachments", attachmentRouter);

app.get("/", (req, res) => {
  res.send("Kanban API Running...");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});