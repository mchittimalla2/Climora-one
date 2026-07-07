import { useEffect, useState } from "react";
import "../../App.css";
import { API_BASE_URL } from "../../config/api";

const defaultSteps = [
  "Order Received",
  "Item Packed",
  "Shipped",
  "Out For Delivery",
  "Delivered",
];

function Orders() {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const buildSteps = (order) => {
    let history = {};

    try {
      history = order.status_history ? JSON.parse(order.status_history) : {};
    } catch {
      history = {};
    }

    const currentIndex = defaultSteps.indexOf(order.status);

    return defaultSteps.map((step, index) => ({
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
        steps: buildSteps(order),
      }));

      setOrders(normalizedOrders);
    } catch (error) {
      console.error("Failed to load orders:", error);
      alert("Unable to load orders from backend.");
    }
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

  const groupedOrders = orders.reduce((groups, order) => {
    const date = new Date(order.createdAt).toLocaleDateString();

    if (!groups[date]) groups[date] = [];
    groups[date].push(order);

    return groups;
  }, {});

  const getStatusClass = (status) => {
    if (status === "Delivered") return "status-badge delivered";
    if (status === "Shipped" || status === "Out For Delivery")
      return "status-badge shipped";
    return "status-badge pending";
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
        <div className="admin-page-title">
          <h2>Order Operations</h2>
          <p>Manage customer orders, shipment progress, and delivery lifecycle.</p>
        </div>

        {orders.length === 0 ? (
          <p>No orders placed yet.</p>
        ) : (
          Object.keys(groupedOrders).map((date) => (
            <div key={date} className="order-date-section">
              <h3 className="order-date-title">📅 {date}</h3>

              <div className="order-card-grid">
                {groupedOrders[date].map((order) => (
                  <div key={order.id} className="modern-order-card">
                    <div className="modern-order-header">
                      <div>
                        <h3>{order.id}</h3>
                        <p>{new Date(order.createdAt).toLocaleString()}</p>
                      </div>

                      <span className={getStatusClass(order.status)}>
                        {order.status}
                      </span>
                    </div>

                    <div className="modern-order-summary">
                      <div>
                        <label>Customer</label>
                        <p>{order.customerName}</p>
                      </div>

                      <div>
                        <label>Phone</label>
                        <p>{order.phone}</p>
                      </div>

                      <div>
                        <label>Total</label>
                        <p>₹{order.total}</p>
                      </div>

                      <div>
                        <label>Items</label>
                        <p>
                          {order.items.reduce(
                            (sum, item) => sum + Number(item.quantity || 0),
                            0
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      className="view-details-btn"
                      onClick={() =>
                        setExpandedOrder(
                          expandedOrder === order.id ? null : order.id
                        )
                      }
                    >
                      {expandedOrder === order.id ? "Hide Details" : "View Details"}
                    </button>

                    {expandedOrder === order.id && (
                      <div className="modern-order-details">
                        <div className="customer-detail-box">
                          <h4>Customer Details</h4>
                          <p>
                            <strong>Email:</strong> {order.email}
                          </p>
                          <p>
                            <strong>Address:</strong> {order.address}, {order.city},{" "}
                            {order.state} - {order.pincode}
                          </p>
                        </div>

                        <div className="items-detail-box">
                          <h4>Ordered Items</h4>

                          {order.items.map((item) => (
                            <div className="order-item-row" key={item.id}>
                              <span>{item.product_name || item.name}</span>
                              <span>Qty: {item.quantity}</span>
                              <strong>
                                ₹
                                {item.subtotal ||
                                  Number(item.price) * Number(item.quantity)}
                              </strong>
                            </div>
                          ))}
                        </div>

                        <h4>Order Lifecycle</h4>

                        <div className="lifecycle admin-lifecycle">
                          {order.steps.map((step) => (
                            <div
                              key={step.name}
                              className={
                                step.completed
                                  ? "life-step completed"
                                  : "life-step"
                              }
                            >
                              <div className="life-step-left">
                                <strong>
                                  {step.completed ? "✅" : "⬜"} {step.name}
                                </strong>

                                {step.completedAt && (
                                  <p>
                                    {new Date(step.completedAt).toLocaleString()}
                                  </p>
                                )}
                              </div>

                              {!step.completed && (
                                <button
                                  className="status-btn"
                                  onClick={() =>
                                    markStepComplete(order.id, step.name)
                                  }
                                >
                                  Mark Completed
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default Orders;