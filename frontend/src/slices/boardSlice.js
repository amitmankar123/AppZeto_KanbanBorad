import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:5000/api/boards";

const getHeaderConfig = (state) => {
  const token = state.auth.token;
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const fetchBoards = createAsyncThunk(
  "board/fetchAll",
  async (_, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get(API_URL, getHeaderConfig(getState()));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchBoardById = createAsyncThunk(
  "board/fetchById",
  async (id, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`, getHeaderConfig(getState()));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createNewBoard = createAsyncThunk(
  "board/create",
  async (boardTitle, { getState, rejectWithValue }) => {
    try {
      const response = await axios.post(
        API_URL,
        { title: boardTitle },
        getHeaderConfig(getState())
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateBoardTitle = createAsyncThunk(
  "board/update",
  async ({ id, title }, { getState, rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_URL}/${id}`,
        { title },
        getHeaderConfig(getState())
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteActiveBoard = createAsyncThunk(
  "board/delete",
  async (id, { getState, rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${id}`, getHeaderConfig(getState()));
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const inviteUserToBoard = createAsyncThunk(
  "board/invite",
  async ({ boardId, email }, { getState, rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/${boardId}/invite`,
        { email },
        getHeaderConfig(getState())
      );
      return response.data; // returns updated board with new member list
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const boardSlice = createSlice({
  name: "board",
  initialState: {
    boards: [],
    currentBoard: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearCurrentBoard: (state) => {
      state.currentBoard = null;
    },
    syncBoardMembers: (state, action) => {
      // Syncing online/offline status from socket
      if (state.currentBoard && state.currentBoard.members) {
        state.currentBoard.members = state.currentBoard.members.map((member) =>
          member._id === action.payload.userId
            ? { ...member, isOnline: action.payload.isOnline }
            : member
        );
      }
    },
    refreshBoardFromSocket: (state, action) => {
      if (state.currentBoard && state.currentBoard._id === action.payload._id) {
        state.currentBoard = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchBoards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.boards = action.payload;
      })
      .addCase(fetchBoards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch By Id
      .addCase(fetchBoardById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBoardById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBoard = action.payload;
      })
      .addCase(fetchBoardById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createNewBoard.fulfilled, (state, action) => {
        state.boards.unshift(action.payload);
      })
      // Update
      .addCase(updateBoardTitle.fulfilled, (state, action) => {
        state.currentBoard = action.payload;
        state.boards = state.boards.map((b) =>
          b._id === action.payload._id ? action.payload : b
        );
      })
      // Delete
      .addCase(deleteActiveBoard.fulfilled, (state, action) => {
        state.boards = state.boards.filter((b) => b._id !== action.payload);
        if (state.currentBoard && state.currentBoard._id === action.payload) {
          state.currentBoard = null;
        }
      })
      // Invite Member
      .addCase(inviteUserToBoard.fulfilled, (state, action) => {
        state.currentBoard = action.payload;
      });
  },
});

export const { clearCurrentBoard, syncBoardMembers, refreshBoardFromSocket } =
  boardSlice.actions;
export default boardSlice.reducer;
