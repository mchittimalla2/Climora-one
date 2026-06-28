import { useEffect, useState } from "react";
import "../../App.css";

const defaultSteps = [
  "Order Received",
  "Vendor Availability Checked",
  "Item Packed",
  "Shipped",
  "Delivery Initiated / Email Sent",
  "Delivered",
];

function Orders() {
  const [orders, setOrders] = useState([]);
  const [openDates, setOpenDates] = useState({});
  const [openCustomers, setOpenCustomers] = useState({});
  const [openOrders, setOpenOrders] = useState({});

  useEffect(() => {
    const savedOrders =
      JSON.parse(localStorage.getItem("climoraone_orders")) || [];

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
            <div className="date-folder" key={date}>
              <button className="folder-title" onClick={() => toggleDate(date)}>
                {openDates[date] ? "📂" : "📁"} {date}
              </button>

              {openDates[date] &&
                Object.keys(groupedOrders[date]).map((customer) => {
                  const customerKey = `${date}-${customer}`;

                  return (
                    <div className="customer-folder" key={customer}>
                      <button
                        className="folder-title customer-title"
                        onClick={() => toggleCustomer(customerKey)}
                      >
                        {openCustomers[customerKey] ? "📂" : "📁"} {customer}
                      </button>

                      {openCustomers[customerKey] &&
                        groupedOrders[date][customer].map((order) => (
                          <div className="order-card" key={order.id}>
                            <button
                              className="folder-title order-title"
                              onClick={() => toggleOrder(order.id)}
                            >
                              {openOrders[order.id] ? "📂" : "📁"} {order.id} — ₹
                              {order.total} — {order.status}
                            </button>

                            {openOrders[order.id] && (
                              <>
                                <div className="order-header">
                                  <div>
                                    <p>
                                      <strong>Customer:</strong>{" "}
                                      {order.customerName}
                                    </p>
                                    <p>
                                      <strong>Phone:</strong> {order.phone}
                                    </p>
                                    <p>
                                      <strong>Email:</strong> {order.email}
                                    </p>
                                    <p>
                                      <strong>Address:</strong> {order.address},{" "}
                                      {order.city}, {order.state} -{" "}
                                      {order.pincode}
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
                                    <strong>
                                      ₹{item.price * item.quantity}
                                    </strong>
                                  </div>
                                ))}

                                <h4>Order Lifecycle Checklist</h4>
                                <div className="lifecycle">
                                  {order.steps.map((step) => (
                                    <div
                                      key={step.name}
                                      className={
                                        step.completed
                                          ? "life-step completed"
                                          : "life-step"
                                      }
                                    >
                                      <div>
                                        <strong>
                                          {step.completed ? "✅" : "⬜"}{" "}
                                          {step.name}
                                        </strong>
                                        {step.completedAt && (
                                          <p>{step.completedAt}</p>
                                        )}
                                      </div>

                                      {!step.completed && (
                                        <button
                                          onClick={() =>
                                            markStepComplete(
                                              order.id,
                                              step.name
                                            )
                                          }
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