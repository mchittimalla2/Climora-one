import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import "../App.css";
import { API_BASE_URL } from "../config/api";
import { useCart } from "../context/CartContext";

function Checkout() {
  const navigate = useNavigate();

  const {
    cart,
    cartCount,
    total,
    clearCart,
  } = useCart();

  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(null);

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
      address: [
        form.address.value.trim(),
        form.addressLine2.value.trim(),
        ]
        .filter(Boolean)
        .join(", "),
      city: form.city.value.trim(),
      state: form.state.value.trim(),
      pincode: form.pincode.value.trim(),
      total,
      items: cart.map((item) => ({
        product_id: item.id ?? null,
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
        throw new Error(
          data?.message || "Unable to place the order."
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
      setOrderSuccess(savedOrder);
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

  if (orderSuccess) {
    return (
      <div className="checkout-page">
        <header className="checkout-header">
          <Link to="/" className="checkout-brand">
            <img
              src={`${import.meta.env.BASE_URL}images/logo.jpeg`}
              alt="Climoraone"
            />
          </Link>

          <span>Secure Checkout</span>
        </header>

        <main className="checkout-success-page">
          <div className="checkout-success-card">
            <div className="checkout-success-icon">✓</div>

            <h1>Order placed successfully</h1>

            <p>Your order number is</p>

            <strong>{orderSuccess.id}</strong>

            <p>
              We will send payment and delivery updates shortly.
            </p>

            <div className="checkout-success-actions">
              <Link to="/track-order" className="secondary-action">
                Track Order
              </Link>

              <Link to="/" className="primary-action">
                Continue Shopping
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="checkout-page">
        <header className="checkout-header">
          <Link to="/" className="checkout-brand">
            <img
              src={`${import.meta.env.BASE_URL}images/logo.jpeg`}
              alt="Climoraone"
            />
          </Link>

          <span>Secure Checkout</span>
        </header>

        <main className="checkout-empty-page">
          <div className="checkout-empty-card">
            <h1>Your cart is empty</h1>

            <p>Add products before continuing to checkout.</p>

            <Link to="/products" className="primary-action">
              Continue Shopping
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <Link to="/" className="checkout-brand">
          <img
            src={`${import.meta.env.BASE_URL}images/logo.jpeg`}
            alt="Climoraone"
          />
        </Link>

        <div className="checkout-header-right">
          <span>🔒 Secure Checkout</span>

          <button
            type="button"
            onClick={() => navigate("/cart")}
          >
            Back to Cart
          </button>
        </div>
      </header>

      <main className="checkout-main">
        <section className="checkout-form-panel">
          <div className="checkout-section-title">
            <span>1</span>

            <div>
              <h1>Delivery address</h1>
              <p>Enter the information required to deliver your order.</p>
            </div>
          </div>

        <form
  id="checkout-order-form"
  className="amazon-checkout-form"
  onSubmit={submitOrder}
>
  <div className="amazon-field">
    <label htmlFor="customerName">
      Full name <span>*</span>
    </label>

    <input
      id="customerName"
      name="customerName"
      type="text"
      autoComplete="name"
      minLength="2"
      maxLength="100"
      required
    />
  </div>

  <div className="amazon-field">
    <label htmlFor="phone">
      Phone number <span>*</span>
    </label>

    <input
      id="phone"
      name="phone"
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      pattern="[0-9]{10}"
      maxLength="10"
      title="Phone number must contain exactly 10 digits"
      required
    />

    <small>Used to assist with delivery.</small>
  </div>

  <div className="amazon-field">
    <label htmlFor="email">
      Email address <span>*</span>
    </label>

    <input
      id="email"
      name="email"
      type="email"
      autoComplete="email"
      maxLength="255"
      required
    />
  </div>

  <div className="amazon-field">
    <label htmlFor="address">
      Address <span>*</span>
    </label>

    <input
      id="address"
      name="address"
      type="text"
      autoComplete="address-line1"
      placeholder="House number, street name"
      minLength="5"
      maxLength="300"
      required
    />

    <input
      id="addressLine2"
      name="addressLine2"
      type="text"
      autoComplete="address-line2"
      placeholder="Apartment, area, landmark (optional)"
      maxLength="200"
    />
  </div>

  <div className="amazon-address-row">
    <div className="amazon-field">
      <label htmlFor="city">
        City <span>*</span>
      </label>

      <input
        id="city"
        name="city"
        type="text"
        autoComplete="address-level2"
        maxLength="100"
        required
      />
    </div>

    <div className="amazon-field">
      <label htmlFor="state">
        State <span>*</span>
      </label>

      <select
        id="state"
        name="state"
        autoComplete="address-level1"
        required
        defaultValue=""
      >
        <option value="" disabled>
          Select
        </option>
        <option value="Andhra Pradesh">Andhra Pradesh</option>
        <option value="Karnataka">Karnataka</option>
        <option value="Kerala">Kerala</option>
        <option value="Maharashtra">Maharashtra</option>
        <option value="Tamil Nadu">Tamil Nadu</option>
        <option value="Telangana">Telangana</option>
        <option value="Other">Other</option>
      </select>
    </div>

    <div className="amazon-field">
      <label htmlFor="pincode">
        Pincode <span>*</span>
      </label>

      <input
        id="pincode"
        name="pincode"
        type="text"
        inputMode="numeric"
        autoComplete="postal-code"
        pattern="[0-9]{6}"
        maxLength="6"
        title="Pincode must contain exactly 6 digits"
        required
      />
    </div>
  </div>

  {orderError && (
    <div className="checkout-error" role="alert">
      {orderError}
    </div>
  )}

  <div className="checkout-mobile-submit">
    <button type="submit" disabled={isSubmittingOrder}>
      {isSubmittingOrder
        ? "Placing Order..."
        : `Place Order • ₹${total}`}
    </button>
  </div>
</form>
</section>
        <aside className="checkout-summary-panel">
          <h2>Order Summary</h2>

          <div className="checkout-summary-items">
            {cart.map((item) => (
              <div className="checkout-summary-item" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    Qty: {item.quantity} × ₹{item.price}
                  </span>
                </div>

                <strong>
                  ₹{Number(item.price) * item.quantity}
                </strong>
              </div>
            ))}
          </div>

          <div className="checkout-summary-divider" />

          <div className="checkout-summary-row">
            <span>Items</span>
            <strong>{cartCount}</strong>
          </div>

          <div className="checkout-summary-row">
            <span>Delivery</span>
            <strong>Free</strong>
          </div>

          <div className="checkout-summary-total">
            <span>Total</span>
            <strong>₹{total}</strong>
          </div>

          <button
            type="submit"
            form="checkout-order-form"
            className="checkout-desktop-submit"
            disabled={isSubmittingOrder}
          >
            {isSubmittingOrder
              ? "Placing Order..."
              : "Place Order"}
          </button>

          <div className="checkout-trust-note">
            <span>🔒</span>

            <p>
              Your information is used only to process and deliver
              this order.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default Checkout;