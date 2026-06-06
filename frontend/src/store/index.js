import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../slices/authSlice.js";
import boardReducer from "../slices/boardSlice.js";
import taskReducer from "../slices/taskSlice.js";
import socketReducer from "../slices/socketSlice.js";
import memberReducer from "../slices/memberSlice.js";

const store = configureStore({
  reducer: {
    auth: authReducer,
    board: boardReducer,
    task: taskReducer,
    socket: socketReducer,
    member: memberReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Prevents errors with Date objects in states
    }),
});

export default store;
