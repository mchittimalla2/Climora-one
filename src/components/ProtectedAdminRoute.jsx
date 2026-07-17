import { Navigate, useLocation } from "react-router-dom";
import { getAdminToken } from "../auth/adminAuth";

export default function ProtectedAdminRoute({ children }) {
  const location = useLocation();

  if (!getAdminToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
