import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Store from "./pages/Store";
import Admin from "./pages/admin/Admin";
import Orders from "./pages/admin/Orders";
import Products from "./pages/admin/products/Products";
import Reports from "./pages/admin/Reports";
import Contact from "./pages/Contact";
import ReturnPolicy from "./pages/ReturnPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import TrackOrder from "./pages/TrackOrder";
import "./App.css";
import { Link } from "react-router-dom";
import Cart from "./pages/Cart";
import { CartProvider } from "./context/CartContext";

const viteBase = import.meta.env.BASE_URL || "/";

const routerBase =
  viteBase === "/" ? "/" : viteBase.replace(/\/$/, "");

function App() {
  return (
      <BrowserRouter basename={routerBase}>
      <Routes>
         <Route path="/" element={<Store />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/return-policy" element={<ReturnPolicy />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/" element={<Store />} />
        <Route path="/products" element={<Store />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/orders" element={<Orders />} />
        <Route path="/admin/products" element={<Products />} />
        <Route path="/admin/reports" element={<Reports />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
