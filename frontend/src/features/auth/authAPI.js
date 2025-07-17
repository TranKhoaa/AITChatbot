import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/v1/auth";

export const signupUser = async (credentials) => {
  try {
    console.log("Sending credentials:", credentials);
    const response = await axios.post(`${API_URL}/signup/user`, credentials);
    return response.data;
  } catch (error) {
    throw error.response.data || "Signup Failed";
  }
};
export const signupAdmin = async (credentials) => {
  try {
    console.log("Sending credentials:", credentials);
    const response = await axios.post(`${API_URL}/signup/admin`, credentials);
    return response.data;
  } catch (error) {
    throw error.response.data || "Signup Failed";
  }
};
export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login/user`, credentials);
    return response.data;
  } catch (error) {
    const message = error.response.data || "Login Failed";
    const err = new Error(message);
    err.status = error.status;
    throw err;
  }
};
export const loginAdmin = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login/admin`, credentials);
    return response.data;
  } catch (error) {
    throw error.response.data || "Login Failed";
  }
};
