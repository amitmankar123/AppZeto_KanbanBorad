import { createSlice } from "@reduxjs/toolkit";

const memberSlice = createSlice({
  name: "member",
  initialState: {
    typingMembers: {}, // key: taskId, value: userName (or multiple editing)
  },
  reducers: {
    setMemberTyping: (state, action) => {
      const { taskId, userName } = action.payload;
      state.typingMembers[taskId] = userName;
    },
    clearMemberTyping: (state, action) => {
      const { taskId } = action.payload;
      delete state.typingMembers[taskId];
    },
  },
});

export const { setMemberTyping, clearMemberTyping } = memberSlice.actions;
export default memberSlice.reducer;
