import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { adminApi } from "../../auth/adminAuth";
import "../../App.css";

const lifecycleSteps = ["Order Received", "Item Packed", "Shipped", "Out For Delivery", "Delivered"];

function Orders() {
  const [orders, setOrders] = useState([]);
  const [expandedDates, setExpandedDates] = useState({});
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const buildSteps = (order) => {
    let history = {};
    try { history = order.status_history ? JSON.parse(order.status_history) : {}; } catch { history = {}; }
    const currentIndex = lifecycleSteps.indexOf(order.status);
    return lifecycleSteps.map((step, index) => ({
      name: step,
      completed: step === "Order Received" || history[step] || (currentIndex >= 0 && index <= currentIndex),
      completedAt: history[step] || (step === "Order Received" && order.created_at ? new Date(order.created_at).toLocaleString() : null),
    }));
  };

  const fetchOrders = async () => {
    try {
      setLoading(true); setError("");
      const response = await adminApi("/api/admin/orders");
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Unable to load orders.");
      setOrders((Array.isArray(data) ? data : []).map((order) => ({
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
      })));
    } catch (loadError) { setError(loadError.message || "Unable to load orders."); } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const markStepComplete = async (orderId, stepName) => {
    try {
      setError("");
      const response = await adminApi(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: stepName }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Failed to update order status.");
      await fetchOrders();
    } catch (statusError) { setError(statusError.message || "Unable to update order status."); }
  };

  const groupedOrders = orders.reduce((groups, order) => {
    const date = new Date(order.createdAt).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(order);
    return groups;
  }, {});

  const getStatusClass = (status) => status === "Delivered" ? "status-badge delivered" : (status === "Shipped" || status === "Out For Delivery") ? "status-badge shipped" : "status-badge pending";

  return (
    <AdminLayout eyebrow="Fulfilment operations" title="Order operations" description="Manage customer orders, shipment progress and the complete delivery lifecycle." actions={<button className="admin-secondary-btn" onClick={fetchOrders}>Refresh orders</button>}>
      {error && <div className="admin-alert error">{error}</div>}
      {loading ? <div className="admin-panel admin-empty">Loading orders...</div> : orders.length === 0 ? <div className="admin-panel admin-empty">No orders placed yet.</div> : Object.keys(groupedOrders).map((date) => (
        <section key={date} className="order-date-section admin-panel">
          <button className="order-date-toggle" onClick={() => setExpandedDates((current) => ({ ...current, [date]: !current[date] }))}>
            <span>📅 {date} ({groupedOrders[date].length} Orders)</span><span>{expandedDates[date] ? "▼" : "▶"}</span>
          </button>
          {expandedDates[date] && <div className="order-card-grid">{groupedOrders[date].map((order) => (
            <article key={order.id} className="modern-order-card">
              <div className="modern-order-header"><div><h3>{order.id}</h3><p>{new Date(order.createdAt).toLocaleString()}</p></div><span className={getStatusClass(order.status)}>{order.status}</span></div>
              <div className="modern-order-summary"><div><label>Customer</label><p>{order.customerName}</p></div><div><label>Phone</label><p>{order.phone}</p></div><div><label>Total</label><p>₹{order.total}</p></div><div><label>Items</label><p>{order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</p></div></div>
              <button className="view-details-btn" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>{expandedOrder === order.id ? "Hide Details" : "View Details"}</button>
              {expandedOrder === order.id && <div className="modern-order-details">
                <div className="customer-detail-box"><h4>Customer Details</h4><p><strong>Email:</strong> {order.email}</p><p><strong>Address:</strong> {order.address}, {order.city}, {order.state} - {order.pincode}</p></div>
                <div className="items-detail-box"><h4>Ordered Items</h4>{order.items.map((item) => <div className="order-item-row" key={item.id}><span>{item.product_name || item.name}</span><span>Qty: {item.quantity}</span><strong>₹{item.subtotal || Number(item.price) * Number(item.quantity)}</strong></div>)}</div>
                <h4>Order Lifecycle</h4><div className="lifecycle admin-lifecycle">{order.steps.map((step) => <div key={step.name} className={step.completed ? "life-step completed" : "life-step"}><div className="life-step-left"><strong>{step.completed ? "✅" : "⬜"} {step.name}</strong>{step.completedAt && <p>{new Date(step.completedAt).toLocaleString()}</p>}</div>{!step.completed && <button className="status-btn" onClick={() => markStepComplete(order.id, step.name)}>Mark Completed</button>}</div>)}</div>
              </div>}
            </article>
          ))}</div>}
        </section>
      ))}
    </AdminLayout>
  );
}

export default Orders;