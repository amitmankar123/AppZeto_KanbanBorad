import React, { useState, useEffect } from "react";
import { Clock, PlusCircle, ArrowRightCircle, CheckCircle, UserPlus, Info } from "lucide-react";
import API from "../services/api.js";

const ActivityFeed = ({ boardId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (boardId) {
      fetchActivity();
    }
  }, [boardId]);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/activity/${boardId}`);
      setActivities(res.data);
    } catch (err) {
      console.error("Failed to load activity logs", err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case "Task Created":
        return <PlusCircle size={14} className="text-sky-400" />;
      case "Task Moved":
        return <ArrowRightCircle size={14} className="text-amber-400" />;
      case "Task Updated":
        return <Info size={14} className="text-indigo-400" />;
      case "Member Added":
        return <UserPlus size={14} className="text-purple-400" />;
      case "Task Deleted":
      default:
        return <Clock size={14} className="text-rose-400" />;
    }
  };

  const formatActivityMessage = (act) => {
    const name = <span className="font-semibold text-slate-200">{act.userId?.name || "Someone"}</span>;
    const taskTitle = act.metadata?.taskTitle ? (
      <span className="font-semibold text-white">"{act.metadata.taskTitle}"</span>
    ) : (
      ""
    );

    switch (act.action) {
      case "Board Created":
        return (
          <p className="text-xs text-slate-350">
            {name} created this board.
          </p>
        );
      case "Board Updated":
        return (
          <p className="text-xs text-slate-350">
            {name} renamed this board.
          </p>
        );
      case "Task Created":
        return (
          <p className="text-xs text-slate-350">
            {name} created task {taskTitle}.
          </p>
        );
      case "Task Updated":
        return (
          <p className="text-xs text-slate-350">
            {name} updated task {taskTitle}.
          </p>
        );
      case "Task Deleted":
        return (
          <p className="text-xs text-slate-350">
            {name} deleted task {taskTitle}.
          </p>
        );
      case "Task Moved":
        return (
          <p className="text-xs text-slate-350">
            {name} moved {taskTitle} from <span className="text-slate-400">{act.metadata.from}</span> to{" "}
            <span className="text-slate-450 font-semibold">{act.metadata.to}</span>.
          </p>
        );
      case "Member Added":
        return (
          <p className="text-xs text-slate-350">
            {name} invited <span className="font-semibold text-slate-200">{act.metadata.inviteeName}</span>.
          </p>
        );
      case "File Attached":
        return (
          <p className="text-xs text-slate-350">
            {name} uploaded <span className="text-purple-400 font-semibold">{act.metadata.fileName}</span> to{" "}
            {taskTitle}.
          </p>
        );
      default:
        return (
          <p className="text-xs text-slate-350">
            {name} performed action: {act.action}
          </p>
        );
    }
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl bg-slate-900/40 p-4 border border-slate-800/80">
      <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450">
          Board Activity
        </h3>
        <button
          onClick={fetchActivity}
          className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold transition"
        >
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[400px] flex flex-col gap-4 pr-1">
        {activities.map((act) => (
          <div key={act._id} className="flex gap-2.5 items-start">
            <div className="rounded-lg bg-slate-800 p-1.5 flex-shrink-0 mt-0.5 border border-slate-700/50">
              {getActivityIcon(act.action)}
            </div>
            <div className="flex-1 flex flex-col gap-0.5">
              {formatActivityMessage(act)}
              <span className="text-[9px] text-slate-500 font-medium">
                {getRelativeTime(act.createdAt)}
              </span>
            </div>
          </div>
        ))}

        {activities.length === 0 && !loading && (
          <div className="text-center py-6 text-xs text-slate-500 italic">
            No activity logs yet
          </div>
        )}

        {loading && (
          <div className="text-center py-4 text-xs text-slate-500">
            Loading logs...
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
