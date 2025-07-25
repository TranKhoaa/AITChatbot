import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const { token, user } = useSelector((state) => state.auth);
  if (user && user.role !== "admin") {
    return <Navigate to="/unauthorized" />;
  }
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

export default AdminRoute;
