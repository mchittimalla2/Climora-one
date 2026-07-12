import { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
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

const viteBase = import.meta.env.BASE_URL || "/";
const routerBase = viteBase === "/" ? "/" : viteBase.replace(/\/$/, "");

function BuyNowRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (event) => {
      const buyNowButton = event.target.closest(".buy-btn");
      if (!buyNowButton || buyNowButton.disabled) return;

      // Store adds the selected quantity to the shared cart first.
      // Open checkout immediately afterwards with the updated cart.
      window.setTimeout(() => navigate("/checkout"), 80);
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
        <BuyNowRedirect />
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
