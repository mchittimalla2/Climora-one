import { NavLink } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import "../styles/admin-premium.css";

const links = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/reports", label: "Reports" },
];

export default function AdminLayout({ eyebrow, title, description, actions, children }) {
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
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink to="/" className="admin-store-link">View Store ↗</NavLink>
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
