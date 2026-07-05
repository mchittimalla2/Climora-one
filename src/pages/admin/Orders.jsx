import { useEffect, useState } from "react";
import "../../App.css";
import { API_BASE_URL } from "../../config/api";

const defaultSteps = [
  "Order Received",
  "Item Packed",
  "Shipped",
  "Delivered",
];

function Orders() {
  const [orders, setOrders] = useState([]);
  const [openDates, setOpenDates] = useState({});
  const [openCustomers, setOpenCustomers] = useState({});
  const [openOrders, setOpenOrders] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`);
      const data = await response.json();

      const normalizedOrders = data.map((order) => ({
        id: order.order_number,
        createdAt: order.created_at,
        customerName: order.customer_name,
        email: order.email,
        phone: order.phone,
        address: order.address,
        city: order.city,
        state: order.state,
        pincode: order.pincode,
        total: order.total,
        status: order.status,
        items: order.items || [],
        steps:
          order.steps ||
          defaultSteps.map((step, index) => ({
            name: step,
            completed: index === 0 || step === order.status,
            completedAt:
              index === 0 ? new Date(order.created_at).toLocaleString() : null,
          })),
      }));

      setOrders(normalizedOrders);
    } catch (error) {
      console.error("Failed to load orders:", error);
      alert("Unable to load orders from backend.");
    }
  };

  const groupedOrders = orders.reduce((groups, order) => {
    const date = new Date(order.createdAt).toLocaleDateString();
    const customer = order.customerName || "Unknown Customer";

    if (!groups[date]) groups[date] = {};
    if (!groups[date][customer]) groups[date][customer] = [];

    groups[date][customer].push(order);
    return groups;
  }, {});

  const toggleDate = (date) => {
    setOpenDates({ ...openDates, [date]: !openDates[date] });
  };

  const toggleCustomer = (key) => {
    setOpenCustomers({ ...openCustomers, [key]: !openCustomers[key] });
  };

  const toggleOrder = (orderId) => {
    setOpenOrders({ ...openOrders, [orderId]: !openOrders[orderId] });
  };
  
  const markStepComplete = async (orderId, stepName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: stepName }),
    });

    if (!response.ok) {
      alert("Failed to update order status.");
      return;
    }

    fetchOrders();
  } catch (error) {
    console.error("Status update failed:", error);
    alert("Unable to connect to backend.");
  }
};
  return (
    <div>
      <header className="header">
        <div className="logo-section">
          <img src="/images/logo.jpeg" alt="Climoraone" className="header-logo" />
        </div>

        <nav>
          <a href="/admin">Dashboard</a>
          <a href="/admin/products">Products</a>
          <a href="/admin/reports">Reports</a>
          <a href="/">Store</a>
        </nav>
      </header>

      <section className="admin-dashboard">
        <h2>Order Operations</h2>

        {orders.length === 0 ? (
          <p>No orders placed yet.</p>
        ) : (
          Object.keys(groupedOrders).map((date) => (
            <div key={date} className="order-folder">
              <h3 onClick={() => toggleDate(date)}>📁 {date}</h3>

              {openDates[date] &&
                Object.keys(groupedOrders[date]).map((customer) => {
                  const customerKey = `${date}-${customer}`;

                  return (
                    <div key={customerKey} className="customer-folder">
                      <h4 onClick={() => toggleCustomer(customerKey)}>
                        📁 {customer}
                      </h4>

                      {openCustomers[customerKey] &&
                        groupedOrders[date][customer].map((order) => (
                          <div key={order.id} className="order-card">
                            <h4 onClick={() => toggleOrder(order.id)}>
                              📦 {order.id} — ₹{order.total} — {order.status}
                            </h4>

                            {openOrders[order.id] && (
                              <>
                                <p>
                                  <strong>Customer:</strong> {order.customerName}
                                </p>
                                <p>
                                  <strong>Phone:</strong> {order.phone}
                                </p>
                                <p>
                                  <strong>Email:</strong> {order.email}
                                </p>
                                <p>
                                  <strong>Address:</strong> {order.address},{" "}
                                  {order.city}, {order.state} - {order.pincode}
                                </p>

                                <div className="order-total-box">
                                  <p>Total</p>
                                  <h3>₹{order.total}</h3>
                                  <span>{order.status}</span>
                                </div>

                                <h4>Ordered Items</h4>
                                {order.items.map((item) => (
                                  <div className="order-item-row" key={item.id}>
                                    <span>
                                      {item.product_name || item.name}
                                    </span>
                                    <span>Qty: {item.quantity}</span>
                                    <strong>
                                      ₹{item.subtotal || item.price * item.quantity}
                                    </strong>
                                  </div>
                                ))}

                                <h4>Order Lifecycle Checklist</h4>
                                <h4>Order Lifecycle Checklist</h4>

                                <div className="lifecycle admin-lifecycle">
                                  {order.steps.map((step) => (
                                    <div
                                      key={step.name}
                                      className={step.completed ? "life-step completed" : "life-step"}
                                    >
                                      <div>
                                        <strong>
                                          {step.completed ? "✅" : "⬜"} {step.name}
                                        </strong>
                                        {step.completedAt && <p>{step.completedAt}</p>}
                                      </div>

                                      {!step.completed && (
                                        <button
                                          className="status-btn"
                                          onClick={() => markStepComplete(order.id, step.name)}
                                        >
                                          Mark Completed
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                                                
                              </>
                            )}
                          </div>
                        ))}
                    </div>
                  );
                })}
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default Orders;