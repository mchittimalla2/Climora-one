import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import "../styles/impact-promise.css";

function OurPromiseCard({ variant = "checkout" }) {
  return (
    <section className={`impact-promise impact-promise--${variant}`} aria-label="Climoraone social impact promise">
      <div className="impact-promise__art" aria-hidden="true">
        <span className="impact-promise__sun" />
        <span className="impact-promise__woman">◕</span>
        <span className="impact-promise__craft">✦</span>
        <span className="impact-promise__leaf">⌁</span>
      </div>
      <div className="impact-promise__content">
        <span className="impact-promise__eyebrow">Our Promise</span>
        <h3>Every purchase carries a purpose.</h3>
        <p>
          Our rural women and skilled artisans are not just suppliers—they are our partners.
          Every order helps create meaningful work, sustain traditional craftsmanship and build
          stronger livelihoods across India.
        </p>
        <div className="impact-promise__pill-grid">
          <span>♡ Rural women</span>
          <span>✦ Artisan partners</span>
          <span>⌁ Sustainable craft</span>
        </div>
        <small>Thank you for choosing products made with skill, dignity and care.</small>
      </div>
    </section>
  );
}

function ImpactPromiseMounts() {
  const [checkoutTarget, setCheckoutTarget] = useState(null);
  const [footerTarget, setFooterTarget] = useState(null);

  useEffect(() => {
    const findTargets = () => {
      setCheckoutTarget(document.querySelector(".checkout-trust-list"));
      setFooterTarget(document.querySelector(".footer-content"));
    };

    findTargets();
    const observer = new MutationObserver(findTargets);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {checkoutTarget && createPortal(<OurPromiseCard variant="checkout" />, checkoutTarget)}
      {footerTarget && createPortal(<OurPromiseCard variant="footer" />, footerTarget)}
    </>
  );
}

export default ImpactPromiseMounts;
