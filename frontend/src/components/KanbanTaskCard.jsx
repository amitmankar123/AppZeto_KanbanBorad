import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, MessageSquare, Paperclip, Edit2, AlertCircle } from "lucide-react";
import { useSelector } from "react-redux";

const KanbanTaskCard = ({ task, onClick }) => {
  const { id, title, description, priority, dueDate, assignedTo, status } = task;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const typingMembers = useSelector((state) => state.member.typingMembers);
  const typist = typingMembers[task._id];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // Helper to determine priority classes
  const getPriorityClasses = (p) => {
    switch (p) {
      case "High":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "Low":
      default:
        return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
    }
  };

  // Format Due Date
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isOverdue = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateString) < today && status !== "Done";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col gap-3 rounded-xl bg-slate-800/80 p-4 border border-slate-700/50 shadow-md transition-all duration-200 hover:border-slate-600/70 hover:shadow-lg ${
        isDragging ? "ring-2 ring-purple-500/50" : ""
      }`}
    >
      {/* Header: Drag Handle & Quick Edit */}
      <div className="flex items-start justify-between gap-2">
        <div
          {...attributes}
          {...listeners}
          className="flex-1 cursor-grab active:cursor-grabbing text-sm font-semibold leading-snug text-slate-100 group-hover:text-white"
        >
          {title}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white transition"
        >
          <Edit2 size={13} />
        </button>
      </div>

      {/* Description Preview */}
      {description && (
        <p className="line-clamp-2 text-xs text-slate-400 leading-normal">
          {description}
        </p>
      )}

      {/* Real-time Editing / Typing Indicator */}
      {typist && (
        <div className="flex items-center gap-1.5 rounded-md bg-purple-500/10 px-2 py-1 border border-purple-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
          <span className="text-[10px] font-medium text-purple-300">
            {typist} is editing...
          </span>
        </div>
      )}

      {/* Footer: Tags, Dates, and Assignee */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-700/30">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Priority */}
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${getPriorityClasses(priority)}`}>
            {priority}
          </span>

          {/* Due date */}
          {dueDate && (
            <span
              className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                isOverdue(dueDate)
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse"
                  : "bg-slate-750 text-slate-400"
              }`}
            >
              {isOverdue(dueDate) ? <AlertCircle size={10} /> : <Calendar size={10} />}
              <span>{formatDate(dueDate)}</span>
            </span>
          )}
        </div>

        {/* Assignee Avatar */}
        {assignedTo ? (
          <div className="relative group/avatar">
            <img
              src={assignedTo.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${assignedTo.name}`}
              alt={assignedTo.name}
              className="h-6 w-6 rounded-full ring-2 ring-slate-800 object-cover"
              title={`Assigned to ${assignedTo.name}`}
            />
            {assignedTo.isOnline && (
              <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-slate-800" />
            )}
          </div>
        ) : (
          <div className="h-6 w-6 rounded-full border border-dashed border-slate-600/70 bg-slate-800/40 flex items-center justify-center text-[9px] text-slate-500 font-medium">
            --
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanTaskCard;
