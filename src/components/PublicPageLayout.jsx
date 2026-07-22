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
    </div>
  );
}
