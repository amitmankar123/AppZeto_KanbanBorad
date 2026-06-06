import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBoards, createNewBoard } from "../slices/boardSlice.js";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, Plus, Calendar, Users, Briefcase } from "lucide-react";
import Navbar from "../components/Navbar.jsx";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { boards, isLoading, error } = useSelector((state) => state.board);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");

  useEffect(() => {
    dispatch(fetchBoards());
  }, [dispatch]);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    const result = await dispatch(createNewBoard(newBoardTitle));
    if (result.meta.requestStatus === "fulfilled") {
      setNewBoardTitle("");
      setShowCreateModal(false);
      // Navigate directly to the new board
      navigate(`/board/${result.payload._id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Upper Banner */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Your Boards</h2>
            <p className="text-sm text-slate-400">
              Select a workspace or create a new one to begin collaborating
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-purple-500 hover:shadow-purple-500/20 transition"
          >
            <Plus size={16} />
            <span>Create Board</span>
          </button>
        </div>

        {/* Dashboard Grid */}
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-20 text-slate-400">
            Loading your workspaces...
          </div>
        ) : error ? (
          <div className="rounded-xl bg-rose-500/10 p-5 border border-rose-500/20 text-center text-sm text-rose-400">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {boards.map((board) => (
              <div
                key={board._id}
                onClick={() => navigate(`/board/${board._id}`)}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-md cursor-pointer hover:border-slate-700/60 hover:bg-slate-900/60 transition-all duration-200"
              >
                <div>
                  <div className="rounded-lg bg-purple-500/10 p-2.5 text-purple-400 w-fit mb-4 border border-purple-500/20 group-hover:bg-purple-600 group-hover:text-white transition duration-200">
                    <Briefcase size={18} />
                  </div>
                  <h3 className="text-base font-bold text-slate-200 group-hover:text-white transition truncate">
                    {board.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Created by {board.createdBy?.name || "Member"}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Users size={12} />
                    <span>{board.members?.length || 1} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>
                      {new Date(board.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {boards.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-800 py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                <LayoutGrid size={40} className="text-slate-700" />
                <p className="text-sm">No boards found</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-xs font-semibold text-purple-400 hover:text-purple-300 underline"
                >
                  Create one now
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Create New Board</h3>
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
                  Board Title
                </label>
                <input
                  type="text"
                  required
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 border border-slate-700/50 focus:border-purple-500 focus:outline-none"
                  placeholder="e.g. Project Delivery"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition"
                >
                  Create Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
