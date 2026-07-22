import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

import { BrandLogo } from "./BrandLogo";
import CustomerAccountControl from "./CustomerAccountControl";
import "../styles/storefront-polish.css";

function FooterContent() {
  return (
    <div className="polished-footer-grid">
      <section className="polished-footer-brand">
        <BrandLogo className="footer-logo" />
        <p>Premium handcrafted décor bringing timeless Indian craftsmanship into beautiful homes.</p>
      </section>

      <section>
        <h4>Customer</h4>
        <Link to="/account">My Account</Link>
        <Link to="/track-order">Track Order</Link>
        <Link to="/shipping-policy">Shipping Policy</Link>
        <Link to="/return-policy">Return Policy</Link>
      </section>

      <section>
        <h4>Legal</h4>
        <Link to="/privacy-policy">Privacy Policy</Link>
        <Link to="/terms">Terms of Use</Link>
      </section>

      <section>
        <h4>About Climoraone</h4>
        <Link to="/contact">About Us</Link>
        <a href="/#craft">Our Mission</a>
        <a href="/#craft">Support Rural Women</a>
      </section>

      <div className="polished-footer-bottom">© 2026 Climoraone. Handmade with purpose in India.</div>
    </div>
  );
}

export default function StorefrontPolish() {
  const [footerTarget, setFooterTarget] = useState(null);

  useEffect(() => {
    const applyPolish = () => {
      const desktopNav = document.querySelector(".v2-nav");
      if (desktopNav) {
        Array.from(desktopNav.children).forEach((node) => {
          const label = node.textContent?.trim();
          if (label === "Our Craft" || label === "Contact") node.classList.add("storefront-hidden-nav-item");
        });

        if (!desktopNav.querySelector("[data-polished-track-order]")) {
          const cart = desktopNav.querySelector(".v2-cart-link");
          const track = document.createElement("a");
          track.href = "/track-order";
          track.textContent = "Track Order";
          track.dataset.polishedTrackOrder = "true";
          desktopNav.insertBefore(track, cart || null);
        }
      }

      const mobileMenu = document.querySelector(".v2-mobile-menu");
      if (mobileMenu) {
        Array.from(mobileMenu.children).forEach((node) => {
          const label = node.textContent?.trim();
          if (label === "Our Craft" || label === "Contact") node.classList.add("storefront-hidden-nav-item");
        });
      }

      const footer = document.querySelector(".footer-content");
      if (footer) {
        footer.classList.add("footer-content--polished");
        Array.from(footer.children).forEach((child) => {
          if (!child.classList.contains("polished-footer-grid")) child.classList.add("storefront-original-footer-item");
        });
        setFooterTarget(footer);
      }
    };

    applyPolish();
    const observer = new MutationObserver(applyPolish);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {footerTarget && createPortal(<FooterContent />, footerTarget)}
      <div className="storefront-mobile-account-portal" aria-hidden="true"><CustomerAccountControl /></div>
    </>
  );
}
