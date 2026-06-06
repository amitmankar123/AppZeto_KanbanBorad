import express from "express";
import {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  inviteMember,
} from "../controllers/boardController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.route("/")
  .post(protect, createBoard)
  .get(protect, getBoards);

router.route("/:id")
  .get(protect, getBoardById)
  .put(protect, updateBoard)
  .delete(protect, deleteBoard);

router.post("/:id/invite", protect, inviteMember);

export default router;
