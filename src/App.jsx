import { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import StoreRoute from "./components/StoreRoute";
import Contact from "./pages/Contact";
import ReturnPolicy from "./pages/ReturnPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import TrackOrder from "./pages/TrackOrder";
import Checkout from "./pages/Checkout";
import Admin from "./pages/admin/Admin";
import Orders from "./pages/admin/Orders";
import Reports from "./pages/admin/Reports";
import Products from "./pages/admin/products/Products";

import { CartProvider } from "./context/CartContext";
import "./App.css";
import "./styles/brand-experience.css";
import "./styles/store-v2-polish.css";
import "./styles/public-pages.css";
import "./styles/navigation-fixes.css";
import "./styles/product-details.css";
import "./styles/admin-premium.css";
import "./styles/admin-legacy-polish.css";

const viteBase = import.meta.env.BASE_URL || "/";
const routerBase = viteBase === "/" ? "/" : viteBase.replace(/\/$/, "");

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}

function StoreInteractionEnhancements() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (event) => {
      const buyNowButton = event.target.closest(".buy-btn");
      if (buyNowButton && !buyNowButton.disabled) {
        window.setTimeout(() => navigate("/checkout"), 80);
        return;
      }

      const detailImage = event.target.closest(".main-image-box img");
      if (detailImage && window.matchMedia("(min-width: 641px)").matches) {
        detailImage.closest(".main-image-box")?.classList.toggle("is-zoomed");
        return;
      }

      const productImage = event.target.closest(".v2-product-image-wrap");
      if (!productImage) return;

      const productCard = productImage.closest(".v2-product-card");
      const detailsButton = productCard?.querySelector(".v2-product-meta button");

      if (detailsButton && !detailsButton.disabled) {
        detailsButton.click();
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [navigate]);

  return null;
}

function App() {
  return (
    <CartProvider>
      <BrowserRouter basename={routerBase}>
        <ScrollToTop />
        <StoreInteractionEnhancements />
        <Routes>
          <Route path="/" element={<StoreRoute />} />
          <Route path="/home" element={<StoreRoute />} />
          <Route path="/products" element={<StoreRoute />} />
          <Route path="/cart" element={<StoreRoute />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/return-policy" element={<ReturnPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />

          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/orders" element={<Orders />} />
          <Route path="/admin/products" element={<Products />} />
          <Route path="/admin/reports" element={<Reports />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
