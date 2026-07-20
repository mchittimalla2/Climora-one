import { Link } from "react-router-dom";
import { useCustomer } from "../context/CustomerContext";
export default function CustomerAccountControl() {
  const { customer, logout } = useCustomer();
  if (!customer) return <Link className="customer-account-link" to="/account/auth">Sign In</Link>;
  return <details className="customer-account-menu"><summary>Hello, {customer.name?.split(" ")[0] || "Customer"}</summary><div><Link to="/account">My Account</Link><Link to="/account/orders">My Orders</Link><Link to="/account/profile">Profile</Link><Link to="/account/security">Change Password</Link><button type="button" onClick={logout}>Logout</button></div></details>;
}
