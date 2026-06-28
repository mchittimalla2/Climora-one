import { BrowserRouter, Routes, Route } from "react-router-dom";
import Store from "./pages/Store";
import Admin from "./pages/admin/Admin";
import Orders from "./pages/admin/Orders";
import Products from "./pages/admin/Products";
import Reports from "./pages/admin/Reports";
import Contact from "./pages/Contact";
import ReturnPolicy from "./pages/ReturnPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import TrackOrder from "./pages/TrackOrder";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Store />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/orders" element={<Orders />} />
        <Route path="/admin/products" element={<Products />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/return-policy" element={<ReturnPolicy />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/track-order" element={<TrackOrder />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;