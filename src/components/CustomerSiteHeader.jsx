import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import CustomerAccountControl from "./CustomerAccountControl";
import { useCart } from "../context/CartContext";
import { API_BASE_URL } from "../config/api";

export default function CustomerSiteHeader() {
  const { cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/api/products`, { headers: { Accept: "application/json" } })
      .then((response) => response.json())
      .then((data) => {
        if (active && Array.isArray(data)) setProducts(data);
      })
      .catch(() => {
        if (active) setProducts([]);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const closeSuggestions = (event) => {
      const inDesktop = desktopSearchRef.current?.contains(event.target);
      const inMobile = mobileSearchRef.current?.contains(event.target);
      if (!inDesktop && !inMobile) setSearchFocused(false);
    };
    document.addEventListener("pointerdown", closeSuggestions);
    return () => document.removeEventListener("pointerdown", closeSuggestions);
  }, []);

  const suggestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return products
      .filter((product) => `${product.name || ""} ${product.category || ""} ${product.description || ""}`.toLowerCase().includes(query))
      .sort((a, b) => {
        const aName = String(a.name || "").toLowerCase();
        const bName = String(b.name || "").toLowerCase();
        return Number(!aName.startsWith(query)) - Number(!bName.startsWith(query)) || aName.localeCompare(bName);
      })
      .slice(0, 5);
  }, [products, search]);

  const openSearchResult = (product) => {
    const name = String(product.name || "").trim();
    setSearch(name);
    setSearchFocused(false);
    setOpen(false);
    navigate(`/products?q=${encodeURIComponent(name)}&open=1`);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    if (suggestions.length === 1) {
      openSearchResult(suggestions[0]);
      return;
    }
    navigate(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
    setSearchFocused(false);
    setOpen(false);
  };

  const renderSearch = (wrapperRef, mobile = false) => (
    <form
      ref={wrapperRef}
      className={mobile ? "customer-site-mobile-search" : "customer-site-search"}
      onSubmit={submitSearch}
      role="search"
    >
      <input
        value={search}
        onFocus={() => setSearchFocused(true)}
        onChange={(event) => {
          setSearch(event.target.value);
          setSearchFocused(true);
        }}
        placeholder="Search products, materials or categories"
        aria-label="Search products"
        autoComplete="off"
      />
      {searchFocused && search.trim() && (
        <div className="customer-site-search-suggestions" role="listbox">
          {suggestions.map((product) => (
            <button key={product.id} type="button" onClick={() => openSearchResult(product)}>
              <span className="customer-site-search-icon">⌕</span>
              <span><strong>{product.name}</strong><small>{product.category || "Collection"}</small></span>
              <span aria-hidden="true">→</span>
            </button>
          ))}
          {!suggestions.length && (
            <div className="customer-site-search-empty">
              <strong>No matching products</strong>
              <small>Try another product name, material or category.</small>
            </div>
          )}
        </div>
      )}
    </form>
  );

  return (
    <header className="customer-site-header">
      <Link to="/" className="customer-site-brand" aria-label="Climoraone home">
        <BrandLogo className="customer-site-logo" />
      </Link>

      {renderSearch(desktopSearchRef)}

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
        </div>
      )}

      <div className="customer-site-mobile-search-row">
        {renderSearch(mobileSearchRef, true)}
      </div>
    </header>
  );
}
