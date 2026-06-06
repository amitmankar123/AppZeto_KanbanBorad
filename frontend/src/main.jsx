import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store/index.js";
import { loadCurrentUser } from "./slices/authSlice.js";
import { initiateSocketConnection } from "./socket/socketService.js";
import "./index.css";
import App from "./App.jsx";

// Initial load check
const token = localStorage.getItem("token");

if (token) {
  // Dispatch load profile check
  store.dispatch(loadCurrentUser()).then((action) => {
    if (action.meta.requestStatus === "fulfilled" && action.payload) {
      // Connect Socket
      initiateSocketConnection(action.payload._id, store.dispatch);
    }
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
