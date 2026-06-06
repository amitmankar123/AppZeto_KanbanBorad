import express from "express";
import { uploadAttachment, getAttachmentsByTask } from "../controllers/attachmentController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/", protect, upload.single("file"), uploadAttachment);
router.get("/:taskId", protect, getAttachmentsByTask);

export default router;
