import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../api/axiosInstance";

export const fetchFiles = createAsyncThunk("files/fetchFiles", async () => {
  const res = await axiosInstance.get("admin/file/");
  return res.data;
});

const filesSlice = createSlice({
  name: "files",
  initialState: {
    files: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFiles.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.files = action.payload;
        state.loading = false;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      });
  },
});

export default filesSlice.reducer;
