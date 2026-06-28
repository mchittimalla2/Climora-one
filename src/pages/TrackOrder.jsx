import { useState } from "react";
import "../App.css";

const customerSteps = [
  "Order Received",
  "Item Packed",
  "Shipped",
  "Out For Delivery",
  "Delivered",
];

const stepMapping = {
  "Order Received": "Order Received",
  "Vendor Availability Checked": "Order Received",
  "Item Packed": "Item Packed",
  "Shipped": "Shipped",
  "Delivery Initiated / Email Sent": "Out For Delivery",
  "Delivered": "Delivered",
};

function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [matchedOrder, setMatchedOrder] = useState(null);
  const [error, setError] = useState("");

  const getCustomerTimeline = (order) => {
    const completedCustomerSteps = new Set();

    order.steps?.forEach((step) => {
      if (step.completed && stepMapping[step.name]) {
        completedCustomerSteps.add(stepMapping[step.name]);
      }
    });

    return customerSteps.map((stepName) => ({
      name: stepName,
      completed: completedCustomerSteps.has(stepName),
    }));
  };

  const handleTrack = (e) => {
    e.preventDefault();

    const orders = JSON.parse(localStorage.getItem("climoraone_orders")) || [];

    const foundOrder = orders.find(
      (order) =>
        order.id.toLowerCase() === orderId.toLowerCase() &&
        order.phone === phone
    );

    if (!foundOrder) {
      setMatchedOrder(null);
      setError("No order found with this Order ID and phone number.");
      return;
    }

    setMatchedOrder(foundOrder);
    setError("");
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

              <p>
                <strong>Customer:</strong> {matchedOrder.customerName}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {stepMapping[matchedOrder.status] || matchedOrder.status}
              </p>

              <p>
                <strong>Total:</strong> ₹{matchedOrder.total}
              </p>

              <h3>Items Ordered</h3>
              {matchedOrder.items.map((item) => (
                <div className="order-item-row" key={item.id}>
                  <span>{item.name}</span>
                  <span>Qty: {item.quantity}</span>
                  <strong>₹{item.price * item.quantity}</strong>
                </div>
              ))}

              <h3>Order Timeline</h3>

              <div className="lifecycle">
                {getCustomerTimeline(matchedOrder).map((step) => (
                  <div
                    key={step.name}
                    className={step.completed ? "life-step completed" : "life-step"}
                  >
                    <div>
                      <strong>
                        {step.completed ? "✅" : "⬜"} {step.name}
                      </strong>
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