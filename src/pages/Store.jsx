import { useState } from "react";
import "../App.css";
import products from "../data/products";

function Store() {
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const categories = ["All", "Religious", "Toys", "Home Decor"];

  const filteredProducts = products.filter((product) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      product.name.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search);

    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const openProduct = (product) => {
    setSelectedProduct(product);
    setSelectedImage(product.images[0]);
    setQuantity(1);
    setShowCheckout(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addToCart = (product, qty = 1) => {
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: qty }]);
    }
  };

  const increaseQty = (id) => {
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQty = (id) => {
    setCart(
      cart
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const buyNow = () => {
    const existing = cart.find((item) => item.id === selectedProduct.id);

    if (!existing) {
      addToCart(selectedProduct, quantity);
    }

    setSelectedProduct(null);

    setTimeout(() => {
      document.getElementById("cart")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const proceedToCheckout = () => {
    setShowCheckout(true);
    setOrderSuccess(null);

    setTimeout(() => {
      document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div>
    <header className="header">
    <div className="logo-section">
        <img
        src="/images/logo.jpeg"
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
        onChange={(e) => {
            setSearchTerm(e.target.value);
            setSelectedProduct(null);
            setShowCheckout(false);
        }}
        />

        <button
        className="mobile-menu-icon"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
        ☰
        </button>
    </div>

    <nav className="header-nav">
        <a href="#home">Home</a>
        <a href="#products">Products</a>
        <a href="#cart">Cart ({cartCount})</a>
    </nav>

    {showMobileMenu && (
        <div className="mobile-dropdown">
        <a href="#home" onClick={() => setShowMobileMenu(false)}>Home</a>
        <a href="#products" onClick={() => setShowMobileMenu(false)}>Products</a>
        <a href="#cart" onClick={() => setShowMobileMenu(false)}>Cart ({cartCount})</a>
        <a href="/contact" onClick={() => setShowMobileMenu(false)}>Contact</a>
        </div>
    )}
    </header>
      {selectedProduct ? (
        <section className="product-detail">
          <button className="back-btn" onClick={() => setSelectedProduct(null)}>
            ← Back to Products
          </button>

          <div className="detail-layout">
            <div className="thumbs">
              {selectedProduct.images.map((img) => (
                <img
                  key={img}
                  src={img}
                  alt={selectedProduct.name}
                  onClick={() => setSelectedImage(img)}
                  className={selectedImage === img ? "active-thumb" : ""}
                />
              ))}
            </div>

            <div className="main-image-box">
              <img src={selectedImage} alt={selectedProduct.name} />
            </div>

            <div className="detail-info">
              <p className="eco-label">{selectedProduct.category}</p>
              <h2>{selectedProduct.name}</h2>
              <h3>₹{selectedProduct.price}</h3>
              <p>{selectedProduct.description}</p>

              <div className="quantity-box">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  -
                </button>
                <strong>{quantity}</strong>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>

              <div className="detail-actions">
                <button
                  onClick={() => {
                    addToCart(selectedProduct, quantity);
                    setSelectedProduct(null);
                    setTimeout(() => {
                      document
                        .getElementById("cart")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                >
                  Add to Cart
                </button>

                <button className="buy-btn" onClick={buyNow}>
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
              <span className="tag">Eco-friendly • Handmade • Women-led</span>
              <h2>Nature-inspired products crafted by rural women artisans</h2>
              <p>
                Climoraone is a social enterprise that empowers rural women by
                helping them create and sell eco-friendly handcrafted products
                made from wood, cloth, and sustainable materials.
              </p>
              <a href="#products" className="btn">
                Explore Products
              </a>
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
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={
                    selectedCategory === cat
                      ? "category-btn active-category"
                      : "category-btn"
                  }
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="product-grid">
              {filteredProducts.length === 0 ? (
                <p>No products found.</p>
              ) : (
                filteredProducts.map((product) => (
                  <div className="product-card" key={product.id}>
                    <img src={product.images[0]} alt={product.name} />
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                      <h4>₹{product.price}</h4>
                      <button onClick={() => openProduct(product)}>
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}

      <section id="cart" className="cart">
        <h2>Your Cart</h2>

        {cart.length === 0 ? (
          <p>No products added yet.</p>
        ) : (
          <>
            {cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <span>{item.name}</span>
                <div>
                  <button onClick={() => decreaseQty(item.id)}>-</button>
                  <strong>{item.quantity}</strong>
                  <button onClick={() => increaseQty(item.id)}>+</button>
                </div>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}

            <h3>Total: ₹{total}</h3>

            <button className="checkout-btn" onClick={proceedToCheckout}>
              Proceed to Checkout
            </button>
          </>
        )}
      </section>

      {showCheckout && (
        <section id="checkout" className="checkout">
          <h2>Checkout</h2>

          <form
            className="checkout-form"
            onSubmit={(e) => {
              e.preventDefault();

              const form = e.target;

              const newOrder = {
                id: "ORD" + Date.now(),
                createdAt: new Date().toISOString(),
                customerName: form.customerName.value,
                email: form.email.value,
                phone: form.phone.value,
                address: form.address.value,
                city: form.city.value,
                state: form.state.value,
                pincode: form.pincode.value,
                items: cart,
                total: total,
                status: "Payment Pending",
              };

              const existingOrders =
                JSON.parse(localStorage.getItem("climoraone_orders")) || [];

              localStorage.setItem(
                "climoraone_orders",
                JSON.stringify([...existingOrders, newOrder])
              );

              setOrderSuccess(newOrder);
              setShowCheckout(false);
              setCart([]);

              setTimeout(() => {
                document
                  .getElementById("order-success")
                  ?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
          >
            <input name="customerName" placeholder="Full Name" required />
            <input name="email" type="email" placeholder="Email" required />

            <input
              name="phone"
              placeholder="Phone Number"
              required
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength="10"
              title="Phone number must be exactly 10 digits"
            />

            <textarea name="address" placeholder="Full Address" required />
            <input name="city" placeholder="City" required />
            <input name="state" placeholder="State" required />

            <input
              name="pincode"
              placeholder="Pincode"
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength="6"
              title="Pincode must be exactly 6 digits"
            />

            <button type="submit">Place Mock Order</button>
          </form>
        </section>
      )}

      {orderSuccess && (
        <section id="order-success" className="order-success">
          <h2>Order Placed Successfully</h2>
          <p>Your order ID is:</p>
          <h3>{orderSuccess.id}</h3>
          <p>We will send payment and delivery updates shortly.</p>
        </section>
      )}

      <footer className="footer">
    <div className="footer-content">
        <div>
        <img src="/images/logo.jpeg" alt="Climoraone" className="footer-logo" />
        <p>
            Eco-friendly handmade products supporting rural women artisans across India.
        </p>
        </div>

        <div>
        <h4>Quick Links</h4>
        <a href="/">Home</a>
        <a href="#products">Products</a>
        <a href="/contact">Contact Us</a>
        <a href="/track-order">Track Order</a>
        </div>

        <div>
        <h4>Policies</h4>
        <a href="/return-policy">Return Policy</a>
        <a href="/shipping-policy">Shipping Policy</a>
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