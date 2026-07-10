import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "../App.css";

const defaultSteps = [
  "Order Received",
  "Vendor Availability Checked",
  "Item Packed",
  "Shipped",
  "Delivery Initiated / Email Sent",
  "Delivered",
];

function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem("climoraone_orders")) || [];

    const normalizedOrders = savedOrders.map((order) => ({
      ...order,
      createdAt: order.createdAt || new Date().toISOString(),
      steps:
        order.steps ||
        defaultSteps.map((step, index) => ({
          name: step,
          completed: index === 0,
          completedAt: index === 0 ? new Date().toLocaleString() : null,
        })),
    }));

    setOrders(normalizedOrders);
    localStorage.setItem("climoraone_orders", JSON.stringify(normalizedOrders));
  }, []);

  const saveOrders = (updatedOrders) => {
    setOrders(updatedOrders);
    localStorage.setItem("climoraone_orders", JSON.stringify(updatedOrders));
  };

  const markStepComplete = (orderId, stepName) => {
    const updatedOrders = orders.map((order) => {
      if (order.id !== orderId) return order;

      const updatedSteps = order.steps.map((step) =>
        step.name === stepName
          ? {
              ...step,
              completed: true,
              completedAt: new Date().toLocaleString(),
            }
          : step
      );

      return {
        ...order,
        steps: updatedSteps,
        status: stepName,
      };
    });

    saveOrders(updatedOrders);
  };

  const groupedOrders = orders.reduce((groups, order) => {
    const date = new Date(order.createdAt).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(order);
    return groups;
  }, {});

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = orders.filter(
    (order) => !order.steps?.find((step) => step.name === "Delivered")?.completed
  ).length;

  if (!isLoggedIn) {
    return (
      <div>
        <header className="header">
          <div className="logo-section">
            <img src="/images/logo.jpeg" alt="Climoraone" className="header-logo" />
          </div>
          <nav>
            <Link to="/">Store</Link>
          </nav>
        </header>
        <section className="checkout">
          <h2>Admin Login</h2>

          <form
            className="checkout-form"
            onSubmit={(e) => {
              e.preventDefault();

              if (
                e.target.username.value === "admin" &&
                e.target.password.value === "admin123"
              ) {
                setIsLoggedIn(true);
                setError("");
              } else {
                setError("Invalid username or password");
              }
            }}
          >
            <input name="username" placeholder="Username" required />
            <input name="password" type="password" placeholder="Password" required />
            <button type="submit">Login</button>
            {error && <p className="error-text">{error}</p>}
          </form>
        </section>
      </div>
    );
  }

  return (
    <div>
      <header className="header">
        <div className="logo-section">
          <img src="/images/logo.jpeg" alt="Climoraone" className="header-logo" />
        </div>
        <nav>
          <Link to="/">Store</Link>
          <button className="nav-btn" onClick={() => setIsLoggedIn(false)}>
            Logout
          </button>
        </nav>
      </header>
      <section className="admin-dashboard">
        <h2>Order Operations Dashboard</h2>

        <div className="impact">
          <div>
            <h3>Total Orders</h3>
            <p>{orders.length}</p>
          </div>
          <div>
            <h3>Pending Orders</h3>
            <p>{pendingOrders}</p>
          </div>
          <div>
            <h3>Total Revenue</h3>
            <p>₹{totalRevenue}</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <p>No orders placed yet.</p>
        ) : (
          Object.keys(groupedOrders).map((date) => (
            <div key={date}>
              <h2 className="order-date-heading">Orders - {date}</h2>

              {groupedOrders[date].map((order) => (
                <div className="order-card" key={order.id}>
                  <div className="order-header">
                    <div>
                      <h3>{order.id}</h3>
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
                        <strong>Address:</strong> {order.address}, {order.city},{" "}
                        {order.state} - {order.pincode}
                      </p>
                    </div>

                    <div className="order-total-box">
                      <p>Total</p>
                      <h3>₹{order.total}</h3>
                      <span>{order.status}</span>
                    </div>
                  </div>

                  <h4>Ordered Items</h4>
                  {order.items.map((item) => (
                    <div className="order-item-row" key={item.id}>
                      <span>{item.name}</span>
                      <span>Qty: {item.quantity}</span>
                      <strong>₹{item.price * item.quantity}</strong>
                    </div>
                  ))}

                  <h4>Order Lifecycle Checklist</h4>

                  <div className="lifecycle">
                    {order.steps.map((step) => (
                      <div
                        key={step.name}
                        className={
                          step.completed ? "life-step completed" : "life-step"
                        }
                      >
                        <div>
                          <strong>{step.completed ? "✅" : "⬜"} {step.name}</strong>
                          {step.completedAt && <p>{step.completedAt}</p>}
                        </div>

                        {!step.completed && (
                          <button
                            onClick={() => markStepComplete(order.id, step.name)}
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default Admin;