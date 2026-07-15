import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "../App.css";
import "../styles/store-v2.css";
import { API_BASE_URL } from "../config/api";
import { useCart } from "../context/CartContext";
import { BrandLogo } from "../components/BrandLogo";
import { parseProductDetails, visibleSpecifications } from "../utils/productDetails";

const placeholderImage = `${import.meta.env.BASE_URL}images/climoraone-logo.svg`;

function resolveProductImage(path) {
  if (!path) return placeholderImage;
  if (/^https?:\/\//i.test(path)) return path;
  if (/^\/(storage|uploads)\//i.test(path)) return `${API_BASE_URL}${path}`;
  return `${import.meta.env.BASE_URL}${String(path).replace(/^\/+/, "")}`;
}

function normalizeProduct(product) {
  const paths = Array.isArray(product.images)
    ? product.images
    : product.main_image
      ? [product.main_image]
      : [];
  const details = parseProductDetails(product.description || "");

  return {
    id: Number(product.id),
    name: product.name || "Unnamed product",
    category: product.category || "Collection",
    description: details.summary,
    specifications: details.specifications,
    price: Number(product.price) || 0,
    stock: Math.max(0, Number(product.stock) || 0),
    images: paths.length ? paths.map(resolveProductImage) : [placeholderImage],
  };
}

function Store() {
  const {
    cart,
    addToCart,
    increaseQty,
    decreaseQty,
    removeFromCart,
    syncCartWithProducts,
    cartCount,
    total,
  } = useCart();

  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError("");
        const response = await fetch(`${API_BASE_URL}/api/products`, {
          headers: { Accept: "application/json" },
        });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data)) {
          throw new Error(data?.message || "Unable to load products.");
        }
        const normalized = data.map(normalizeProduct);
        if (active) {
          setProducts(normalized);
          syncCartWithProducts(normalized);
        }
      } catch (error) {
        if (active) setProductsError(error.message || "Unable to load products.");
      } finally {
        if (active) setProductsLoading(false);
      }
    };

    loadProducts();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.querySelector(".product-detail")?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedProduct]);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const specificationText = Object.values(product.specifications || {}).join(" ").toLowerCase();
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search) ||
        specificationText.includes(search);
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const scrollToSection = (id) => {
    setSelectedProduct(null);
    setShowMobileMenu(false);
    setShowAllDetails(false);
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const openProduct = (product) => {
    setSelectedProduct(product);
    setSelectedImage(product.images[0]);
    setQuantity(1);
    setShowAllDetails(false);
    setShowMobileMenu(false);
  };

  const addSelectedProduct = (goToCheckout = false) => {
    if (!selectedProduct) return;
    const result = addToCart(selectedProduct, quantity);
    if (!result.success) {
      alert(result.message);
      return;
    }
    if (goToCheckout) {
      window.setTimeout(() => navigate("/checkout"), 50);
      return;
    }
    setSelectedProduct(null);
    window.setTimeout(() => scrollToSection("cart"), 100);
  };

  const trustItems = [
    { number: "01", icon: "✦", title: "Handcrafted", copy: "Made with skilled hands" },
    { number: "02", icon: "⌁", title: "Sustainable", copy: "Natural, considered materials" },
    { number: "03", icon: "❋", title: "Made in India", copy: "Rooted in Indian craft" },
    { number: "04", icon: "◇", title: "Secure Delivery", copy: "Carefully packed, pan India" },
  ];

  const detailRows = selectedProduct
    ? visibleSpecifications(selectedProduct.specifications)
    : [];
  const highlightKeys = ["material", "color", "productType", "netQuantity"];
  const highlightRows = detailRows.filter((row) => highlightKeys.includes(row.key));
  const additionalRows = detailRows.filter((row) => !highlightKeys.includes(row.key));

  return (
    <div className="store-v2">
      <header className="v2-header">
        <button type="button" onClick={() => scrollToSection("home")} className="v2-logo-button" aria-label="Go to homepage">
          <span className="v2-logo-leaf"><BrandLogo className="v2-header-logo" /></span>
        </button>

        <input
          className="v2-search"
          value={searchTerm}
          placeholder="Search handcrafted pieces"
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setSelectedProduct(null);
          }}
        />

        <nav className="v2-nav">
          <button type="button" onClick={() => scrollToSection("home")}>Home</button>
          <button type="button" onClick={() => scrollToSection("products")}>Collection</button>
          <button type="button" onClick={() => scrollToSection("craft")}>Our Craft</button>
          <Link to="/contact">Contact</Link>
          <button type="button" className="v2-cart-link" onClick={() => scrollToSection("cart")}>🛒 Cart ({cartCount})</button>
        </nav>

        <button type="button" className="v2-menu-button" onClick={() => setShowMobileMenu(!showMobileMenu)} aria-label="Open menu">☰</button>
        {showMobileMenu && (
          <div className="v2-mobile-menu">
            <button type="button" onClick={() => scrollToSection("home")}>Home</button>
            <button type="button" onClick={() => scrollToSection("products")}>Collection</button>
            <button type="button" onClick={() => scrollToSection("craft")}>Our Craft</button>
            <button type="button" onClick={() => scrollToSection("cart")}>Cart ({cartCount})</button>
            <Link to="/track-order">Track Order</Link>
          </div>
        )}
      </header>

      {selectedProduct ? (
        <section className="product-detail" tabIndex="-1">
          <button type="button" className="back-btn" onClick={() => scrollToSection("products")}>← Back to Collection</button>
          <div className="detail-layout">
            <div className="thumbs">
              {selectedProduct.images.map((image) => (
                <img key={image} src={image} alt={selectedProduct.name} onClick={() => setSelectedImage(image)} className={selectedImage === image ? "active-thumb" : ""} />
              ))}
            </div>
            <div className="main-image-box"><img src={selectedImage} alt={selectedProduct.name} /></div>
            <div className="detail-info">
              <p className="eco-label">{selectedProduct.category}</p>
              <h2>{selectedProduct.name}</h2>
              <h3>₹{selectedProduct.price}</h3>
              <p className="product-description">{selectedProduct.description}</p>
              {selectedProduct.stock <= 0 && <p className="out-of-stock-message">Currently unavailable</p>}
              <div className="quantity-box">
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
                <strong>{quantity}</strong>
                <button type="button" onClick={() => setQuantity((value) => Math.min(selectedProduct.stock, value + 1))} disabled={quantity >= selectedProduct.stock}>+</button>
              </div>
              <div className="detail-actions">
                <button type="button" onClick={() => addSelectedProduct(false)} disabled={selectedProduct.stock <= 0}>Add to Cart</button>
                <button type="button" className="buy-btn" onClick={() => addSelectedProduct(true)} disabled={selectedProduct.stock <= 0}>Buy Now</button>
              </div>
              <div className="trust-box">
                <p>✦ Premium handcrafted finish</p>
                <p>✦ Quality checked before dispatch</p>
                <p>✦ Secure delivery across India</p>
              </div>
            </div>
          </div>

          {detailRows.length > 0 && (
            <section className="product-specifications" aria-label="Product information">
              <div className="product-specifications__heading">
                <span className="v2-eyebrow">Know your piece</span>
                <h2>Product highlights</h2>
                <p>Clear, standardized information to help you choose with confidence.</p>
              </div>

              {highlightRows.length > 0 && (
                <div className="product-highlights-grid">
                  {highlightRows.map((row) => (
                    <article key={row.key}>
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </article>
                  ))}
                </div>
              )}

              {additionalRows.length > 0 && (
                <div className="product-additional-details">
                  <button type="button" className="product-details-toggle" onClick={() => setShowAllDetails((current) => !current)} aria-expanded={showAllDetails}>
                    <span>Additional details</span>
                    <span>{showAllDetails ? "−" : "+"}</span>
                  </button>
                  {showAllDetails && (
                    <dl>
                      {additionalRows.map((row) => (
                        <div key={row.key}><dt>{row.label}</dt><dd>{row.value}</dd></div>
                      ))}
                    </dl>
                  )}
                </div>
              )}
            </section>
          )}
        </section>
      ) : (
        <>
          <section id="home" className="v2-hero">
            <div className="v2-hero-copy">
              <span className="v2-eyebrow">Premium Indian craftsmanship</span>
              <h1>Timeless pieces for beautifully considered homes.</h1>
              <p>Discover distinctive handcrafted décor shaped by skilled artisans, premium materials and a devotion to enduring quality.</p>
              <div className="v2-actions">
                <button type="button" className="v2-primary" onClick={() => scrollToSection("products")}>Shop the Collection</button>
                <button type="button" className="v2-secondary" onClick={() => scrollToSection("craft")}>Explore Our Craft</button>
              </div>
            </div>
            <div className="v2-hero-visual" aria-label="Premium Indian handcrafted décor collection" />
          </section>

          <section className="v2-trust-strip" aria-label="Climoraone product promises">
            {trustItems.map((item) => (
              <article className="v2-trust-item" key={item.title}>
                <span className="v2-trust-number">{item.number}</span>
                <span className="v2-trust-medallion" aria-hidden="true">{item.icon}</span>
                <span className="v2-trust-copy"><strong>{item.title}</strong><small>{item.copy}</small></span>
              </article>
            ))}
          </section>

          <section id="products" className="v2-section v2-collection-section">
            <div className="v2-section-heading">
              <span className="v2-eyebrow">Curated collection</span>
              <h2>Objects with presence, character and soul.</h2>
              <p>Selected pieces that bring warmth, artistry and timeless Indian design into modern spaces.</p>
            </div>

            <div className="v2-category-bar">
              {categories.map((category) => (
                <button key={category} type="button" className={selectedCategory === category ? "active" : ""} onClick={() => setSelectedCategory(category)}>{category}</button>
              ))}
            </div>

            {productsLoading && <div className="products-status">Preparing the collection...</div>}
            {productsError && <div className="products-error">{productsError}</div>}
            {!productsLoading && !productsError && (
              <div className="v2-product-grid">
                {filteredProducts.map((product) => (
                  <article className="v2-product-card" key={product.id}>
                    <div className="v2-product-image-wrap"><img src={product.images[0]} alt={product.name} loading="lazy" /></div>
                    <div className="v2-product-body">
                      <small>{product.category}</small>
                      <h3>{product.name}</h3>
                      <div className="v2-product-meta">
                        <strong>₹{product.price}</strong>
                        <button type="button" onClick={() => openProduct(product)} disabled={product.stock <= 0}>{product.stock > 0 ? "View Details →" : "Unavailable"}</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="craft" className="v2-craft">
            <div className="v2-craft-art" aria-hidden="true">
              <span className="craft-icon craft-icon--top">◒</span>
              <span className="craft-icon craft-icon--middle">✦</span>
              <span className="craft-icon craft-icon--bottom">⌂</span>
            </div>
            <div className="v2-craft-copy">
              <span className="v2-eyebrow">The art behind every piece</span>
              <h2>Crafted slowly. Chosen thoughtfully.</h2>
              <p>Climoraone brings together exceptional handcrafted products created with patience, precision and a respect for material. Every piece is selected first for its beauty and quality—its artisan story makes it even more meaningful.</p>
              <p className="v2-impact-note">Behind the collection is a wider purpose: creating sustained opportunities for women and rural artisans across India, while helping traditional skills remain relevant for the next generation.</p>
              <div className="v2-craft-points">
                <div><strong>Distinctive by nature</strong><br />Subtle variations make every handcrafted piece genuinely individual.</div>
                <div><strong>Made to be lived with</strong><br />Timeless forms designed to add character to contemporary homes.</div>
                <div><strong>Craft with a future</strong><br />Your choice supports skilled artisans and preserves valuable traditions.</div>
              </div>
            </div>
          </section>

          <section className="v2-section v2-promise-section">
            <div className="v2-section-heading center">
              <span className="v2-eyebrow">The Climoraone promise</span>
              <h2>Premium from selection to delivery.</h2>
            </div>
            <div className="v2-promise-grid">
              <div className="v2-promise-card"><span>✦</span><h3>Curated Quality</h3><p>Only products that meet our standards for finish, form and material make the collection.</p></div>
              <div className="v2-promise-card"><span>⌂</span><h3>Designed for Home</h3><p>Elegant, versatile pieces selected to complement both traditional and modern interiors.</p></div>
              <div className="v2-promise-card"><span>◈</span><h3>Authentically Handmade</h3><p>Created by skilled artisans using craft knowledge refined across generations.</p></div>
              <div className="v2-promise-card"><span>✓</span><h3>Careful Delivery</h3><p>Secure packaging and dependable delivery, so your purchase arrives with confidence.</p></div>
            </div>
          </section>

          <section id="cart" className="cart-section">
            <div className="cart-section__container">
              <div className="cart-section__heading"><h2>Your Cart</h2><p>Review your selected Climoraone pieces.</p></div>
              {cart.length === 0 ? (
                <div className="empty-cart-inline"><div className="empty-cart-inline__icon">🛒</div><h3>Your cart is empty</h3><p>Explore the collection to find a piece for your home.</p><button type="button" className="btn" onClick={() => scrollToSection("products")}>Shop Collection</button></div>
              ) : (
                <div className="cart-layout">
                  <div className="inline-cart-items">
                    {cart.map((item) => (
                      <article className="cart-item" key={item.id}>
                        <div className="cart-item-details"><h3>{item.name}</h3><p className="cart-item-unit-price">₹{Number(item.price)} each</p><div className="cart-item-bottom"><div className="cart-item-controls"><button type="button" onClick={() => decreaseQty(item.id)}>−</button><strong>{item.quantity}</strong><button type="button" onClick={() => increaseQty(item.id)} disabled={item.quantity >= item.stock}>+</button></div><button type="button" className="cart-item-remove" onClick={() => removeFromCart(item.id)}>Remove</button></div></div>
                        <strong className="cart-item-total">₹{Number(item.price) * item.quantity}</strong>
                      </article>
                    ))}
                  </div>
                  <aside className="inline-cart-summary"><h3>Order Summary</h3><div className="summary-row"><span>Quantity</span><strong>{cartCount}</strong></div><div className="summary-row summary-total"><span>Total</span><strong>₹{total}</strong></div><button type="button" className="checkout-btn" onClick={() => navigate("/checkout")}>Proceed to Checkout</button></aside>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <footer className="footer">
        <div className="footer-content">
          <div><BrandLogo className="footer-logo" /><p>Premium handcrafted décor bringing timeless Indian craftsmanship into beautiful homes.</p></div>
          <div><h4>Explore</h4><button type="button" className="footer-link-button" onClick={() => scrollToSection("products")}>Collection</button><button type="button" className="footer-link-button" onClick={() => scrollToSection("craft")}>Our Craft</button><Link to="/track-order">Track Order</Link></div>
          <div><h4>Customer Care</h4><Link to="/return-policy">Return Policy</Link><Link to="/shipping-policy">Shipping Policy</Link><Link to="/contact">Contact Us</Link></div>
        </div>
      </footer>
    </div>
  );
}

export default Store;
