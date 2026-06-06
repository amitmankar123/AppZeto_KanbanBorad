import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../slices/authSlice.js";
import { clearCurrentBoard } from "../slices/boardSlice.js";
import { LogOut, LayoutGrid, Users, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { currentBoard } = useSelector((state) => state.board);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCurrentBoard());
    navigate("/login");
  };

  const getOnlineMembersCount = () => {
    if (!currentBoard || !currentBoard.members) return 0;
    return currentBoard.members.filter((m) => m.isOnline).length;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Side: Logo and Navigation */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => navigate("/")}
            className="flex cursor-pointer items-center gap-2 text-xl font-bold tracking-tight text-white transition hover:opacity-90"
          >
            <div className="rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 p-2 text-white">
              <LayoutGrid size={20} />
            </div>
            <span>AppZeto</span>
          </div>

          {currentBoard && (
            <div className="hidden h-6 w-px bg-slate-800 md:block"></div>
          )}

          {currentBoard && (
            <div className="hidden items-center gap-2 md:flex">
              <h1 className="text-sm font-semibold text-slate-200">
                {currentBoard.title}
              </h1>
              <div className="flex items-center gap-1.5 rounded-full bg-slate-800/60 px-2 py-0.5 text-xs font-medium text-slate-400">
                <Users size={12} />
                <span>{currentBoard.members?.length || 1} members</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Online Status & User Profile */}
        <div className="flex items-center gap-4">
          {currentBoard && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-medium border border-emerald-500/20">
              <Circle size={8} className="fill-current animate-pulse" />
              <span>{getOnlineMembersCount()} Online</span>
            </div>
          )}

          {/* User Details */}
          {user && (
            <div className="flex items-center gap-3 border-l border-slate-850 pl-4">
              <div className="hidden text-right md:block">
                <p className="text-sm font-medium text-slate-200">{user.name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                alt={user.name}
                className="h-9 w-9 rounded-full ring-2 ring-purple-500/30 object-cover"
              />
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
