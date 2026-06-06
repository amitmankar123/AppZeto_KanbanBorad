import Attachment from "../models/Attachment.js";
import Task from "../models/Task.js";
import Activity from "../models/Activity.js";

const logActivity = async (boardId, userId, action, metadata = {}) => {
  try {
    await Activity.create({
      boardId,
      userId,
      action,
      metadata,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

export const uploadAttachment = async (req, res) => {
  const { taskId } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!taskId) {
      return res.status(400).json({ message: "Task ID is required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Relative file URL
    const fileUrl = `/uploads/${req.file.filename}`;

    const attachment = await Attachment.create({
      taskId,
      fileName: req.file.originalname,
      fileUrl,
      uploadedBy: req.user._id,
    });

    const populatedAttachment = await Attachment.findById(attachment._id)
      .populate("uploadedBy", "name email avatar");

    await logActivity(task.boardId, req.user._id, "File Attached", {
      taskId,
      taskTitle: task.title,
      fileName: req.file.originalname,
    });

    res.status(201).json(populatedAttachment);
  } catch (error) {
    console.error("Upload Attachment Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAttachmentsByTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    const attachments = await Attachment.find({ taskId })
      .populate("uploadedBy", "name email avatar")
      .sort({ createdAt: -1 });

    res.json(attachments);
  } catch (error) {
    console.error("Get Attachments Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
