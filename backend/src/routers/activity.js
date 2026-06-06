import express from "express";
import { getActivityByBoard } from "../controllers/activityController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/:boardId", protect, getActivityByBoard);

export default router;
