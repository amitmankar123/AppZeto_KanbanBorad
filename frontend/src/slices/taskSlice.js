import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:5000/api/tasks";

const getHeaderConfig = (state) => {
  const token = state.auth.token;
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const fetchTasksForBoard = createAsyncThunk(
  "task/fetchForBoard",
  async (boardId, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${boardId}`, getHeaderConfig(getState()));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createNewTask = createAsyncThunk(
  "task/create",
  async (taskData, { getState, rejectWithValue }) => {
    try {
      const response = await axios.post(API_URL, taskData, getHeaderConfig(getState()));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateExistingTask = createAsyncThunk(
  "task/update",
  async ({ id, taskData }, { getState, rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, taskData, getHeaderConfig(getState()));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteExistingTask = createAsyncThunk(
  "task/delete",
  async (id, { getState, rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${id}`, getHeaderConfig(getState()));
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const moveTaskOnServer = createAsyncThunk(
  "task/move",
  async ({ taskId, destinationStatus, destinationIndex }, { getState, rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_URL}/${taskId}/move`,
        { destinationStatus, destinationIndex },
        getHeaderConfig(getState())
      );
      return response.data; // { message, task }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const taskSlice = createSlice({
  name: "task",
  initialState: {
    tasks: [],
    searchQuery: "",
    filterPriority: "All",
    filterAssignedTo: "All",
    filterDueDate: "All",
    isLoading: false,
    error: null,
  },
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setFilterPriority: (state, action) => {
      state.filterPriority = action.payload;
    },
    setFilterAssignedTo: (state, action) => {
      state.filterAssignedTo = action.payload;
    },
    setFilterDueDate: (state, action) => {
      state.filterDueDate = action.payload;
    },
    // Optimistic Update for DND
    moveTaskOptimistic: (state, action) => {
      const { taskId, destinationStatus, destinationIndex } = action.payload;
      
      const movedTask = state.tasks.find((t) => t._id === taskId);
      if (!movedTask) return;

      const sourceStatus = movedTask.status;

      // Extract tasks that are NOT the moved task
      const restTasks = state.tasks.filter((t) => t._id !== taskId);

      // Separate into destination status, source status, and others
      const destColumn = restTasks.filter((t) => t.status === destinationStatus);
      const otherColumns = restTasks.filter((t) => t.status !== destinationStatus);

      // Add the moved task into the destination column at destinationIndex
      const updatedDestColumn = [...destColumn];
      // Bound index check
      const idx = Math.max(0, Math.min(destinationIndex, updatedDestColumn.length));
      
      // Update moved task properties locally
      const updatedTask = {
        ...movedTask,
        status: destinationStatus,
      };

      updatedDestColumn.splice(idx, 0, updatedTask);

      // Reset positions sequentially for the destination column
      const finalDestColumn = updatedDestColumn.map((task, index) => ({
        ...task,
        position: index,
      }));

      // If moved across columns, also fix position sequencing in the source column
      let finalSourceColumn = [];
      let finalOthers = otherColumns;
      
      if (sourceStatus !== destinationStatus) {
        const sourceColumn = otherColumns.filter((t) => t.status === sourceStatus);
        finalOthers = otherColumns.filter((t) => t.status !== sourceStatus);
        
        finalSourceColumn = sourceColumn.map((task, index) => ({
          ...task,
          position: index,
        }));
      }

      // Merge everyone back together
      state.tasks = [...finalOthers, ...finalDestColumn, ...finalSourceColumn].sort(
        (a, b) => a.position - b.position
      );
    },
    // Live synchronization updates from sockets
    addTaskFromSocket: (state, action) => {
      const exists = state.tasks.some((t) => t._id === action.payload._id);
      if (!exists) {
        state.tasks.push(action.payload);
      }
    },
    updateTaskFromSocket: (state, action) => {
      state.tasks = state.tasks.map((t) =>
        t._id === action.payload._id ? action.payload : t
      );
    },
    removeTaskFromSocket: (state, action) => {
      state.tasks = state.tasks.filter((t) => t._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tasks
      .addCase(fetchTasksForBoard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasksForBoard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasksForBoard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Task
      .addCase(createNewTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
      })
      // Update Task
      .addCase(updateExistingTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.map((t) =>
          t._id === action.payload._id ? action.payload : t
        );
      })
      // Delete Task
      .addCase(deleteExistingTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t._id !== action.payload);
      })
      // Move Task server completion
      .addCase(moveTaskOnServer.fulfilled, (state, action) => {
        const updatedTask = action.payload.task;
        state.tasks = state.tasks.map((t) =>
          t._id === updatedTask._id ? updatedTask : t
        );
      });
  },
});

export const {
  setSearchQuery,
  setFilterPriority,
  setFilterAssignedTo,
  setFilterDueDate,
  moveTaskOptimistic,
  addTaskFromSocket,
  updateTaskFromSocket,
  removeTaskFromSocket,
} = taskSlice.actions;

export default taskSlice.reducer;
