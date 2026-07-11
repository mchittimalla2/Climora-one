import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../App.css";
import products from "../data/products";
import { useCart } from "../context/CartContext";

function Store() {
  const {
    addToCart,
    cartCount,
  } = useCart();

  const navigate = useNavigate();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
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
      selectedCategory === "All" ||
      product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const openProduct = (product) => {
    setSelectedProduct(product);
    setSelectedImage(product.images[0]);
    setQuantity(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buyNow = () => {
    if (!selectedProduct) {
      return;
    }

    const result = addToCart(selectedProduct, quantity);

    if (!result.success) {
      alert(result.message);
      return;
    }

    setSelectedProduct(null);
    navigate("/cart");
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
          onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedProduct(null);
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
                    const result = addToCart(selectedProduct, quantity);

                    if (!result.success) {
                      alert(result.message);
                      return;
                    }

                    setSelectedProduct(null);
                    navigate("/cart");
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
      <footer className="footer">
    <div className="footer-content">
        <div>
        <img src={`${import.meta.env.BASE_URL}images/logo.jpeg`} alt="Climoraone" className="footer-logo" />
        <p>
            Eco-friendly handmade products supporting rural women artisans across India.
        </p>
        </div>

        <div>
        <h4>Quick Links</h4>
        <Link to="/">Home</Link>
        <Link to="/products">Products</Link>
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