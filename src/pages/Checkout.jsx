import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import "../App.css";
import "../styles/CheckoutExperience.css";
import { API_BASE_URL } from "../config/api";
import { useCart } from "../context/CartContext";
import { BrandLogo } from "../components/BrandLogo";
import { loadRazorpayCheckout } from "../services/razorpay";

const INDIA_STATES = [
  "Andhra Pradesh", "Karnataka", "Kerala", "Maharashtra", "Tamil Nadu", "Telangana", "Other",
];

function Checkout() {
  const navigate = useNavigate();
  const { cart, cartCount, total, clearCart } = useCart();
  const [checkoutStep, setCheckoutStep] = useState("address");
  const [orderPayload, setOrderPayload] = useState(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [paymentState, setPaymentState] = useState(null);

  const parseResponse = async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const validationErrors = data?.errors ? Object.values(data.errors).flat().join(" ") : "";
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
      paymentMethod: order.payment?.method || "Online payment",
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
        body: JSON.stringify({ order_number: orderNumber, razorpay_order_id: razorpayOrderId }),
      });
    } catch (error) {
      console.error("Unable to record payment cancellation:", error);
    }
  };

  const prepareReview = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
      customer_name: form.customerName.value.trim(),
      email: form.email.value.trim().toLowerCase(),
      phone: form.phone.value.trim(),
      address: [form.address.value.trim(), form.addressLine2.value.trim()].filter(Boolean).join(", "),
      city: form.city.value.trim(),
      state: form.state.value.trim(),
      pincode: form.pincode.value.trim(),
      items: cart.map((item) => ({ product_id: Number(item.id), quantity: Number(item.quantity) })),
    };
    setOrderPayload(payload);
    setOrderError("");
    setCheckoutStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startPayment = async () => {
    if (!orderPayload || cart.length === 0 || isSubmittingOrder) return;

    try {
      setIsSubmittingOrder(true);
      setOrderError("");
      setPaymentState(null);

      const loaded = await loadRazorpayCheckout();
      if (!loaded) throw new Error("Secure payment checkout could not be loaded. Please try again.");

      const createResponse = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(orderPayload),
      });
      const paymentOrder = await parseResponse(createResponse);

      const checkout = new window.Razorpay({
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
        notes: { internal_order_number: paymentOrder.order.order_number },
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
            setPaymentState("failed");
            setOrderError(error instanceof Error ? error.message : "Payment succeeded but confirmation is pending. Contact support with your order number.");
          } finally {
            setIsSubmittingOrder(false);
          }
        },
        modal: {
          ondismiss: () => {
            recordCancellation(paymentOrder.order.order_number, paymentOrder.razorpay_order_id);
            setPaymentState("cancelled");
            setIsSubmittingOrder(false);
          },
        },
      });

      checkout.on("payment.failed", (response) => {
        setPaymentState("failed");
        setOrderError(response?.error?.description || "Payment failed. Please try another payment method.");
        setIsSubmittingOrder(false);
      });
      checkout.open();
    } catch (error) {
      console.error("Payment initialization failed:", error);
      setPaymentState("failed");
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
          <div className="checkout-success-card premium-result-card">
            <div className="checkout-success-icon">✓</div>
            <p className="result-eyebrow">Order confirmed</p>
            <h1>Thank you for your order!</h1>
            <p>Your payment was successful and your handcrafted order is being prepared with care.</p>
            <div className="confirmation-grid">
              <div><span>Order number</span><strong>{orderSuccess.id}</strong></div>
              <div><span>Amount paid</span><strong>₹{Number(orderSuccess.total).toFixed(2)}</strong></div>
              <div><span>Payment</span><strong>{orderSuccess.paymentMethod}</strong></div>
              <div><span>Estimated delivery</span><strong>4–6 business days</strong></div>
            </div>
            <p className="confirmation-email">A detailed confirmation email has been sent to {orderSuccess.email}.</p>
            <div className="checkout-success-actions">
              <Link to="/track-order" className="secondary-action">Track Order</Link>
              <Link to="/" className="primary-action">Continue Shopping</Link>
            </div>
            <section className="success-impact-strip" aria-label="Climoraone social impact">
              <span>Our Promise</span>
              <h2>Every purchase empowers our partners.</h2>
              <p>Your order supports rural women, skilled artisans and meaningful livelihoods while helping preserve traditional craftsmanship.</p>
            </section>
          </div>
        </main>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="checkout-page">
        <header className="checkout-header"><Link to="/" className="checkout-brand"><BrandLogo className="brand-logo" /></Link><span>Secure Checkout</span></header>
        <main className="checkout-empty-page"><div className="checkout-empty-card"><h1>Your cart is empty</h1><p>Add products before continuing to checkout.</p><Link to="/products" className="primary-action">Continue Shopping</Link></div></main>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <Link to="/" className="checkout-brand"><BrandLogo className="brand-logo" /></Link>
        <div className="checkout-header-right"><span>🔒 Secure Payment</span><button type="button" onClick={() => navigate("/cart")}>Back to Cart</button></div>
      </header>

      <div className="checkout-progress" aria-label="Checkout progress">
        <div className="active"><span>1</span>Delivery Address</div><i />
        <div className={checkoutStep === "review" ? "active" : ""}><span>2</span>Review & Pay</div>
      </div>

      <main className="checkout-main premium-checkout-main">
        <section className="checkout-form-panel">
          {checkoutStep === "address" ? (
            <>
              <div className="checkout-section-title"><span>1</span><div><h1>Delivery address</h1><p>Enter the information required to deliver your order.</p></div></div>
              <form id="checkout-order-form" className="amazon-checkout-form" onSubmit={prepareReview}>
                <div className="amazon-field"><label htmlFor="customerName">Full name <span>*</span></label><input id="customerName" name="customerName" type="text" autoComplete="name" minLength="2" maxLength="100" required /></div>
                <div className="amazon-field"><label htmlFor="phone">Phone number <span>*</span></label><input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel" pattern="[0-9]{10}" maxLength="10" required /><small>Used for payment and delivery updates.</small></div>
                <div className="amazon-field"><label htmlFor="email">Email address <span>*</span></label><input id="email" name="email" type="email" autoComplete="email" maxLength="255" required /></div>
                <div className="amazon-field"><label htmlFor="address">Address <span>*</span></label><input id="address" name="address" type="text" autoComplete="address-line1" placeholder="House number, street name" minLength="5" maxLength="300" required /><input id="addressLine2" name="addressLine2" type="text" autoComplete="address-line2" placeholder="Apartment, area, landmark (optional)" maxLength="200" /></div>
                <div className="amazon-address-row">
                  <div className="amazon-field"><label htmlFor="city">City <span>*</span></label><input id="city" name="city" type="text" autoComplete="address-level2" maxLength="100" required /></div>
                  <div className="amazon-field"><label htmlFor="state">State <span>*</span></label><select id="state" name="state" autoComplete="address-level1" required defaultValue=""><option value="" disabled>Select</option>{INDIA_STATES.map((state) => <option value={state} key={state}>{state}</option>)}</select></div>
                  <div className="amazon-field"><label htmlFor="pincode">Pincode <span>*</span></label><input id="pincode" name="pincode" type="text" inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{6}" maxLength="6" required /></div>
                </div>
                <div className="checkout-mobile-submit"><button type="submit">Continue to Review</button></div>
              </form>
            </>
          ) : (
            <div className="review-panel">
              <div className="checkout-section-title"><span>2</span><div><h1>Review your order</h1><p>Confirm your delivery details before opening secure payment.</p></div></div>
              <div className="delivery-review-card">
                <div><h3>Deliver to</h3><button type="button" onClick={() => setCheckoutStep("address")}>Edit</button></div>
                <strong>{orderPayload.customer_name}</strong>
                <p>{orderPayload.address}, {orderPayload.city}, {orderPayload.state} – {orderPayload.pincode}</p>
                <p>{orderPayload.phone} · {orderPayload.email}</p>
              </div>
              <div className="delivery-promise"><span>🚚</span><div><strong>Estimated delivery</strong><p>Within 4–6 business days</p></div></div>
              {paymentState && (
                <div className={`payment-message ${paymentState}`} role="alert">
                  <h3>{paymentState === "cancelled" ? "Payment cancelled" : "Payment failed"}</h3>
                  <p>{paymentState === "cancelled" ? "Your cart is still available. Resume payment whenever you are ready." : orderError}</p>
                </div>
              )}
              {orderError && !paymentState && <div className="checkout-error" role="alert">{orderError}</div>}
              <button className="review-pay-button" type="button" onClick={startPayment} disabled={isSubmittingOrder}>
                {isSubmittingOrder ? "Preparing Secure Checkout..." : `Pay Securely • ₹${total}`}
              </button>
              <p className="payment-provider-note">🔒 Secure payment processed by Razorpay</p>
            </div>
          )}
        </section>

        <aside className="checkout-summary-panel">
          <h2>Order Summary</h2>
          <div className="checkout-summary-items">{cart.map((item) => <div className="checkout-summary-item" key={item.id}><div><strong>{item.name}</strong><span>Qty: {item.quantity} × ₹{item.price}</span></div><strong>₹{Number(item.price) * item.quantity}</strong></div>)}</div>
          <div className="checkout-summary-divider" />
          <div className="checkout-summary-row"><span>Price ({cartCount} {cartCount === 1 ? "item" : "items"})</span><strong>₹{total}</strong></div>
          <div className="checkout-summary-row"><span>Shipping</span><strong className="free-shipping">FREE</strong></div>
          <div className="checkout-summary-total"><span>Total</span><strong>₹{total}</strong></div>
          <div className="delivery-summary-badge">🚚 Delivery within 4–6 business days</div>
          {checkoutStep === "address" && <button type="submit" form="checkout-order-form" className="checkout-desktop-submit">Continue to Review</button>}
          {checkoutStep === "review" && <button type="button" className="checkout-desktop-submit" onClick={startPayment} disabled={isSubmittingOrder}>{isSubmittingOrder ? "Preparing Secure Checkout..." : "Pay Securely"}</button>}
          <div className="checkout-trust-list"><h3>Why shop with Climoraone?</h3><span>✓ Handmade products</span><span>✓ Secure payments via Razorpay</span><span>✓ Free shipping across India</span><span>✓ Delivery within 4–6 business days</span><span>✓ Dedicated customer support</span></div>
        </aside>
      </main>
    </div>
  );
}

export default Checkout;
