import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import CustomerAccountControl from "./CustomerAccountControl";

export function PublicPageLayout({ eyebrow, title, description, children, className = "" }) {
  return (
    <div className={`public-page ${className}`.trim()}>
      <header className="public-header">
        <Link to="/" className="public-brand" aria-label="Climoraone home">
          <BrandLogo className="public-brand-logo" />
        </Link>
        <nav className="public-nav" aria-label="Main navigation">
          <Link to="/">Home</Link>
          <Link to="/products">Collection</Link>
          <Link to="/track-order">Track Order</Link>
          <Link to="/contact">Contact</Link>
        </nav>
        <div className="public-header-actions"><CustomerAccountControl /><Link to="/" className="public-store-link">Back to Store</Link></div>
      </header>

      <main className="public-main">
        <section className="public-hero">
          <span className="public-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </section>
        <div className="public-content">{children}</div>
      </main>

      <footer className="public-footer">
        <div className="public-footer-brand">
          <BrandLogo className="public-footer-logo" />
          <p>Premium handcrafted décor rooted in timeless Indian craftsmanship.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/products">Collection</Link>
          <Link to="/track-order">Track Order</Link>
        </div>
        <div>
          <h4>Customer Care</h4>
          <Link to="/return-policy">Return Policy</Link>
          <Link to="/shipping-policy">Shipping Policy</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <small>© 2026 Climoraone. All rights reserved.</small>
      </footer>
    </div>
  );
}
