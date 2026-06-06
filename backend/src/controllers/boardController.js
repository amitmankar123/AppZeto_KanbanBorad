import Board from "../models/Board.js";
import User from "../models/User.js";
import Task from "../models/Task.js";
import Activity from "../models/Activity.js";

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

export const createBoard = async (req, res) => {
  const { title } = req.body;

  try {
    if (!title) {
      return res.status(400).json({ message: "Board title is required" });
    }

    const board = await Board.create({
      title,
      createdBy: req.user._id,
      members: [req.user._id],
    });

    await logActivity(board._id, req.user._id, "Board Created", { boardTitle: title });

    res.status(201).json(board);
  } catch (error) {
    console.error("Create Board Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getBoards = async (req, res) => {
  try {
    // Find boards where the user is either creator or a member
    const boards = await Board.find({
      $or: [{ createdBy: req.user._id }, { members: req.user._id }],
    })
      .populate("createdBy", "name email avatar")
      .populate("members", "name email avatar isOnline lastSeen")
      .sort({ createdAt: -1 });

    res.json(boards);
  } catch (error) {
    console.error("Get Boards Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getBoardById = async (req, res) => {
  const { id } = req.params;

  try {
    const board = await Board.findById(id)
      .populate("createdBy", "name email avatar")
      .populate("members", "name email avatar isOnline lastSeen");

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    // Authorization check
    const isMember = board.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );
    if (!isMember && board.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(board);
  } catch (error) {
    console.error("Get Board By ID Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateBoard = async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  try {
    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    // Check if user is a member
    const isMember = board.members.some(
      (mId) => mId.toString() === req.user._id.toString()
    );
    if (!isMember && board.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    const oldTitle = board.title;
    board.title = title || board.title;
    await board.save();

    await logActivity(board._id, req.user._id, "Board Updated", {
      oldTitle,
      newTitle: board.title,
    });

    res.json(board);
  } catch (error) {
    console.error("Update Board Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteBoard = async (req, res) => {
  const { id } = req.params;

  try {
    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    // Only creator can delete board
    if (board.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the board creator can delete it" });
    }

    const boardTitle = board.title;
    await Board.findByIdAndDelete(id);

    // Delete tasks, activities and comments belonging to the board
    await Task.deleteMany({ boardId: id });
    await Activity.deleteMany({ boardId: id });

    res.json({ message: `Board '${boardTitle}' and its contents deleted successfully` });
  } catch (error) {
    console.error("Delete Board Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const inviteMember = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    // Check authorization
    const isMember = board.members.some(
      (mId) => mId.toString() === req.user._id.toString()
    );
    if (!isMember && board.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Find the user to invite
    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    // Check if user is already a member
    const alreadyMember = board.members.some(
      (mId) => mId.toString() === userToInvite._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: "User is already a member of this board" });
    }

    // Add to members
    board.members.push(userToInvite._id);
    await board.save();

    await logActivity(board._id, req.user._id, "Member Added", {
      inviteeName: userToInvite.name,
      inviteeEmail: userToInvite.email,
    });

    const updatedBoard = await Board.findById(id)
      .populate("createdBy", "name email avatar")
      .populate("members", "name email avatar isOnline lastSeen");

    res.json(updatedBoard);
  } catch (error) {
    console.error("Invite Member Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
