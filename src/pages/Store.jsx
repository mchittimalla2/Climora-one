import { Link } from "react-router-dom";
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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
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

  const proceedToCheckout = () => {
  if (cart.length === 0) {
    return;
  }

  setOrderSuccess(null);
  setOrderError("");
  setShowCheckout(true);

  window.setTimeout(() => {
    document
      .getElementById("checkout")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }, 100);
};

const submitOrder = async (event) => {
  event.preventDefault();

  if (cart.length === 0 || isSubmittingOrder) {
    return;
  }

  const form = event.currentTarget;

  const orderPayload = {
    customer_name: form.customerName.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    address: form.address.value.trim(),
    city: form.city.value.trim(),
    state: form.state.value.trim(),
    pincode: form.pincode.value.trim(),
    total,
    items: cart.map((item) => ({
      // Keep null until storefront products come from PostgreSQL.
      product_id: null,
      product_name: item.name,
      quantity: item.quantity,
      price: Number(item.price),
    })),
  };

  try {
    setIsSubmittingOrder(true);
    setOrderError("");

    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Order API error:", data);

      const validationMessage = data?.message;

      throw new Error(
        validationMessage || "Unable to place the order."
      );
    }

    const savedOrder = {
      id: data.order.order_number,
      createdAt: data.order.created_at,
      customerName: data.order.customer_name,
      email: data.order.email,
      phone: data.order.phone,
      address: data.order.address,
      city: data.order.city,
      state: data.order.state,
      pincode: data.order.pincode,
      items: [...cart],
      total: data.order.total,
      status: data.order.status,
    };

    const existingOrders = JSON.parse(
      localStorage.getItem("climoraone_orders") || "[]"
    );

    localStorage.setItem(
      "climoraone_orders",
      JSON.stringify([...existingOrders, savedOrder])
    );

    clearCart();
    form.reset();
    setShowCheckout(false);
    setOrderSuccess(savedOrder);

    window.setTimeout(() => {
      document
        .getElementById("order-success")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 100);
  } catch (error) {
    console.error("Order submission failed:", error);

    setOrderError(
      error instanceof Error
        ? error.message
        : "Order submission failed. Please try again."
    );
  } finally {
    setIsSubmittingOrder(false);
  }
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
                  onClick={proceedToCheckout}
                  disabled={cart.length === 0}
                >
                  Proceed to Checkout
                </button>
                </aside>
              </div>
            )}
          </div>
        </section>

        {showCheckout && cart.length > 0 && (
  <section id="checkout" className="checkout-section">
    <div className="checkout-shell">
      <div className="checkout-card">
        <div className="checkout-heading">
          <span className="checkout-heading__leaf" aria-hidden="true">
            🌿
          </span>

          <div>
            <h2>Delivery Details</h2>
            <p>
              Enter your contact and delivery information to place
              the order.
            </p>
          </div>
        </div>

        <form className="checkout-form" onSubmit={submitOrder}>
          <div className="checkout-field checkout-field--full">
            <label htmlFor="customerName">
              Full Name <span>*</span>
            </label>

            <input
              id="customerName"
              name="customerName"
              type="text"
              autoComplete="name"
              placeholder="Enter your full name"
              minLength="2"
              maxLength="100"
              required
            />
          </div>

          <div className="checkout-field">
            <label htmlFor="email">
              Email Address <span>*</span>
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              maxLength="255"
              required
            />
          </div>

          <div className="checkout-field">
            <label htmlFor="phone">
              Phone Number <span>*</span>
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="10-digit mobile number"
              pattern="[0-9]{10}"
              maxLength="10"
              title="Phone number must contain exactly 10 digits"
              required
            />
          </div>

          <div className="checkout-field checkout-field--full">
            <label htmlFor="address">
              Full Address <span>*</span>
            </label>

            <textarea
              id="address"
              name="address"
              autoComplete="street-address"
              placeholder="House number, street, area and landmark"
              minLength="10"
              maxLength="500"
              rows="4"
              required
            />
          </div>

          <div className="checkout-field">
            <label htmlFor="city">
              City <span>*</span>
            </label>

            <input
              id="city"
              name="city"
              type="text"
              autoComplete="address-level2"
              placeholder="City"
              maxLength="100"
              required
            />
          </div>

          <div className="checkout-field">
            <label htmlFor="state">
              State <span>*</span>
            </label>

            <input
              id="state"
              name="state"
              type="text"
              autoComplete="address-level1"
              placeholder="State"
              maxLength="100"
              required
            />
          </div>

          <div className="checkout-field">
            <label htmlFor="pincode">
              Pincode <span>*</span>
            </label>

            <input
              id="pincode"
              name="pincode"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="6-digit pincode"
              pattern="[0-9]{6}"
              maxLength="6"
              title="Pincode must contain exactly 6 digits"
              required
            />
          </div>

          <div className="checkout-total-card">
            <div>
              <span>Items</span>
              <strong>{cartCount}</strong>
            </div>

            <div className="checkout-total-card__amount">
              <span>Order Total</span>
              <strong>₹{total}</strong>
            </div>
          </div>

          {orderError && (
            <div className="checkout-error" role="alert">
              {orderError}
            </div>
          )}

          <div className="checkout-security-note">
            <span aria-hidden="true">🔒</span>
            <p>
              Your contact and delivery information will only be used
              to process this order.
            </p>
          </div>

          <div className="checkout-actions">
            <button
              type="button"
              className="checkout-cancel"
              onClick={() => {
                setShowCheckout(false);
                setOrderError("");

                window.setTimeout(() => {
                  document
                    .getElementById("cart")
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                }, 100);
              }}
              disabled={isSubmittingOrder}
            >
              Back to Cart
            </button>

            <button
              type="submit"
              className="checkout-submit"
              disabled={isSubmittingOrder}
            >
              {isSubmittingOrder
                ? "Placing Order..."
                : "Place Mock Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
)}
            
        </>
      )}

      {orderSuccess && (
  <section
    id="order-success"
    className="order-success"
    role="status"
  >
    <div className="order-success__icon" aria-hidden="true">
      🌿
    </div>

    <h2>Order Placed Successfully</h2>

    <p>Your order number is:</p>

    <strong className="order-success__number">
      {orderSuccess.id}
    </strong>

    <p>
      We will send payment and delivery updates shortly.
    </p>

    <button
      type="button"
      className="btn"
      onClick={() => {
        setOrderSuccess(null);
        scrollToSection("products");
      }}
    >
      Continue Shopping
    </button>
  </section>
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