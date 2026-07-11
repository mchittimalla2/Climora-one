import { Link, useNavigate } from "react-router-dom";
import "../App.css";
import products from "../data/products";
import { useCart } from "../context/CartContext";
import { useState } from "react";
import { API_BASE_URL } from "../config/api";


function Store() {
  const {
  cart,
  addToCart,
  increaseQty,
  decreaseQty,
  removeFromCart,
  clearCart,
  cartCount,
  total,
} = useCart();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  const categories = ["All", "Religious", "Toys", "Home Decor"];

  const filteredProducts = products.filter((product) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      product.name.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search);

    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
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

  const buyNow = () => {
    handleAddToCart();
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
            <button
              type="button"
              onClick={() => scrollToSection("home")}
            >
              Home
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("products")}
            >
              Products
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("cart")}
            >
              Cart ({cartCount})
            </button>

            <Link
              to="/contact"
              onClick={() => setShowMobileMenu(false)}
            >
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
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
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
                  className={
                    selectedImage === image ? "active-thumb" : ""
                  }
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
              <p className="eco-label">
                {selectedProduct.category}
              </p>

              <h2>{selectedProduct.name}</h2>
              <h3>₹{selectedProduct.price}</h3>
              <p>{selectedProduct.description}</p>

              <div className="quantity-box">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) =>
                      Math.max(1, current - 1)
                    )
                  }
                >
                  −
                </button>

                <strong>{quantity}</strong>

                <button
                type="button"
                onClick={() => {
                  const parsedStock = Number(selectedProduct.stock);
                  const availableStock = Number.isFinite(parsedStock)
                    ? parsedStock
                    : 10;

                  setQuantity((current) =>
                    Math.min(availableStock, current + 1)
                  );
                }}
                disabled={(() => {
                  const parsedStock = Number(selectedProduct.stock);

                  return (
                    Number.isFinite(parsedStock) &&
                    quantity >= parsedStock
                  );
                })()}
              >
                +
              </button>
              </div>

              <div className="detail-actions">
                <button
                  type="button"
                  onClick={handleAddToCart}
                >
                  Add to Cart
                </button>

                <button
                  type="button"
                  className="buy-btn"
                  onClick={buyNow}
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
                Nature-inspired products crafted by rural women
                artisans
              </h2>

              <p>
                Climoraone is a social enterprise that empowers
                rural women by helping them create and sell
                eco-friendly handcrafted products made from wood,
                cloth, and sustainable materials.
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
              <p>
                Products inspired by nature and sustainable living.
              </p>
            </div>

            <div>
              <h3>👩‍🎨 Women Empowerment</h3>
              <p>
                Supporting rural women artisans with income
                opportunities.
              </p>
            </div>

            <div>
              <h3>🪵 Handmade</h3>
              <p>
                Traditional craftsmanship with care and authenticity.
              </p>
            </div>
          </section>

          <section className="about">
            <h2>About Climoraone</h2>

            <p>
              Every handmade product carries a story. Climoraone
              creates a platform where rural women can showcase their
              skills, preserve traditional craftsmanship, and build
              sustainable livelihoods through nature-based products.
            </p>
          </section>

          <section id="products" className="products">
            <h2>Featured Products</h2>

            <p className="section-subtitle">
              Handpicked eco-friendly products from our artisan
              community.
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

            <div className="product-grid">
              {filteredProducts.length === 0 ? (
                <p>No products found.</p>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    className="product-card"
                    key={product.id}
                  >
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

                      <button
                        type="button"
                        onClick={() => openProduct(product)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section id="cart" className="cart-section">
          <div className="cart-section__container">
            <div className="cart-section__heading">
              <h2>Your Cart</h2>
              <p>Review your selected Climoraone products.</p>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart-inline">
                <div
                  className="empty-cart-inline__icon"
                  aria-hidden="true"
                >
                  🛒
                </div>

                <h3>Your cart is empty</h3>

                <p>
                  Looks like you have not added any Climoraone
                  products yet.
                </p>

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
                    <article
                      className="cart-item"
                      key={item.id}
                    >
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
                              disabled={(() => {
                                const parsedStock = Number(item.stock);

                                return (
                                  Number.isFinite(parsedStock) &&
                                  item.quantity >= parsedStock
                                );
                              })()}
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
                  disabled={cart.length === 0}
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
              Eco-friendly handmade products supporting rural women
              artisans across India.
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