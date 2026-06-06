import React from "react";
import { CheckSquare, ListTodo, AlertTriangle, Layers, Percent } from "lucide-react";

const AnalyticsDashboard = ({ tasks }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Done").length;
  const pendingTasks = tasks.filter((t) => t.status !== "Done").length;
  const highPriorityTasks = tasks.filter((t) => t.priority === "High").length;

  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {/* Total Tasks Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center gap-3.5 shadow-md">
        <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-400 border border-purple-500/20">
          <Layers size={18} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
            Total Tasks
          </p>
          <p className="text-xl font-bold text-white">{totalTasks}</p>
        </div>
      </div>

      {/* Completed Tasks Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center gap-3.5 shadow-md">
        <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/20">
          <CheckSquare size={18} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
            Completed
          </p>
          <p className="text-xl font-bold text-white">{completedTasks}</p>
        </div>
      </div>

      {/* Pending Tasks Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center gap-3.5 shadow-md">
        <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400 border border-amber-500/20">
          <ListTodo size={18} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
            Pending
          </p>
          <p className="text-xl font-bold text-white">{pendingTasks}</p>
        </div>
      </div>

      {/* High Priority Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center gap-3.5 shadow-md">
        <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-400 border border-rose-500/20">
          <AlertTriangle size={18} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
            High Priority
          </p>
          <p className="text-xl font-bold text-white">{highPriorityTasks}</p>
        </div>
      </div>

      {/* Completion Percentage Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center gap-3.5 shadow-md col-span-2 md:col-span-1">
        <div className="rounded-xl bg-sky-500/10 p-2.5 text-sky-400 border border-sky-500/20">
          <Percent size={18} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
            Progress
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">{completionPercentage}%</span>
            <div className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-purple-500 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
