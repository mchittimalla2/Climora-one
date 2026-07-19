import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { adminApi } from "../../auth/adminAuth";
import "../../App.css";

const lifecycleSteps = ["Order Received", "Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered"];

const normalizeStatus = (status) => {
  const aliases = {
    "Item Packed": "Packed",
    "Out For Delivery": "Out for Delivery",
    Completed: "Delivered",
  };
  return aliases[status] || status;
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [expandedDates, setExpandedDates] = useState({});
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [invoiceAction, setInvoiceAction] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const buildSteps = (order) => {
    let history = {};
    try {
      history = order.status_history ? JSON.parse(order.status_history) : {};
    } catch {
      history = {};
    }

    if (history["Item Packed"] && !history.Packed) history.Packed = history["Item Packed"];
    if (history["Out For Delivery"] && !history["Out for Delivery"]) history["Out for Delivery"] = history["Out For Delivery"];
    if (history.Completed && !history.Delivered) history.Delivered = history.Completed;

    const normalizedStatus = normalizeStatus(order.status);
    const currentIndex = lifecycleSteps.indexOf(normalizedStatus);

    return lifecycleSteps.map((step, index) => ({
      name: step,
      completed: step === "Order Received" || Boolean(history[step]) || (currentIndex >= 0 && index <= currentIndex),
      completedAt:
        history[step] ||
        (step === "Order Received" && order.created_at
          ? new Date(order.created_at).toLocaleString()
          : null),
      isNext: currentIndex >= 0 && index === currentIndex + 1,
    }));
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await adminApi("/api/admin/orders");
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Unable to load orders.");

      const mappedOrders = (Array.isArray(data) ? data : []).map((order) => ({
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
        status: normalizeStatus(order.status),
        paymentStatus: order.payment_status,
        hasInvoice: Boolean(order.has_invoice),
        invoiceNumber: order.invoice_number,
        invoiceFileName: order.invoice_file_name,
        invoiceUrl: order.admin_invoice_url,
        items: order.items || [],
        steps: buildSteps(order),
      }));

      setOrders(mappedOrders);
      setExpandedDates((current) => {
        if (Object.keys(current).length > 0 || mappedOrders.length === 0) return current;
        const newestDate = new Date(mappedOrders[0].createdAt).toLocaleDateString();
        return { [newestDate]: true };
      });
    } catch (loadError) {
      setError(loadError.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const markStepComplete = async (orderId, stepName) => {
    const isFinalStep = stepName === "Delivered";
    const confirmationMessage = isFinalStep
      ? "Are you sure this order has been delivered to the customer? This final milestone cannot be reversed."
      : `Are you sure the “${stepName}” milestone is complete? The customer will be able to see this status.`;

    if (!window.confirm(confirmationMessage)) return;

    try {
      setUpdatingOrder(orderId);
      setError("");
      const response = await adminApi(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ status: stepName }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Failed to update order status.");
      await fetchOrders();
    } catch (statusError) {
      setError(statusError.message || "Unable to update order status.");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const accessInvoice = async (order, mode) => {
    const actionKey = `${order.id}:${mode}`;
    const previewTab = mode === "view" ? window.open("", "_blank") : null;
    if (mode === "view" && !previewTab) {
      setError("Your browser blocked the invoice tab. Please allow pop-ups and try again.");
      return;
    }
    if (previewTab) previewTab.opener = null;

    try {
      setInvoiceAction(actionKey);
      setError("");
      const response = await adminApi(order.invoiceUrl);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message || "Unable to access this invoice.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      if (mode === "view") {
        previewTab.location.href = objectUrl;
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      } else {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = order.invoiceFileName || `Climoraone-Invoice-${order.invoiceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(objectUrl);
      }
    } catch (invoiceError) {
      if (previewTab) previewTab.close();
      setError(invoiceError.message || "Unable to access this invoice.");
    } finally {
      setInvoiceAction("");
    }
  };

  const groupedOrders = orders.reduce((groups, order) => {
    const date = new Date(order.createdAt).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(order);
    return groups;
  }, {});

  const getStatusClass = (status) =>
    status === "Delivered"
      ? "status-badge delivered"
      : status === "Shipped" || status === "Out for Delivery"
        ? "status-badge shipped"
        : "status-badge pending";

  return (
    <AdminLayout
      eyebrow="Fulfilment operations"
      title="Order operations"
      description="Manage customer orders, shipment progress and the complete delivery lifecycle."
      actions={
        <button className="admin-secondary-btn" onClick={fetchOrders} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh orders"}
        </button>
      }
    >
      {error && <div className="admin-alert error">{error}</div>}
      {loading ? (
        <div className="admin-panel admin-empty">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="admin-panel admin-empty">No orders placed yet.</div>
      ) : (
        Object.keys(groupedOrders).map((date) => (
          <section key={date} className="order-date-section admin-panel">
            <button
              className="order-date-toggle"
              onClick={() => setExpandedDates((current) => ({ ...current, [date]: !current[date] }))}
            >
              <span>📅 {date} ({groupedOrders[date].length} Orders)</span>
              <span>{expandedDates[date] ? "▼" : "▶"}</span>
            </button>

            {expandedDates[date] && (
              <div className="order-card-grid">
                {groupedOrders[date].map((order) => (
                  <article key={order.id} className="modern-order-card">
                    <div className="modern-order-header">
                      <div>
                        <h3>{order.id}</h3>
                        <p>{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <span className={getStatusClass(order.status)}>{order.status}</span>
                    </div>

                    <div className="modern-order-summary">
                      <div><label>Customer</label><p>{order.customerName}</p></div>
                      <div><label>Phone</label><p>{order.phone}</p></div>
                      <div><label>Total</label><p>₹{order.total}</p></div>
                      <div><label>Items</label><p>{order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</p></div>
                    </div>

                    {order.hasInvoice && order.invoiceUrl && (
                      <div className="admin-invoice-actions" aria-label={`Invoice ${order.invoiceNumber}`}>
                        <span className="admin-invoice-number">{order.invoiceNumber}</span>
                        <button className="admin-secondary-btn" disabled={Boolean(invoiceAction)} onClick={() => accessInvoice(order, "view")}>
                          {invoiceAction === `${order.id}:view` ? "Opening..." : "View Invoice"}
                        </button>
                        <button className="admin-secondary-btn" disabled={Boolean(invoiceAction)} onClick={() => accessInvoice(order, "download")}>
                          {invoiceAction === `${order.id}:download` ? "Downloading..." : "Download Invoice"}
                        </button>
                      </div>
                    )}

                    <button
                      className="view-details-btn"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      {expandedOrder === order.id ? "Hide Details" : "View Details"}
                    </button>

                    {expandedOrder === order.id && (
                      <div className="modern-order-details">
                        <div className="customer-detail-box">
                          <h4>Customer Details</h4>
                          <p><strong>Email:</strong> {order.email}</p>
                          <p><strong>Address:</strong> {order.address}, {order.city}, {order.state} - {order.pincode}</p>
                        </div>

                        <div className="items-detail-box">
                          <h4>Ordered Items</h4>
                          {order.items.map((item) => (
                            <div className="order-item-row" key={item.id}>
                              <span>{item.product_name || item.name}</span>
                              <span>Qty: {item.quantity}</span>
                              <strong>₹{item.subtotal || Number(item.price) * Number(item.quantity)}</strong>
                            </div>
                          ))}
                        </div>

                        <h4>Order Lifecycle</h4>
                        <div className="lifecycle admin-lifecycle">
                          {order.steps.map((step) => (
                            <div key={step.name} className={step.completed ? "life-step completed" : "life-step"}>
                              <div className="life-step-left">
                                <strong>{step.completed ? "✅" : "⬜"} {step.name}</strong>
                                {step.completedAt && <p>{new Date(step.completedAt).toLocaleString()}</p>}
                              </div>

                              {!step.completed && step.isNext && (
                                <button
                                  className="status-btn"
                                  disabled={updatingOrder === order.id}
                                  onClick={() => markStepComplete(order.id, step.name)}
                                >
                                  {updatingOrder === order.id ? "Updating..." : "Mark as Complete"}
                                </button>
                              )}

                              {!step.completed && !step.isNext && (
                                <span className="status-badge pending">Complete previous milestone first</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        ))
      )}
    </AdminLayout>
  );
}

export default Orders;
