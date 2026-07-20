import { Navigate, useLocation } from "react-router-dom";
import { useCustomer } from "../context/CustomerContext";
export default function ProtectedCustomerRoute({ children }) { const { customer } = useCustomer(); const location = useLocation(); return customer ? children : <Navigate to="/account/auth" replace state={{ from: location.pathname }} />; }
