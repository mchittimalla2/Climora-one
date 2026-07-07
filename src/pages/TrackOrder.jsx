import { useState } from "react";
import "../App.css";
import { API_BASE_URL } from "../config/api";

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

  const handleTrack = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/api/track-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_number: orderId,
          phone: phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMatchedOrder(null);
        setError("No order found with this Order ID and phone number.");
        return;
      }

      setMatchedOrder({
        id: data.order_number,
        customerName: data.customer_name,
        phone: data.phone,
        email: data.email,
        total: data.total,
        status: data.status,
        items: data.items || [],
        createdAt: data.created_at,
        steps: buildSteps(data),
      });

      setError("");
    } catch (error) {
      console.error("Track order failed:", error);
      setError("Unable to connect to backend.");
    }
  };

  return (
    <div>
      <header className="simple-header">
        <img src="/images/logo.jpeg" alt="Climoraone" className="header-logo" />
        <a href="/">Back to Store</a>
      </header>

      <main className="page-container">
        <h1>Track Your Order</h1>

        <div className="policy-card">
          <form className="checkout-form" onSubmit={handleTrack}>
            <input
              placeholder="Enter Order ID"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              required
            />

            <input
              placeholder="Enter Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength="10"
              required
            />

            <button type="submit">Track Order</button>
          </form>

          {error && <p className="error-text">{error}</p>}

          {matchedOrder && (
            <div className="tracking-result">
              <h2>{matchedOrder.id}</h2>
              <p><strong>Customer:</strong> {matchedOrder.customerName}</p>
              <p><strong>Status:</strong> {matchedOrder.status}</p>
              <p><strong>Total:</strong> ₹{matchedOrder.total}</p>

              <h3>Items Ordered</h3>
              {matchedOrder.items.map((item) => (
                <div className="order-item-row" key={item.id}>
                  <span>{item.product_name}</span>
                  <span>Qty: {item.quantity}</span>
                  <strong>₹{item.subtotal || item.price * item.quantity}</strong>
                </div>
              ))}

              <h3>Order Timeline</h3>
              <div className="lifecycle">
                {matchedOrder.steps.map((step) => (
                  <div
                    key={step.name}
                    className={step.completed ? "life-step completed" : "life-step"}
                  >
                    <div>
                      <strong>{step.completed ? "✅" : "⬜"} {step.name}</strong>
                      {step.completedAt && (
                        <p>{new Date(step.completedAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="footer-bottom-only">
        © 2026 Climoraone. All rights reserved.
      </footer>
    </div>
  );
}

export default TrackOrder;