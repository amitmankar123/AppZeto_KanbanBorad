import Task from "../models/Task.js";
import Activity from "../models/Activity.js";
import Comment from "../models/Comment.js";
import Attachment from "../models/Attachment.js";

// Helper to log board activity
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

export const createTask = async (req, res) => {
  const { boardId, title, description, priority, dueDate, assignedTo, status } = req.body;

  try {
    if (!boardId || !title) {
      return res.status(400).json({ message: "Board ID and Title are required" });
    }

    // Check for duplicate title (case-insensitive) on the same board
    const duplicateTask = await Task.findOne({
      boardId,
      title: { $regex: new RegExp(`^${title.trim()}$`, "i") },
    });
    if (duplicateTask) {
      return res.status(400).json({ message: "A task with this title already exists on this board." });
    }

    const taskStatus = status || "Todo";

    // Find the max position in the destination column
    const maxPosTask = await Task.findOne({ boardId, status: taskStatus })
      .sort({ position: -1 })
      .select("position");
    const newPosition = maxPosTask ? maxPosTask.position + 1 : 0;

    const task = await Task.create({
      boardId,
      title,
      description: description || "",
      priority: priority || "Medium",
      dueDate,
      assignedTo: assignedTo || null,
      status: taskStatus,
      position: newPosition,
      createdBy: req.user._id,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email avatar isOnline lastSeen")
      .populate("createdBy", "name email avatar");

    await logActivity(boardId, req.user._id, "Task Created", {
      taskId: task._id,
      taskTitle: title,
    });

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error("Create Task Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getTasksByBoard = async (req, res) => {
  const { boardId } = req.params;

  try {
    const tasks = await Task.find({ boardId })
      .populate("assignedTo", "name email avatar isOnline lastSeen")
      .populate("createdBy", "name email avatar")
      .sort({ position: 1 });

    res.json(tasks);
  } catch (error) {
    console.error("Get Tasks Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, dueDate, assignedTo, status } = req.body;

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check for duplicate title (case-insensitive) on the same board if title is changing
    if (title !== undefined && title.trim() !== task.title) {
      const duplicateTask = await Task.findOne({
        boardId: task.boardId,
        _id: { $ne: task._id },
        title: { $regex: new RegExp(`^${title.trim()}$`, "i") },
      });
      if (duplicateTask) {
        return res.status(400).json({ message: "A task with this title already exists on this board." });
      }
    }

    const oldStatus = task.status;
    const oldTitle = task.title;

    task.title = title !== undefined ? title : task.title;
    task.description = description !== undefined ? description : task.description;
    task.priority = priority !== undefined ? priority : task.priority;
    task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;
    task.assignedTo = assignedTo !== undefined ? assignedTo : task.assignedTo;

    // Handle status change via PUT
    let statusChanged = false;
    if (status !== undefined && status !== task.status) {
      statusChanged = true;
      task.status = status;
    }

    if (statusChanged) {
      // Find maximum position in the new column
      const maxPosTask = await Task.findOne({ boardId: task.boardId, status: status })
        .sort({ position: -1 })
        .select("position");
      task.position = maxPosTask ? maxPosTask.position + 1 : 0;
    }

    await task.save();

    // If status changed, let's normalize/re-sequence both the old and new columns
    if (statusChanged) {
      await resequenceColumn(task.boardId, oldStatus);
      await resequenceColumn(task.boardId, status);
    }

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email avatar isOnline lastSeen")
      .populate("createdBy", "name email avatar");

    await logActivity(task.boardId, req.user._id, "Task Updated", {
      taskId: task._id,
      taskTitle: task.title,
      oldTitle,
    });

    res.json(populatedTask);
  } catch (error) {
    console.error("Update Task Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { boardId, title, status } = task;

    await Task.findByIdAndDelete(id);

    // Clean up comments and attachments
    await Comment.deleteMany({ taskId: id });
    await Attachment.deleteMany({ taskId: id });

    // Resequence remaining tasks in that column
    await resequenceColumn(boardId, status);

    await logActivity(boardId, req.user._id, "Task Deleted", {
      taskTitle: title,
    });

    res.json({ message: `Task '${title}' deleted successfully` });
  } catch (error) {
    console.error("Delete Task Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const moveTask = async (req, res) => {
  const { id } = req.params;
  const { destinationStatus, destinationIndex } = req.body;

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const sourceStatus = task.status;
    const boardId = task.boardId;

    // Fetch all current tasks in target status ordered by position
    let targetColumnTasks = await Task.find({ boardId, status: destinationStatus })
      .sort({ position: 1 });

    // Remove current task if it is already in target column
    targetColumnTasks = targetColumnTasks.filter(t => t._id.toString() !== id);

    // Insert task at target index
    const targetIdx = Math.max(0, Math.min(destinationIndex, targetColumnTasks.length));
    targetColumnTasks.splice(targetIdx, 0, task);

    // Resequence positions sequentially
    for (let i = 0; i < targetColumnTasks.length; i++) {
      const t = targetColumnTasks[i];
      t.position = i;
      t.status = destinationStatus;
      await t.save();
    }

    // Resequence source column if different from destination
    if (sourceStatus !== destinationStatus) {
      await resequenceColumn(boardId, sourceStatus);
    }

    const populatedTask = await Task.findById(id)
      .populate("assignedTo", "name email avatar isOnline lastSeen")
      .populate("createdBy", "name email avatar");

    await logActivity(boardId, req.user._id, "Task Moved", {
      taskId: id,
      taskTitle: task.title,
      from: sourceStatus,
      to: destinationStatus,
    });

    res.json({ message: "Task moved successfully", task: populatedTask });
  } catch (error) {
    console.error("Move Task Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Resequencing helper
async function resequenceColumn(boardId, status) {
  try {
    const tasks = await Task.find({ boardId, status }).sort({ position: 1 });
    for (let i = 0; i < tasks.length; i++) {
      tasks[i].position = i;
      await tasks[i].save();
    }
  } catch (err) {
    console.error("Resequence error:", err);
  }
}
