import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import "../App.css";
import { API_BASE_URL } from "../config/api";
import { useCart } from "../context/CartContext";
import { BrandLogo } from "../components/BrandLogo";
import { loadRazorpayCheckout } from "../services/razorpay";

const INDIA_STATES = [
  "Andhra Pradesh",
  "Karnataka",
  "Kerala",
  "Maharashtra",
  "Tamil Nadu",
  "Telangana",
  "Other",
];

function Checkout() {
  const navigate = useNavigate();
  const { cart, cartCount, total, clearCart } = useCart();
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(null);

  const parseResponse = async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const validationErrors = data?.errors
        ? Object.values(data.errors).flat().join(" ")
        : "";
      throw new Error(validationErrors || data?.message || "The request could not be completed.");
    }
    return data;
  };

  const saveConfirmedOrder = (order) => {
    const savedOrder = {
      id: order.order_number,
      createdAt: order.created_at,
      customerName: order.customer_name,
      email: order.email,
      phone: order.phone,
      address: order.address,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
      items: order.items || [...cart],
      total: order.total,
      status: order.status,
      paymentStatus: order.payment_status,
    };

    const existingOrders = JSON.parse(localStorage.getItem("climoraone_orders") || "[]");
    localStorage.setItem("climoraone_orders", JSON.stringify([...existingOrders, savedOrder]));
    clearCart();
    setOrderSuccess(savedOrder);
  };

  const recordCancellation = async (orderNumber, razorpayOrderId) => {
    try {
      await fetch(`${API_BASE_URL}/api/payments/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          order_number: orderNumber,
          razorpay_order_id: razorpayOrderId,
        }),
      });
    } catch (error) {
      console.error("Unable to record payment cancellation:", error);
    }
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    if (cart.length === 0 || isSubmittingOrder) return;

    const form = event.currentTarget;
    const orderPayload = {
      customer_name: form.customerName.value.trim(),
      email: form.email.value.trim().toLowerCase(),
      phone: form.phone.value.trim(),
      address: [form.address.value.trim(), form.addressLine2.value.trim()].filter(Boolean).join(", "),
      city: form.city.value.trim(),
      state: form.state.value.trim(),
      pincode: form.pincode.value.trim(),
      items: cart.map((item) => ({
        product_id: Number(item.id),
        quantity: Number(item.quantity),
      })),
    };

    try {
      setIsSubmittingOrder(true);
      setOrderError("");

      const loaded = await loadRazorpayCheckout();
      if (!loaded) throw new Error("Secure payment checkout could not be loaded. Please try again.");

      const createResponse = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(orderPayload),
      });
      const paymentOrder = await parseResponse(createResponse);

      const options = {
        key: paymentOrder.key_id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "Climoraone",
        description: `Order ${paymentOrder.order.order_number}`,
        order_id: paymentOrder.razorpay_order_id,
        prefill: {
          name: orderPayload.customer_name,
          email: orderPayload.email,
          contact: orderPayload.phone,
        },
        notes: {
          internal_order_number: paymentOrder.order.order_number,
        },
        theme: {},
        handler: async (razorpayResponse) => {
          try {
            const verifyResponse = await fetch(`${API_BASE_URL}/api/payments/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify({
                order_number: paymentOrder.order.order_number,
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
              }),
            });
            const verified = await parseResponse(verifyResponse);
            saveConfirmedOrder(verified.order);
          } catch (error) {
            setOrderError(error instanceof Error ? error.message : "Payment succeeded but confirmation is pending. Contact support with your order number.");
          } finally {
            setIsSubmittingOrder(false);
          }
        },
        modal: {
          ondismiss: () => {
            recordCancellation(paymentOrder.order.order_number, paymentOrder.razorpay_order_id);
            setOrderError("Payment was cancelled. Your order was not confirmed.");
            setIsSubmittingOrder(false);
          },
        },
      };

      const checkout = new window.Razorpay(options);
      checkout.on("payment.failed", (response) => {
        const reason = response?.error?.description || "Payment failed. Please try another payment method.";
        setOrderError(reason);
        setIsSubmittingOrder(false);
      });
      checkout.open();
    } catch (error) {
      console.error("Payment initialization failed:", error);
      setOrderError(error instanceof Error ? error.message : "Payment could not be started. Please try again.");
      setIsSubmittingOrder(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="checkout-page">
        <header className="checkout-header">
          <Link to="/" className="checkout-brand"><BrandLogo className="brand-logo" /></Link>
          <span>Secure Checkout</span>
        </header>
        <main className="checkout-success-page">
          <div className="checkout-success-card">
            <div className="checkout-success-icon">✓</div>
            <h1>Payment successful</h1>
            <p>Your confirmed order number is</p>
            <strong>{orderSuccess.id}</strong>
            <p>A confirmation email has been sent to {orderSuccess.email}.</p>
            <div className="checkout-success-actions">
              <Link to="/track-order" className="secondary-action">Track Order</Link>
              <Link to="/" className="primary-action">Continue Shopping</Link>
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
          <Link to="/" className="checkout-brand"><BrandLogo className="brand-logo" /></Link>
          <span>Secure Checkout</span>
        </header>
        <main className="checkout-empty-page">
          <div className="checkout-empty-card">
            <h1>Your cart is empty</h1>
            <p>Add products before continuing to checkout.</p>
            <Link to="/products" className="primary-action">Continue Shopping</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <Link to="/" className="checkout-brand"><BrandLogo className="brand-logo" /></Link>
        <div className="checkout-header-right">
          <span>🔒 Secure Payment</span>
          <button type="button" onClick={() => navigate("/cart")}>Back to Cart</button>
        </div>
      </header>

      <main className="checkout-main">
        <section className="checkout-form-panel">
          <div className="checkout-section-title">
            <span>1</span>
            <div><h1>Delivery address</h1><p>Enter the information required to deliver your order.</p></div>
          </div>

          <form id="checkout-order-form" className="amazon-checkout-form" onSubmit={submitOrder}>
            <div className="amazon-field">
              <label htmlFor="customerName">Full name <span>*</span></label>
              <input id="customerName" name="customerName" type="text" autoComplete="name" minLength="2" maxLength="100" required />
            </div>
            <div className="amazon-field">
              <label htmlFor="phone">Phone number <span>*</span></label>
              <input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel" pattern="[0-9]{10}" maxLength="10" title="Phone number must contain exactly 10 digits" required />
              <small>Used for payment and delivery updates.</small>
            </div>
            <div className="amazon-field">
              <label htmlFor="email">Email address <span>*</span></label>
              <input id="email" name="email" type="email" autoComplete="email" maxLength="255" required />
            </div>
            <div className="amazon-field">
              <label htmlFor="address">Address <span>*</span></label>
              <input id="address" name="address" type="text" autoComplete="address-line1" placeholder="House number, street name" minLength="5" maxLength="300" required />
              <input id="addressLine2" name="addressLine2" type="text" autoComplete="address-line2" placeholder="Apartment, area, landmark (optional)" maxLength="200" />
            </div>
            <div className="amazon-address-row">
              <div className="amazon-field">
                <label htmlFor="city">City <span>*</span></label>
                <input id="city" name="city" type="text" autoComplete="address-level2" maxLength="100" required />
              </div>
              <div className="amazon-field">
                <label htmlFor="state">State <span>*</span></label>
                <select id="state" name="state" autoComplete="address-level1" required defaultValue="">
                  <option value="" disabled>Select</option>
                  {INDIA_STATES.map((state) => <option value={state} key={state}>{state}</option>)}
                </select>
              </div>
              <div className="amazon-field">
                <label htmlFor="pincode">Pincode <span>*</span></label>
                <input id="pincode" name="pincode" type="text" inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{6}" maxLength="6" title="Pincode must contain exactly 6 digits" required />
              </div>
            </div>
            {orderError && <div className="checkout-error" role="alert">{orderError}</div>}
            <div className="checkout-mobile-submit">
              <button type="submit" disabled={isSubmittingOrder}>{isSubmittingOrder ? "Opening Secure Payment..." : `Pay Securely • ₹${total}`}</button>
            </div>
          </form>
        </section>

        <aside className="checkout-summary-panel">
          <h2>Order Summary</h2>
          <div className="checkout-summary-items">
            {cart.map((item) => (
              <div className="checkout-summary-item" key={item.id}>
                <div><strong>{item.name}</strong><span>Qty: {item.quantity} × ₹{item.price}</span></div>
                <strong>₹{Number(item.price) * item.quantity}</strong>
              </div>
            ))}
          </div>
          <div className="checkout-summary-divider" />
          <div className="checkout-summary-row"><span>Items</span><strong>{cartCount}</strong></div>
          <div className="checkout-summary-row"><span>Delivery</span><strong>Free</strong></div>
          <div className="checkout-summary-total"><span>Total</span><strong>₹{total}</strong></div>
          <button type="submit" form="checkout-order-form" className="checkout-desktop-submit" disabled={isSubmittingOrder}>
            {isSubmittingOrder ? "Opening Secure Payment..." : "Pay with Razorpay"}
          </button>
          <div className="checkout-trust-note"><span>🔒</span><p>Your payment is processed securely by Razorpay. Climoraone never stores card or UPI credentials.</p></div>
        </aside>
      </main>
    </div>
  );
}

export default Checkout;
