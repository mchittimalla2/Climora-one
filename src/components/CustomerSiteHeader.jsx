import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import CustomerAccountControl from "./CustomerAccountControl";
import { useCart } from "../context/CartContext";

export default function CustomerSiteHeader() {
  const { cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => setOpen(false), [location.pathname]);

  const submitSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
    setOpen(false);
  };

  return (
    <header className="customer-site-header">
      <Link to="/" className="customer-site-brand" aria-label="Climoraone home">
        <BrandLogo className="customer-site-logo" />
      </Link>

      <form className="customer-site-search" onSubmit={submitSearch} role="search">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products, materials or categories"
          aria-label="Search products"
        />
      </form>

      <nav className="customer-site-nav" aria-label="Main navigation">
        <Link to="/home">Home</Link>
        <Link to="/products">Collection</Link>
        <Link to="/track-order">Track Order</Link>
        <Link to="/cart" className="customer-site-cart">🛒 Cart ({cartCount})</Link>
        <CustomerAccountControl />
      </nav>

      <button
        type="button"
        className="customer-site-menu-button"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        ☰
      </button>

      {open && (
        <div className="customer-site-mobile-menu">
          <Link to="/home">Home</Link>
          <Link to="/products">Collection</Link>
          <Link to="/track-order">Track Order</Link>
          <Link to="/cart">Cart ({cartCount})</Link>
          <CustomerAccountControl />
          <form onSubmit={submitSearch} role="search">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products, materials or categories"
              aria-label="Search products"
            />
          </form>
        </div>
      )}
    </header>
  );
}
