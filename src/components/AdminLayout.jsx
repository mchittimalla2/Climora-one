import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import { adminApi, clearAdminSession, getAdminUser } from "../auth/adminAuth";
import "../styles/admin-premium.css";
import "../styles/admin-user.css";

const links = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/reports", label: "Reports" },
];

const roleLabel = (role) => ({
  owner: "Owner",
  admin_editor: "Admin editor",
  break_glass: "Break-glass",
}[role] || "Administrator");

export default function AdminLayout({ eyebrow, title, description, actions, children }) {
  const navigate = useNavigate();
  const user = getAdminUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const closeMenu = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  const logout = async () => {
    try {
      setLoggingOut(true);
      await adminApi("/api/admin/auth/logout", { method: "POST" });
    } finally {
      clearAdminSession();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <NavLink to="/admin" className="admin-brand" aria-label="Climoraone admin dashboard">
          <BrandLogo className="admin-brand-logo" />
          <span className="admin-brand-copy">
            <small>Private workspace</small>
            <strong>Commerce Studio</strong>
          </span>
        </NavLink>

        <nav className="admin-nav" aria-label="Admin navigation">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => (isActive ? "active" : "")}>
              {link.label}
            </NavLink>
          ))}
          <a href="https://dev.climoraone.com" className="admin-store-link">View Store ↗</a>
          <div className="admin-user-menu" ref={menuRef}>
            <button type="button" className="admin-user-trigger" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen}>
              <span className="admin-user-avatar">{(user?.name || "A").charAt(0).toUpperCase()}</span>
              <span className="admin-user-copy"><strong>{user?.name || "Administrator"}</strong><small>{roleLabel(user?.role)}</small></span>
              <span aria-hidden="true">⌄</span>
            </button>
            {menuOpen && (
              <div className="admin-user-dropdown">
                <div className="admin-user-summary"><strong>{user?.name}</strong><span>{user?.email}</span><small>{roleLabel(user?.role)}</small></div>
                <NavLink to="/admin/profile" onClick={() => setMenuOpen(false)}>My profile</NavLink>
                <button type="button" onClick={logout} disabled={loggingOut}>{loggingOut ? "Signing out..." : "Logout"}</button>
              </div>
            )}
          </div>
        </nav>
      </header>

      <main className="admin-main">
        <section className="admin-hero">
          <div>
            <span className="admin-eyebrow">{eyebrow || "Climoraone administration"}</span>
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="admin-page-actions">{actions}</div>}
        </section>
        {children}
      </main>
    </div>
  );
}