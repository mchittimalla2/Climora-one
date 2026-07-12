import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "../App.css";
import { API_BASE_URL } from "../config/api";
import { useCart } from "../context/CartContext";

const placeholderImage = `${import.meta.env.BASE_URL}images/logo.jpeg`;

function resolveProductImage(path) {
  if (!path) {
    return placeholderImage;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (/^\/(storage|uploads)\//i.test(path)) {
    return `${API_BASE_URL}${path}`;
  }

  return `${import.meta.env.BASE_URL}${String(path).replace(/^\/+/, "")}`;
}

function normalizeProduct(product) {
  const imagePaths = Array.isArray(product.images)
    ? product.images
    : product.main_image
      ? [product.main_image]
      : [];

  const images = imagePaths.length
    ? imagePaths.map(resolveProductImage)
    : [placeholderImage];

  return {
    id: Number(product.id),
    name: product.name || "Unnamed product",
    category: product.category || "Other",
    description: product.description || "",
    price: Number(product.price) || 0,
    stock: Math.max(0, Number(product.stock) || 0),
    images,
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

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError("");

        const response = await fetch(`${API_BASE_URL}/api/products`, {
          headers: {
            Accept: "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Unable to load products.");
        }

        if (!Array.isArray(data)) {
          throw new Error("The product service returned an invalid response.");
        }

        const normalizedProducts = data.map(normalizeProduct);

        if (active) {
          setProducts(normalizedProducts);
          syncCartWithProducts(normalizedProducts);
        }
      } catch (error) {
        console.error("Product loading failed:", error);

        if (active) {
          setProductsError(
            error instanceof Error
              ? error.message
              : "Unable to load products."
          );
        }
      } finally {
        if (active) {
          setProductsLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const availableCategories = products
      .map((product) => product.category)
      .filter(Boolean);

    return ["All", ...new Set(availableCategories)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search);

      const matchesCategory =
        selectedCategory === "All" ||
        product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const scrollToSection = (sectionId) => {
    setSelectedProduct(null);
    setShowMobileMenu(false);

    window.setTimeout(() => {
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const openProduct = (product) => {
    setSelectedProduct(product);
    setSelectedImage(product.images[0]);
    setQuantity(1);
    setShowMobileMenu(false);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  };

  const handleAddToCart = () => {
    if (!selectedProduct) {
      return;
    }

    const result = addToCart(selectedProduct, quantity);

    if (!result.success) {
      alert(result.message);
      return;
    }

    setSelectedProduct(null);

    window.setTimeout(() => {
      document
        .getElementById("cart")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div>
      <header className="header">
        <div className="logo-section">
          <img
            src={`${import.meta.env.BASE_URL}images/logo.jpeg`}
            alt="Climoraone"
            className="header-logo"
          />
        </div>

        <div className="mobile-search-row">
          <input
            type="text"
            placeholder="Search products..."
            className="search-box"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setSelectedProduct(null);
            }}
          />

          <button
            type="button"
            className="mobile-menu-icon"
            onClick={() => setShowMobileMenu((current) => !current)}
            aria-label="Open navigation menu"
            aria-expanded={showMobileMenu}
          >
            ☰
          </button>
        </div>

        <nav className="header-nav">
          <button
            type="button"
            className="nav-link-button"
            onClick={() => scrollToSection("home")}
          >
            Home
          </button>
          <button
            type="button"
            className="nav-link-button"
            onClick={() => scrollToSection("products")}
          >
            Products
          </button>
          <button
            type="button"
            className="nav-link-button"
            onClick={() => scrollToSection("cart")}
          >
            Cart ({cartCount})
          </button>
        </nav>

        {showMobileMenu && (
          <div className="mobile-dropdown">
            <button type="button" onClick={() => scrollToSection("home")}>
              Home
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("products")}
            >
              Products
            </button>
            <button type="button" onClick={() => scrollToSection("cart")}>
              Cart ({cartCount})
            </button>
            <Link to="/contact" onClick={() => setShowMobileMenu(false)}>
              Contact
            </Link>
          </div>
        )}
      </header>

      {selectedProduct ? (
        <section className="product-detail">
          <button
            type="button"
            className="back-btn"
            onClick={() => {
              setSelectedProduct(null);
              window.setTimeout(() => {
                document
                  .getElementById("products")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            }}
          >
            ← Back to Products
          </button>

          <div className="detail-layout">
            <div className="thumbs">
              {selectedProduct.images.map((image) => (
                <img
                  key={image}
                  src={image}
                  alt={selectedProduct.name}
                  loading="lazy"
                  decoding="async"
                  onClick={() => setSelectedImage(image)}
                  className={selectedImage === image ? "active-thumb" : ""}
                />
              ))}
            </div>

            <div className="main-image-box">
              <img
                src={selectedImage}
                alt={selectedProduct.name}
                decoding="async"
              />
            </div>

            <div className="detail-info">
              <p className="eco-label">{selectedProduct.category}</p>
              <h2>{selectedProduct.name}</h2>
              <h3>₹{selectedProduct.price}</h3>
              <p>{selectedProduct.description}</p>

              <div className="quantity-box">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) => Math.max(1, current - 1))
                  }
                >
                  −
                </button>
                <strong>{quantity}</strong>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) =>
                      Math.min(selectedProduct.stock, current + 1)
                    )
                  }
                  disabled={
                    selectedProduct.stock <= 0 ||
                    quantity >= selectedProduct.stock
                  }
                >
                  +
                </button>
              </div>

              <div className="detail-actions">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={selectedProduct.stock <= 0}
                >
                  Add to Cart
                </button>
                <button
                  type="button"
                  className="buy-btn"
                  onClick={handleAddToCart}
                  disabled={selectedProduct.stock <= 0}
                >
                  Buy Now
                </button>
              </div>

              <div className="trust-box">
                <p>🌿 Made with sustainable materials</p>
                <p>👩‍🎨 Supports rural women artisans</p>
                <p>🚚 Shipping available across India</p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section id="home" className="hero">
            <div className="hero-content">
              <span className="tag">
                Eco-friendly • Handmade • Women-led
              </span>
              <h2>
                Nature-inspired products crafted by rural women artisans
              </h2>
              <p>
                Climoraone is a social enterprise that empowers rural women
                by helping them create and sell eco-friendly handcrafted
                products made from wood, cloth, and sustainable materials.
              </p>
              <button
                type="button"
                className="btn"
                onClick={() => scrollToSection("products")}
              >
                Explore Products
              </button>
            </div>
          </section>

          <section className="impact">
            <div>
              <h3>🌿 Eco-Friendly</h3>
              <p>Products inspired by nature and sustainable living.</p>
            </div>
            <div>
              <h3>👩‍🎨 Women Empowerment</h3>
              <p>Supporting rural women artisans with income opportunities.</p>
            </div>
            <div>
              <h3>🪵 Handmade</h3>
              <p>Traditional craftsmanship with care and authenticity.</p>
            </div>
          </section>

          <section className="about">
            <h2>About Climoraone</h2>
            <p>
              Every handmade product carries a story. Climoraone creates a
              platform where rural women can showcase their skills, preserve
              traditional craftsmanship, and build sustainable livelihoods
              through nature-based products.
            </p>
          </section>

          <section id="products" className="products">
            <h2>Featured Products</h2>
            <p className="section-subtitle">
              Handpicked eco-friendly products from our artisan community.
            </p>

            <div className="category-bar">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={
                    selectedCategory === category
                      ? "category-btn active-category"
                      : "category-btn"
                  }
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            {productsLoading && (
              <div className="products-status">Loading products...</div>
            )}

            {productsError && (
              <div className="products-error" role="alert">
                {productsError}
              </div>
            )}

            {!productsLoading && !productsError && (
              <div className="product-grid">
                {filteredProducts.length === 0 ? (
                  <p>No products are currently available.</p>
                ) : (
                  filteredProducts.map((product) => (
                    <div className="product-card" key={product.id}>
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="product-info">
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                        <h4>₹{product.price}</h4>
                        {product.stock > 0 ? (
                          <button
                            type="button"
                            onClick={() => openProduct(product)}
                          >
                            View Details
                          </button>
                        ) : (
                          <button type="button" disabled>
                            Out of Stock
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>

          <section id="cart" className="cart-section">
            <div className="cart-section__container">
              <div className="cart-section__heading">
                <h2>Your Cart</h2>
                <p>Review your selected Climoraone products.</p>
              </div>

              {cart.length === 0 ? (
                <div className="empty-cart-inline">
                  <div className="empty-cart-inline__icon" aria-hidden="true">
                    🛒
                  </div>
                  <h3>Your cart is empty</h3>
                  <p>Add a Climoraone product to continue.</p>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => scrollToSection("products")}
                  >
                    Explore Products
                  </button>
                </div>
              ) : (
                <div className="cart-layout">
                  <div className="inline-cart-items">
                    {cart.map((item) => (
                      <article className="cart-item" key={item.id}>
                        <div className="cart-item-details">
                          <h3>{item.name}</h3>
                          <p className="cart-item-unit-price">
                            ₹{Number(item.price)} each
                          </p>
                          <div className="cart-item-bottom">
                            <div className="cart-item-controls">
                              <button
                                type="button"
                                onClick={() => decreaseQty(item.id)}
                                aria-label={`Reduce quantity of ${item.name}`}
                              >
                                −
                              </button>
                              <strong>{item.quantity}</strong>
                              <button
                                type="button"
                                onClick={() => increaseQty(item.id)}
                                disabled={item.quantity >= item.stock}
                                aria-label={`Increase quantity of ${item.name}`}
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              className="cart-item-remove"
                              onClick={() => removeFromCart(item.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <strong className="cart-item-total">
                          ₹{Number(item.price) * item.quantity}
                        </strong>
                      </article>
                    ))}
                  </div>

                  <aside className="inline-cart-summary">
                    <h3>Order Summary</h3>
                    <div className="summary-row">
                      <span>Quantity</span>
                      <strong>{cartCount}</strong>
                    </div>
                    <div className="summary-row summary-total">
                      <span>Total</span>
                      <strong>₹{total}</strong>
                    </div>
                    <button
                      type="button"
                      className="checkout-btn"
                      onClick={() => navigate("/checkout")}
                    >
                      Proceed to Checkout
                    </button>
                  </aside>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <footer className="footer">
        <div className="footer-content">
          <div>
            <img
              src={`${import.meta.env.BASE_URL}images/logo.jpeg`}
              alt="Climoraone"
              className="footer-logo"
            />
            <p>
              Eco-friendly handmade products supporting rural women artisans
              across India.
            </p>
          </div>

          <div>
            <h4>Quick Links</h4>
            <button
              type="button"
              className="footer-link-button"
              onClick={() => scrollToSection("home")}
            >
              Home
            </button>
            <button
              type="button"
              className="footer-link-button"
              onClick={() => scrollToSection("products")}
            >
              Products
            </button>
            <button
              type="button"
              className="footer-link-button"
              onClick={() => scrollToSection("cart")}
            >
              Cart
            </button>
            <Link to="/contact">Contact Us</Link>
            <Link to="/track-order">Track Order</Link>
          </div>

          <div>
            <h4>Policies</h4>
            <Link to="/return-policy">Return Policy</Link>
            <Link to="/shipping-policy">Shipping Policy</Link>
          </div>

          <div>
            <h4>Contact</h4>
            <p>Email: support@climoraone.com</p>
            <p>WhatsApp: +91 98765 43210</p>
          </div>
        </div>

        <div className="footer-bottom">
          © 2026 Climoraone. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default Store;
