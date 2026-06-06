import React, { useState, useEffect, useRef } from "react";
import { X, Calendar, MessageSquare, Paperclip, Trash2, Send, Clock, UserCheck, AlertTriangle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { createNewTask, updateExistingTask, deleteExistingTask } from "../slices/taskSlice.js";
import {
  emitTaskCreated,
  emitTaskUpdated,
  emitTaskDeleted,
  emitTypingStart,
  emitTypingStop,
} from "../socket/socketService.js";
import API from "../services/api.js";

const TaskModal = ({ task, initialStatus, onClose }) => {
  const dispatch = useDispatch();
  const { currentBoard } = useSelector((state) => state.board);
  const { user } = useSelector((state) => state.auth);

  const isEditMode = !!task;

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [status, setStatus] = useState("Todo");
  const [error, setError] = useState(null);

  // Comments & Attachments
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Typing timer ref
  const typingTimeoutRef = useRef(null);

  // Load task details if editing
  useEffect(() => {
    setError(null);
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setPriority(task.priority || "Medium");
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
      setAssignedTo(task.assignedTo?._id || "");
      setStatus(task.status || "Todo");

      // Fetch comments & attachments
      fetchComments();
      fetchAttachments();
    } else {
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setDueDate("");
      setAssignedTo("");
      setStatus(initialStatus || "Todo");
    }

    return () => {
      // Clear typing indicator on unmount
      if (isEditMode && currentBoard) {
        emitTypingStop(currentBoard._id, user.name, task._id);
      }
    };
  }, [task, initialStatus]);

  // Fetch comments from API
  const fetchComments = async () => {
    try {
      const res = await API.get(`/comments/${task._id}`);
      setComments(res.data);
    } catch (err) {
      console.error("Failed to fetch comments", err);
    }
  };

  // Fetch attachments from API
  const fetchAttachments = async () => {
    try {
      const res = await API.get(`/attachments/${task._id}`);
      setAttachments(res.data);
    } catch (err) {
      console.error("Failed to fetch attachments", err);
    }
  };

  // Typing state emitter
  const handleTextChange = (fieldValue, setter) => {
    setter(fieldValue);
    if (!isEditMode || !currentBoard) return;

    // Emit typing start
    emitTypingStart(currentBoard._id, user.name, task._id);

    // Reset 3s timeout to stop typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop(currentBoard._id, user.name, task._id);
    }, 3000);
  };

  // Save Task
  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);

    const taskData = {
      boardId: currentBoard._id,
      title: title.trim(),
      description,
      priority,
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
      status,
    };

    if (isEditMode) {
      // Edit Task
      const result = await dispatch(updateExistingTask({ id: task._id, taskData }));
      if (result.meta.requestStatus === "fulfilled") {
        emitTaskUpdated(currentBoard._id, result.payload);
        onClose();
      } else {
        setError(result.payload || "Failed to update task");
      }
    } else {
      // Create Task
      const result = await dispatch(createNewTask(taskData));
      if (result.meta.requestStatus === "fulfilled") {
        emitTaskCreated(currentBoard._id, result.payload);
        onClose();
      } else {
        setError(result.payload || "Failed to create task");
      }
    }
  };

  // Delete Task
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    const result = await dispatch(deleteExistingTask(task._id));
    if (result.meta.requestStatus === "fulfilled") {
      emitTaskDeleted(currentBoard._id, task._id);
    }
    onClose();
  };

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await API.post("/comments", {
        taskId: task._id,
        content: newComment,
      });
      setComments([...comments, res.data]);
      setNewComment("");
      
      // Let other room users sync
      emitTaskUpdated(currentBoard._id, task);
    } catch (err) {
      console.error("Failed to add comment", err);
    }
  };

  // File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("taskId", task._id);

    setUploading(true);
    try {
      const res = await API.post("/attachments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAttachments([res.data, ...attachments]);
      emitTaskUpdated(currentBoard._id, task);
    } catch (err) {
      console.error("Upload error", err);
      alert(err.response?.data?.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 className="text-lg font-bold text-white">
            {isEditMode ? "Task Details" : "Create New Task"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Main Edit Form */}
          <form onSubmit={handleSave} className="md:col-span-3 flex flex-col gap-4">
            {error && (
              <div className="rounded-xl bg-rose-500/10 p-3.5 border border-rose-500/20 text-xs text-rose-400 font-medium flex items-center gap-1.5">
                <AlertTriangle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTextChange(e.target.value, setTitle)}
                className="w-full rounded-xl bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 border border-slate-700/50 focus:border-purple-500 focus:outline-none"
                placeholder="What needs to be done?"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => handleTextChange(e.target.value, setDescription)}
                className="w-full rounded-xl bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 border border-slate-700/50 focus:border-purple-500 focus:outline-none h-28 resize-none"
                placeholder="Add more details about this task..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 px-4 py-2.5 text-sm text-slate-100 border border-slate-700/50 focus:border-purple-500 focus:outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 px-4 py-2.5 text-sm text-slate-100 border border-slate-700/50 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Assignee
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 px-4 py-2.5 text-sm text-slate-100 border border-slate-700/50 focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {currentBoard?.members?.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 px-4 py-2.5 text-sm text-slate-100 border border-slate-700/50 focus:border-purple-500 focus:outline-none"
                >
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4 mt-auto border-t border-slate-850">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-purple-500 hover:shadow-purple-500/20 transition"
              >
                {isEditMode ? "Save Changes" : "Create Task"}
              </button>
              
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/20 transition flex items-center gap-1.5"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </form>

          {/* Comments & Attachments Sidebar (Only in Edit Mode) */}
          <div className="md:col-span-2 border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-6 flex flex-col gap-6 overflow-hidden max-h-[70vh]">
            {isEditMode ? (
              <>
                {/* File Attachments */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Paperclip size={12} />
                      <span>Attachments</span>
                    </h3>
                    
                    {/* Upload button wrapper */}
                    <label className="text-xs text-purple-400 hover:text-purple-300 font-medium cursor-pointer transition">
                      <span>{uploading ? "Uploading..." : "Add File"}</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                    {attachments.map((file) => (
                      <a
                        key={file._id}
                        href={`http://localhost:5000${file.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-lg bg-slate-800/60 p-2 border border-slate-700/30 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition overflow-hidden"
                      >
                        <div className="rounded bg-slate-700 p-1 text-slate-300 flex-shrink-0">
                          <Paperclip size={10} />
                        </div>
                        <span className="truncate flex-1">{file.fileName}</span>
                      </a>
                    ))}
                    {attachments.length === 0 && (
                      <p className="text-[11px] text-slate-500 italic">No attachments yet.</p>
                    )}
                  </div>
                </div>

                {/* Comments Timeline */}
                <div className="flex flex-col gap-3 flex-1 overflow-hidden">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <MessageSquare size={12} />
                    <span>Comments</span>
                  </h3>

                  {/* Comment Timeline list */}
                  <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
                    {comments.map((comment) => (
                      <div key={comment._id} className="flex gap-2.5 items-start">
                        <img
                          src={comment.userId?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.userId?.name}`}
                          alt={comment.userId?.name}
                          className="h-6 w-6 rounded-full object-cover flex-shrink-0 mt-0.5"
                        />
                        <div className="rounded-xl bg-slate-850 p-2.5 border border-slate-750 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-slate-200 truncate">
                              {comment.userId?.name}
                            </span>
                            <span className="text-[9px] text-slate-500 flex items-center gap-0.5">
                              <Clock size={8} />
                              {new Date(comment.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-normal break-words">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-[11px] text-slate-500 italic py-4">No comments yet.</p>
                    )}
                  </div>

                  {/* Send Comment Form */}
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 rounded-xl bg-slate-800 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 border border-slate-700/50 focus:border-purple-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-purple-600 p-2 text-white hover:bg-purple-500 transition"
                    >
                      <Send size={12} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-center p-4">
                <p className="text-xs text-slate-500 leading-relaxed max-w-[150px]">
                  Submit the form to create this task and enable attachments, file uploads, and comments.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
