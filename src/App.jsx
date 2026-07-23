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
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import AdminFetchBridge from "./components/AdminFetchBridge";
import ImpactPromiseMounts from "./components/ImpactPromiseMounts";
import CustomerSiteHeader from "./components/CustomerSiteHeader";
import CustomerSiteFooter from "./components/CustomerSiteFooter";
import Contact from "./pages/Contact";
import ReturnPolicy from "./pages/ReturnPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import TrackOrder from "./pages/TrackOrder";
import Checkout from "./pages/Checkout";
import Admin from "./pages/admin/Admin";
import AdminLogin from "./pages/admin/AdminLogin";
import Orders from "./pages/admin/Orders";
import Reports from "./pages/admin/Reports";
import Profile from "./pages/admin/Profile";
import RecycleBin from "./pages/admin/RecycleBin";
import Products from "./pages/admin/products/Products";
import CustomerAuth from "./pages/CustomerAuth";
import CustomerAccount from "./pages/CustomerAccount";
import ProtectedCustomerRoute from "./components/ProtectedCustomerRoute";

import { CartProvider } from "./context/CartContext";
import { CustomerProvider } from "./context/CustomerContext";
import "./App.css";
import "./styles/brand-experience.css";
import "./styles/store-v2-polish.css";
import "./styles/public-pages.css";
import "./styles/navigation-fixes.css";
import "./styles/product-details.css";
import "./styles/customer-site-shell.css";
import "./styles/customer-site-search.css";
import "./styles/customer-auth-polish.css";
import "./styles/customer-auth-mobile-fix.css";
import "./styles/admin-premium.css";
import "./styles/admin-legacy-polish.css";
import "./styles/layout-compact.css";

const viteBase = import.meta.env.BASE_URL || "/";
const routerBase = viteBase === "/" ? "/" : viteBase.replace(/\/$/, "");
const isAdminHost = window.location.hostname === "admin.climoraone.com" || window.location.hostname.startsWith("admin.");

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
    if (isAdminHost) return undefined;
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
      if (detailsButton && !detailsButton.disabled) detailsButton.click();
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [navigate]);
  return null;
}

function StoreSearchBridge() {
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search).get("q")?.trim();
    if (!query || !["/", "/home", "/products", "/cart"].includes(location.pathname)) return undefined;

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      const input = document.querySelector(".v2-search");
      if (!input) {
        if (attempts > 20) window.clearInterval(timer);
        return;
      }

      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      setter?.call(input, query);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      window.clearInterval(timer);
    }, 100);

    return () => window.clearInterval(timer);
  }, [location.pathname, location.search]);

  return null;
}

const protect = (element) => <ProtectedAdminRoute>{element}</ProtectedAdminRoute>;

function AdminRoutes() {
  return (
    <>
      <AdminFetchBridge />
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/admin" element={protect(<Admin />)} />
        <Route path="/admin/orders" element={protect(<Orders />)} />
        <Route path="/admin/products" element={protect(<Products />)} />
        <Route path="/admin/reports" element={protect(<Reports />)} />
        <Route path="/admin/profile" element={protect(<Profile />)} />
        <Route path="/admin/recycle-bin" element={protect(<RecycleBin />)} />
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </>
  );
}

function StoreRoutes() {
  return (
    <div className="customer-shell">
      <CustomerSiteHeader />
      <StoreSearchBridge />
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
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/account/auth" element={<CustomerAuth />} />
        <Route path="/verify-email" element={<CustomerAuth />} />
        <Route path="/verify-email-change" element={<CustomerAuth />} />
        <Route path="/reset-password" element={<CustomerAuth />} />
        <Route path="/auth/google/callback" element={<CustomerAuth />} />
        {["/account", "/account/orders", "/account/profile", "/account/security"].map((path) => <Route key={path} path={path} element={<ProtectedCustomerRoute><CustomerAccount /></ProtectedCustomerRoute>} />)}
        <Route path="/admin/*" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CustomerSiteFooter />
    </div>
  );
}

function App() {
  return (
    <CustomerProvider><CartProvider>
      <BrowserRouter basename={routerBase}>
        <ScrollToTop />
        <StoreInteractionEnhancements />
        {!isAdminHost && <ImpactPromiseMounts />}
        {isAdminHost ? <AdminRoutes /> : <StoreRoutes />}
      </BrowserRouter>
    </CartProvider></CustomerProvider>
  );
}

export default App;
