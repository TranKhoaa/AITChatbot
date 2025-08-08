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
  try {
    const res = await axiosInstance.post("auth/login/user", credentials);
    return res.data;
  } catch (error) {
    // console.log("Login error in auth: ", error);
    throw error;
  }
};

export const loginAdmin = async (credentials) => {
  try {
    const res = await axiosInstance.post("auth/login/admin", credentials);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  await axiosInstance.post("auth/logout"); // Backend sẽ xóa cookie
};
