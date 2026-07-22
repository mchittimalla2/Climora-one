import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import Store from "../pages/Store";

const routeSections = {
  "/home": "home",
  "/products": "products",
  "/cart": "cart",
};

function setReactInputValue(input, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  valueSetter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function StoreRoute() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const query = params.get("q")?.trim() || "";
    const shouldOpen = params.get("open") === "1";

    if (pathname === "/products" && query) {
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        const searchInput = document.querySelector(".store-v2 .v2-search");
        if (searchInput) {
          setReactInputValue(searchInput, query);
          document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });

          if (shouldOpen) {
            window.setTimeout(() => {
              const cards = [...document.querySelectorAll(".v2-product-card")];
              const matchingCard = cards.find((card) => card.querySelector("h3")?.textContent?.trim().toLowerCase() === query.toLowerCase());
              matchingCard?.querySelector(".v2-product-meta button")?.click();
            }, 250);
          }

          window.clearInterval(timer);
        } else if (attempts >= 20) {
          window.clearInterval(timer);
        }
      }, 100);

      return () => window.clearInterval(timer);
    }

    const sectionId = routeSections[pathname];

    if (!sectionId) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return undefined;
    }

    const timer = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [pathname, search]);

  return <Store />;
}

export default StoreRoute;
