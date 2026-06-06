import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import KanbanTaskCard from "./KanbanTaskCard.jsx";
import { Plus } from "lucide-react";

const KanbanColumn = ({ status, tasks, onAddTask, onTaskClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const getStatusColor = (colStatus) => {
    switch (colStatus) {
      case "Todo":
        return "border-t-sky-500 bg-sky-500/10 text-sky-400";
      case "In Progress":
        return "border-t-amber-500 bg-amber-500/10 text-amber-400";
      case "Review":
        return "border-t-indigo-500 bg-indigo-500/10 text-indigo-400";
      case "Done":
        return "border-t-emerald-500 bg-emerald-500/10 text-emerald-400";
      default:
        return "border-t-slate-500 bg-slate-500/10 text-slate-400";
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-4 rounded-2xl bg-slate-900/60 p-4 border-t-4 border-slate-800 transition-all duration-200 min-h-[500px] w-full lg:w-[280px] xl:w-[300px] flex-shrink-0 ${
        getStatusColor(status)
      } ${isOver ? "bg-slate-800/40 ring-1 ring-purple-500/20" : ""}`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between border-b border-slate-850 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-white tracking-wide">{status}</h3>
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
            {tasks.length}
          </span>
        </div>
        
        {/* Create Task Button */}
        <button
          onClick={() => onAddTask(status)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          title={`Add task to ${status}`}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Task List */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto max-h-[70vh] pr-1">
        <SortableContext
          items={tasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanTaskCard
              key={task._id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-850 py-12 text-center text-xs text-slate-500">
            No tasks here
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
