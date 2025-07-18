import axiosInstance from "../../api/axiosInstance";

export const signupUser = async (credentials) => {
  const res = await axiosInstance.post("auth/signup/user", credentials);
  return res.data;
};

export const signupAdmin = async (credentials) => {
  const res = await axiosInstance.post("auth/signup/admin", credentials);
  return res.data;
};

export const loginUser = async (credentials) => {
  const res = await axiosInstance.post("auth/login/user", credentials);
  return res.data;
};

export const loginAdmin = async (credentials) => {
  const res = await axiosInstance.post("auth/login/admin", credentials);
  return res.data;
};

export const logoutUser = async () => {
  await axiosInstance.post("auth/logout"); // Backend sẽ xóa cookie
};
