import { Link, useNavigate } from "react-router-dom";
import { useCustomer } from "../context/CustomerContext";

export default function CustomerAccountControl() {
  const { customer, logout } = useCustomer();
  const navigate = useNavigate();

  if (!customer) {
    return <Link className="customer-account-link" to="/account/auth">Sign In</Link>;
  }

  const displayName = customer.username || customer.name?.split(" ")[0] || "Account";

  const signOut = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <details className="customer-account-menu">
      <summary>{displayName}</summary>
      <div>
        <Link to="/account">My Account</Link>
        <Link to="/account/orders">My Orders</Link>
        <button type="button" onClick={signOut}>Logout</button>
      </div>
    </details>
  );
}
