import Activity from "../models/Activity.js";

export const getActivityByBoard = async (req, res) => {
  const { boardId } = req.params;

  try {
    const activities = await Activity.find({ boardId })
      .populate("userId", "name email avatar isOnline lastSeen")
      .sort({ createdAt: -1 })
      .limit(50); // Get latest 50 activities

    res.json(activities);
  } catch (error) {
    console.error("Get Activity Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
