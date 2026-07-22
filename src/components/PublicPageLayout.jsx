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
        </nav>
        <div className="public-header-actions">
          <CustomerAccountControl />
          <Link to="/" className="public-store-link">Back to Store</Link>
        </div>
      </header>

      <main className="public-main">
        <section className="public-hero">
          <span className="public-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </section>
        <div className="public-content">{children}</div>
      </main>

      <footer className="footer shared-store-footer">
        <div className="footer-content">
          <div className="footer-brand-column">
            <BrandLogo className="footer-logo" />
            <p>Premium handcrafted décor bringing timeless Indian craftsmanship into beautiful homes.</p>
          </div>
          <div className="footer-column">
            <h4>Customer</h4>
            <Link to="/account">My Account</Link>
            <Link to="/track-order">Track Order</Link>
            <Link to="/shipping-policy">Shipping Policy</Link>
            <Link to="/return-policy">Return Policy</Link>
          </div>
          <div className="footer-column">
            <h4>Legal</h4>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms">Terms of Use</Link>
          </div>
          <div className="footer-column">
            <h4>About Climoraone</h4>
            <Link to="/#craft">About Us</Link>
            <Link to="/#craft">Our Mission</Link>
            <Link to="/#craft">Support Rural Women</Link>
          </div>
        </div>
        <div className="footer-bottom">© 2026 Climoraone. Handmade with purpose in India.</div>
      </footer>
    </div>
  );
}
