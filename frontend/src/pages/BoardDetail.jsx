import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchBoardById, inviteUserToBoard, deleteActiveBoard } from "../slices/boardSlice.js";
import { fetchTasksForBoard, setSearchQuery, setFilterPriority, setFilterAssignedTo, setFilterDueDate } from "../slices/taskSlice.js";
import { joinBoardRoom, leaveBoardRoom } from "../socket/socketService.js";
import Navbar from "../components/Navbar.jsx";
import KanbanBoard from "../components/KanbanBoard.jsx";
import TaskModal from "../components/TaskModal.jsx";
import ActivityFeed from "../components/ActivityFeed.jsx";
import AnalyticsDashboard from "../components/AnalyticsDashboard.jsx";
import { Search, Plus, Filter, UserPlus, Trash, ChevronLeft } from "lucide-react";

const BoardDetail = () => {
  const { id: boardId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentBoard, isLoading: isBoardLoading, error: boardError } = useSelector((state) => state.board);
  const { tasks, searchQuery, filterPriority, filterAssignedTo, filterDueDate } = useSelector((state) => state.task);
  const { user } = useSelector((state) => state.auth);

  // Local Modal States
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [initialTaskStatus, setInitialTaskStatus] = useState("Todo");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  // Load Board details and Tasks
  useEffect(() => {
    if (boardId) {
      dispatch(fetchBoardById(boardId));
      dispatch(fetchTasksForBoard(boardId));
      
      // Join Room
      joinBoardRoom(boardId, user);
    }

    return () => {
      if (boardId) {
        // Leave Room
        leaveBoardRoom(boardId, user);
      }
    };
  }, [boardId, dispatch, user]);

  // Invite member submission
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const res = await dispatch(inviteUserToBoard({ boardId, email: inviteEmail }));
    if (res.meta.requestStatus === "fulfilled") {
      setInviteEmail("");
      setShowInviteModal(false);
      alert("Member added successfully!");
    } else {
      alert(res.payload || "Failed to invite user");
    }
  };

  // Delete current Board
  const handleDeleteBoard = async () => {
    if (!window.confirm("WARNING: Are you sure you want to delete this board and ALL its contents? This cannot be undone.")) return;
    const res = await dispatch(deleteActiveBoard(boardId));
    if (res.meta.requestStatus === "fulfilled") {
      navigate("/");
    }
  };

  // Open Task detail modal
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  // Open Task creation modal
  const handleAddTaskClick = (status) => {
    setInitialTaskStatus(status);
    setSelectedTask(null);
    setShowTaskModal(true);
  };

  // Task Filtering
  const filteredTasks = tasks.filter((task) => {
    // Search filter
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Priority filter
    if (filterPriority !== "All" && task.priority !== filterPriority) {
      return false;
    }

    // Assignee filter
    if (filterAssignedTo !== "All") {
      if (!task.assignedTo || task.assignedTo._id !== filterAssignedTo) {
        return false;
      }
    }

    // Due date filter
    if (filterDueDate !== "All") {
      if (!task.dueDate) return false;
      const d = new Date(task.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filterDueDate === "Overdue") {
        return d < today && task.status !== "Done";
      } else if (filterDueDate === "Due Today") {
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);
        return d >= today && d <= endOfToday;
      } else if (filterDueDate === "Due This Week") {
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + 7);
        return d >= today && d <= endOfWeek;
      }
    }

    return true;
  });

  if (isBoardLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading board details...
      </div>
    );
  }

  if (boardError || !currentBoard) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 gap-4">
        <p className="text-sm text-rose-400">Failed to load board: {boardError || "Not found"}</p>
        <Link to="/" className="text-purple-400 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isCreator = currentBoard.createdBy?._id === user?._id || currentBoard.createdBy === user?._id;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Workspace Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-850 pb-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <ChevronLeft size={16} />
            </Link>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">{currentBoard.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Owner: {currentBoard.createdBy?.name || "Workspace member"}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition"
            >
              <UserPlus size={14} />
              <span>Invite</span>
            </button>

            {isCreator && (
              <button
                onClick={handleDeleteBoard}
                className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-450 hover:bg-rose-500/20 transition"
              >
                <Trash size={14} />
                <span>Delete Board</span>
              </button>
            )}
          </div>
        </div>

        {/* Analytics Widgets */}
        <AnalyticsDashboard tasks={tasks} />

        {/* Task Filtering Toolbar */}
        <div className="flex flex-col gap-3 rounded-2xl bg-slate-900/40 p-4 border border-slate-800/80 md:flex-row md:items-center">
          {/* Search bar */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search size={14} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              placeholder="Search tasks..."
              className="w-full rounded-xl bg-slate-800 px-9 py-2 text-xs text-slate-200 placeholder-slate-500 border border-slate-700/50 focus:border-purple-500 focus:outline-none transition"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Priority Filter */}
            <div className="flex items-center gap-1.5">
              <Filter size={12} className="text-slate-500" />
              <select
                value={filterPriority}
                onChange={(e) => dispatch(setFilterPriority(e.target.value))}
                className="rounded-xl bg-slate-800 px-3 py-2 text-xs text-slate-200 border border-slate-700/50 focus:outline-none focus:border-purple-500 transition"
              >
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Assignee Filter */}
            <select
              value={filterAssignedTo}
              onChange={(e) => dispatch(setFilterAssignedTo(e.target.value))}
              className="rounded-xl bg-slate-800 px-3 py-2 text-xs text-slate-200 border border-slate-700/50 focus:outline-none focus:border-purple-500 transition"
            >
              <option value="All">All Assignees</option>
              {currentBoard.members?.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>

            {/* Due Date Filter */}
            <select
              value={filterDueDate}
              onChange={(e) => dispatch(setFilterDueDate(e.target.value))}
              className="rounded-xl bg-slate-800 px-3 py-2 text-xs text-slate-200 border border-slate-700/50 focus:outline-none focus:border-purple-500 transition"
            >
              <option value="All">All Timelines</option>
              <option value="Overdue">Overdue</option>
              <option value="Due Today">Due Today</option>
              <option value="Due This Week">Due This Week</option>
            </select>
          </div>
        </div>

        {/* Board Main Sections Grid */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Main Board Column (3/4 Width) */}
          <div className="flex-1 w-full overflow-hidden">
            <KanbanBoard
              tasks={filteredTasks}
              onAddTask={handleAddTaskClick}
              onTaskClick={handleTaskClick}
            />
          </div>

          {/* Activity Log Feed (1/4 Width) */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <ActivityFeed boardId={boardId} />
          </div>
        </div>
      </main>

      {/* Task Details / Edit / Create Modal */}
      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          initialStatus={initialTaskStatus}
          onClose={() => setShowTaskModal(false)}
        />
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Invite Member by Email</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 border border-slate-700/50 focus:border-purple-500 focus:outline-none"
                  placeholder="collaborator@example.com"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardDetail;
