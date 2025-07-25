import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const { token, user } = useSelector((state) => state.auth);
  if(user.role !== "user") {
    return <Navigate to="/unauthorized"/>;
  }
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

export default PrivateRoute;
