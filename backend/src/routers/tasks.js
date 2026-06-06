import express from "express";
import {
  createTask,
  getTasksByBoard,
  updateTask,
  deleteTask,
  moveTask,
} from "../controllers/taskController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, createTask);
router.get("/:boardId", protect, getTasksByBoard);
router.put("/:id", protect, updateTask);
router.delete("/:id", protect, deleteTask);
router.patch("/:id/move", protect, moveTask);

export default router;
