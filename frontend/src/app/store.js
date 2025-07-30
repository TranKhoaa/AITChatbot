import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import fileReducer from "../features/filesSlice";

const authFromStorage = localStorage.getItem("auth")
  ? JSON.parse(localStorage.getItem("auth"))
  : {
    user: null,
    token: null,
    refreshToken: null,
    status: "idle",
    error: null,
  };

const preloadedState = {
  auth: authFromStorage,
};

const store = configureStore({
  reducer: {
    auth: authReducer,
    files: fileReducer,
  },
  preloadedState,
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
