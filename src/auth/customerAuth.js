import { API_BASE_URL } from "../config/api";

const TOKEN_KEY = "climoraone_customer_token";
const CUSTOMER_KEY = "climoraone_customer";

export const getCustomerToken = () => sessionStorage.getItem(TOKEN_KEY);
export const getStoredCustomer = () => { try { return JSON.parse(sessionStorage.getItem(CUSTOMER_KEY) || "null"); } catch { return null; } };
export const saveCustomerSession = (token, customer) => { sessionStorage.setItem(TOKEN_KEY, token); sessionStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer)); window.dispatchEvent(new Event("customer-session-changed")); };
export const clearCustomerSession = () => { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(CUSTOMER_KEY); window.dispatchEvent(new Event("customer-session-changed")); };

export async function customerApi(path, options = {}) {
  const headers = new Headers(options.headers || {}); headers.set("Accept", "application/json");
  const token = getCustomerToken(); if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 401) clearCustomerSession();
  return response;
}
