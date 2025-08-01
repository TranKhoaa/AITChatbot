import axios from "axios";
import store from "../app/store";
import { setCredentials, logout } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";


const axiosInstance = axios.create({
  baseURL: "http://localhost:8000/api/v1/",
  withCredentials: true, // Gửi cookie (refresh_token) sang backend
});

// Gắn access_token nếu có vào request
axiosInstance.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: tự động refresh nếu bị 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login")
    ) {
      originalRequest._retry = true;

      try {
        const state = store.getState();
        const role = state.auth.role;
        const refreshUrl =
          role === "admin"
            ? "auth/refresh/admin"
            : "auth/refresh/user";

        // Gọi backend để lấy access_token mới bằng cookie
        const res = await axiosInstance.get(refreshUrl);

        // Lưu access_token mới vào Redux
        store.dispatch(
          setCredentials({
            id: res.data.id,
            name: res.data.name,
            role: res.data.role,
            access_token: res.data.access_token,
          })
        );

        // Gắn access_token mới vào header của request cũ
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;

        // Gửi lại request gốc với token mới
        return axiosInstance(originalRequest);
      } catch (err) {
        // Refresh thất bại → đăng xuất
        store.dispatch(logout());
        navigate("/login")
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
