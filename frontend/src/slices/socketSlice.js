import { createSlice } from "@reduxjs/toolkit";

const socketSlice = createSlice({
  name: "socket",
  initialState: {
    isConnected: false,
  },
  reducers: {
    setConnected: (state, action) => {
      state.isConnected = action.payload;
    },
  },
});

export const { setConnected } = socketSlice.actions;
export default socketSlice.reducer;
