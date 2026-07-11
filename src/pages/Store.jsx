import { Link } from "react-router-dom";
import { useState } from "react";
import "../App.css";
import products from "../data/products";
import { API_BASE_URL } from "../config/api";
import { useCart } from "../context/CartContext";

function Store() {
  const { cart,
  addToCart,
  cartCount,
} = useCart();
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

 

  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    if (existingItem.quantity >= Number(product.stock)) {
      alert(`Only ${product.stock} items available in stock.`);
      return;
    }

    setCart(
      cart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  } else {
    setCart([...cart, { ...product, quantity: 1 }]);
  }
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
          <Link to="/home">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/cart">Cart ({cartCount})</Link>
      </nav>

      {showMobileMenu && (
          <div className="mobile-dropdown">
            <Link to="/home" onClick={() => setShowMobileMenu(false)}>
              Home
            </Link>

            <Link to="/products" onClick={() => setShowMobileMenu(false)}>
              Products
            </Link>

            <Link
            to="/cart"
            onClick={() => setShowMobileMenu(false)}
          >
            Cart ({cartCount})
          </Link>

            <Link to="/contact" onClick={() => setShowMobileMenu(false)}>
              Contact
            </Link>
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
      {showCheckout && (
        <section id="checkout" className="checkout">
          <h2>Checkout</h2>

          <form
              className="checkout-form"
              onSubmit={async (e) => {
                e.preventDefault();

                const form = e.target;

                const orderPayload = {
                  customer_name: form.customerName.value,
                  email: form.email.value,
                  phone: form.phone.value,
                  address: form.address.value,
                  city: form.city.value,
                  state: form.state.value,
                  pincode: form.pincode.value,
                  total: total,
                  items: cart.map((item) => ({
                    product_id: null,
                    product_name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                  })),
                };

                try {
                  const response = await fetch(`${API_BASE_URL}/api/orders`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(orderPayload),
                  });

                  const data = await response.json();

                  if (!response.ok) {
                    console.error("Order API error:", data);
                    alert("Order failed. Please check console.");
                    return;
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
                    items: cart,
                    total: data.order.total,
                    status: data.order.status,
                  };

                  const existingOrders =
                    JSON.parse(localStorage.getItem("climoraone_orders")) || [];

                  localStorage.setItem(
                    "climoraone_orders",
                    JSON.stringify([...existingOrders, savedOrder])
                  );

                  setOrderSuccess(savedOrder);
                  setShowCheckout(false);
                  setCart([]);

                  setTimeout(() => {
                    document
                      .getElementById("order-success")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                } catch (error) {
                  console.error("Order submission failed:", error);
                  alert("Order submission failed. Backend may not be running.");
                }
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
        <Link to="/">Home</Link>
        <a href="#products">Products</a>
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