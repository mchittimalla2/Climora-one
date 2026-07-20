/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { clearCustomerSession, customerApi, getStoredCustomer, saveCustomerSession } from "../auth/customerAuth";

const CustomerContext = createContext(null);
export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(getStoredCustomer);
  useEffect(() => { const sync = () => setCustomer(getStoredCustomer()); window.addEventListener("customer-session-changed", sync); return () => window.removeEventListener("customer-session-changed", sync); }, []);
  const accept = (data) => { saveCustomerSession(data.token, data.customer); setCustomer(data.customer); };
  const logout = async () => { try { await customerApi("/api/customer/auth/logout", { method: "POST" }); } finally { clearCustomerSession(); setCustomer(null); } };
  return <CustomerContext.Provider value={{ customer, setCustomer, accept, logout }}>{children}</CustomerContext.Provider>;
}
export const useCustomer = () => useContext(CustomerContext);
