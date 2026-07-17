import { useEffect } from "react";
import { getAdminToken } from "../auth/adminAuth";

const protectedPath = (url) => {
  const parsed = new URL(url, window.location.origin);
  const path = parsed.pathname;

  if (path === "/api/orders" || /^\/api\/orders\/[^/]+\/status$/.test(path)) {
    parsed.pathname = path.replace("/api/orders", "/api/admin/orders");
  } else if (path === "/api/products" || /^\/api\/products\/[^/]+$/.test(path)) {
    parsed.pathname = path.replace("/api/products", "/api/admin/products");
  }

  return parsed.toString();
};

export default function AdminFetchBridge() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = (input, init = {}) => {
      const rawUrl = typeof input === "string" ? input : input.url;
      const rewrittenUrl = protectedPath(rawUrl);
      const headers = new Headers(init.headers || (typeof input !== "string" ? input.headers : undefined));
      const token = getAdminToken();

      if (token && rewrittenUrl.includes("/api/admin/")) {
        headers.set("Authorization", `Bearer ${token}`);
        headers.set("Accept", "application/json");
      }

      return originalFetch(rewrittenUrl, { ...init, headers });
    };

    return () => { window.fetch = originalFetch; };
  }, []);

  return null;
}
