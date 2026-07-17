import { API_BASE_URL } from "../config/api";

const TOKEN_KEY = "climoraone_admin_token";
const USER_KEY = "climoraone_admin_user";

export const getAdminToken = () => sessionStorage.getItem(TOKEN_KEY);
export const getAdminUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
};

export const saveAdminSession = (token, user) => {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAdminSession = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
};

export async function adminApi(path, options = {}) {
  const token = getAdminToken();
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) clearAdminSession();
  return response;
}
