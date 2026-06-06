import Comment from "../models/Comment.js";
import Task from "../models/Task.js";

export const addComment = async (req, res) => {
  const { taskId, content } = req.body;

  try {
    if (!taskId || !content) {
      return res.status(400).json({ message: "Task ID and comment content are required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const comment = await Comment.create({
      taskId,
      userId: req.user._id,
      content,
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate("userId", "name email avatar isOnline lastSeen");

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Add Comment Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getCommentsByTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    const comments = await Comment.find({ taskId })
      .populate("userId", "name email avatar isOnline lastSeen")
      .sort({ createdAt: 1 }); // oldest comments first in timeline

    res.json(comments);
  } catch (error) {
    console.error("Get Comments Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
