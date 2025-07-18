import { createSlice } from "@reduxjs/toolkit";

const storedAuth = localStorage.getItem("auth");
const initialState = storedAuth
  ? { ...JSON.parse(storedAuth), status: "succeeded", error: null }
  : { 
      user: null, 
      token: null, 
      refreshToken: null, 
      status: "idle", 
      error: null 
    };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { id, name, access_token, refresh_token, role } = action.payload;
      state.user = { id, name, role };
      state.token = access_token;
      state.refreshToken = refresh_token;
      state.status = "succeeded";

      localStorage.setItem("auth", JSON.stringify({
        user: { id, name, role },
        token: access_token,
        refreshToken: refresh_token,
      }));
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.status = "failed";
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem("auth");
    },
  },
});

export const { setCredentials, setError, logout } = authSlice.actions;
export default authSlice.reducer;
