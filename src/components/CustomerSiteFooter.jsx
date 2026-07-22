import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";

export default function CustomerSiteFooter() {
  return (
    <footer className="customer-site-footer">
      <div className="customer-site-footer-grid">
        <div className="customer-site-footer-brand">
          <BrandLogo className="customer-site-footer-logo" />
          <p>Premium handcrafted décor bringing timeless Indian craftsmanship into beautiful homes.</p>
        </div>

        <div className="customer-site-footer-column">
          <h4>Explore</h4>
          <Link to="/products">Collection</Link>
          <Link to="/#craft">Our Craft</Link>
          <Link to="/track-order">Track Order</Link>
        </div>

        <div className="customer-site-footer-column">
          <h4>Customer Care</h4>
          <Link to="/return-policy">Return Policy</Link>
          <Link to="/shipping-policy">Shipping Policy</Link>
          <Link to="/contact">Contact Us</Link>
        </div>

        <div className="customer-site-footer-column">
          <h4>Legal</h4>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms">Terms of Use</Link>
        </div>

        <div className="customer-site-footer-column">
          <h4>About Climoraone</h4>
          <Link to="/#craft">About Us</Link>
          <Link to="/#craft">Our Mission</Link>
          <Link to="/#craft">Support Rural Women</Link>
        </div>
      </div>
      <div className="customer-site-footer-bottom">© 2026 Climoraone. Handmade with purpose in India.</div>
    </footer>
  );
}
