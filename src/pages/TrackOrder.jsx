import { Link } from "react-router-dom";
import { useState } from "react";
import "../App.css";
import { API_BASE_URL } from "../config/api";
import { BrandLogo } from "../components/BrandLogo";

const timelineSteps = [
  "Order Received",
  "Item Packed",
  "Shipped",
  "Out For Delivery",
  "Delivered",
];

function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [matchedOrder, setMatchedOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const buildSteps = (order) => {
    let history = {};
    try {
      history = order.status_history ? JSON.parse(order.status_history) : {};
    } catch {
      history = {};
    }

    const currentIndex = timelineSteps.indexOf(order.status);
    return timelineSteps.map((step, index) => ({
      name: step,
      completed:
        step === "Order Received" ||
        history[step] ||
        (currentIndex >= 0 && index <= currentIndex),
      completedAt:
        history[step] ||
        (step === "Order Received" && order.created_at
          ? new Date(order.created_at).toLocaleString()
          : null),
    }));
  };

  const handleTrack = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/track-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          order_number: orderId.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMatchedOrder(null);
        setError(data?.message || "No order found with these details.");
        return;
      }

      setMatchedOrder({
        id: data.order_number,
        customerName: data.customer_name,
        total: data.total,
        status: data.status,
        items: data.items || [],
        createdAt: data.created_at,
        steps: buildSteps(data),
      });
    } catch (requestError) {
      console.error("Track order failed:", requestError);
      setMatchedOrder(null);
      setError("Unable to check the order right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tracking-page">
      <header className="tracking-header">
        <Link to="/" className="tracking-brand" aria-label="Climoraone store">
          <BrandLogo className="brand-logo" />
        </Link>
        <Link to="/" className="tracking-back-link">Back to Store</Link>
      </header>

      <main className="tracking-main">
        <section className="tracking-intro">
          <span className="tracking-eyebrow">Order updates</span>
          <h1>Track your order</h1>
          <p>Enter the order number from your confirmation and the 10-digit phone number used at checkout.</p>
        </section>

        <section className="tracking-card">
          <form className="tracking-form" onSubmit={handleTrack}>
            <label>
              <span>Order number</span>
              <input
                placeholder="CLM-2026-XXXXXXXX"
                value={orderId}
                onChange={(event) => setOrderId(event.target.value.toUpperCase())}
                autoComplete="off"
                required
              />
            </label>

            <label>
              <span>Phone number</span>
              <input
                placeholder="10-digit phone number"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength="10"
                required
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? "Checking..." : "Track Order"}
            </button>
          </form>

          {error && <div className="tracking-error" role="alert">{error}</div>}
        </section>

        {matchedOrder && (
          <section className="tracking-result-card">
            <div className="tracking-order-header">
              <div>
                <span>Order number</span>
                <h2>{matchedOrder.id}</h2>
                <p>Placed {new Date(matchedOrder.createdAt).toLocaleString()}</p>
              </div>
              <span className="tracking-status">{matchedOrder.status}</span>
            </div>

            <div className="tracking-summary-grid">
              <div><span>Customer</span><strong>{matchedOrder.customerName}</strong></div>
              <div><span>Total</span><strong>₹{matchedOrder.total}</strong></div>
              <div><span>Items</span><strong>{matchedOrder.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</strong></div>
            </div>

            <div className="tracking-items">
              <h3>Items ordered</h3>
              {matchedOrder.items.map((item) => (
                <div className="tracking-item-row" key={item.id}>
                  <div>
                    <strong>{item.product_name}</strong>
                    <span>Quantity: {item.quantity}</span>
                  </div>
                  <strong>₹{item.subtotal || Number(item.price) * Number(item.quantity)}</strong>
                </div>
              ))}
            </div>

            <div className="tracking-timeline-wrap">
              <h3>Order progress</h3>
              <div className="tracking-timeline">
                {matchedOrder.steps.map((step) => (
                  <div key={step.name} className={step.completed ? "tracking-step completed" : "tracking-step"}>
                    <span className="tracking-step-dot">{step.completed ? "✓" : ""}</span>
                    <div>
                      <strong>{step.name}</strong>
                      {step.completedAt && <small>{new Date(step.completedAt).toLocaleString()}</small>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="tracking-footer">
        <BrandLogo className="brand-logo brand-logo--footer" />
        <span>© 2026 Climoraone. All rights reserved.</span>
      </footer>
    </div>
  );
}

export default TrackOrder;
