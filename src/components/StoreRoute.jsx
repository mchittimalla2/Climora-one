import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import Store from "../pages/Store";

const routeSections = {
  "/home": "home",
  "/products": "products",
  "/cart": "cart",
};

function StoreRoute() {
  const { pathname } = useLocation();

  useEffect(() => {
    const sectionId = routeSections[pathname];

    if (!sectionId) {
      window.scrollTo({
        top: 0,
        behavior: "auto",
      });

      return undefined;
    }

    const timer = window.setTimeout(() => {
      document
        .getElementById(sectionId)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return <Store />;
}

export default StoreRoute;