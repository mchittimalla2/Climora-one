import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import "../styles/impact-promise.css";

const promiseImage = `${import.meta.env.BASE_URL}images/our-promise-illustration.png`;

function OurPromiseImage({ variant = "checkout" }) {
  return (
    <section className={`impact-promise impact-promise--${variant}`} aria-label="Climoraone social impact promise">
      <img
        className="impact-promise__image"
        src={promiseImage}
        alt="Climoraone supports rural women and skilled artisans as trusted partners"
        loading={variant === "checkout" ? "eager" : "lazy"}
      />
    </section>
  );
}

function ImpactPromiseMounts() {
  const [checkoutTarget, setCheckoutTarget] = useState(null);
  const [cartTarget, setCartTarget] = useState(null);

  useEffect(() => {
    const findTargets = () => {
      setCheckoutTarget(document.querySelector(".checkout-trust-list"));
      setCartTarget(document.querySelector(".inline-cart-summary"));
    };

    findTargets();
    const observer = new MutationObserver(findTargets);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {checkoutTarget && createPortal(<OurPromiseImage variant="checkout" />, checkoutTarget)}
      {cartTarget && createPortal(<OurPromiseImage variant="cart" />, cartTarget)}
    </>
  );
}

export default ImpactPromiseMounts;
