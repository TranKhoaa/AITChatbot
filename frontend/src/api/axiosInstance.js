import axios from "axios";
import store from "../app/store"; 
import { setCredentials, logout } from "../features/auth/authSlice";

const axiosInstance = axios.create({
  baseURL: "http://192.168.241.94:8000/api/v1/",
  withCredentials: true, // Bắt buộc để gửi cookie
});

// Đính access_token nếu có
axiosInstance.interceptors.request.use((config) => {
  const state = store.getState();
  if (state.auth.token) {
    config.headers.Authorization = `Bearer ${state.auth.token}`;
  }
  return config;
});

// Tự động refresh nếu bị 401
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
        const res = await axios.get("http://192.168.241.94:8000/api/v1/auth/refresh", {
          withCredentials: true,
        });

        store.dispatch(
          setCredentials({
            id: res.data.id,
            name: res.data.name,
            role: res.data.role,
            access_token: res.data.access_token,
          })
        );

        originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
        return axiosInstance(originalRequest);
      } catch (err) {
        store.dispatch(logout());
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
