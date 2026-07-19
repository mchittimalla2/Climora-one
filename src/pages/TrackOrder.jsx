import { useState } from "react";
import { API_BASE_URL } from "../config/api";
import { PublicPageLayout } from "../components/PublicPageLayout";
import "../styles/track-order.css";
import "../styles/track-order-desktop.css";

const timelineSteps = [
  "Order Received",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const normalizeStatus = (status = "") => {
  const aliases = {
    "Pending Payment": "Order Received",
    "Item Packed": "Packed",
    "Out For Delivery": "Out for Delivery",
    Completed: "Delivered",
  };
  return aliases[status] || status;
};

const formatMoney = (value) => Number(value || 0).toFixed(2);

function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [matchedOrder, setMatchedOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");

  const buildSteps = (order) => {
    let history;
    try {
      history = order.status_history ? JSON.parse(order.status_history) : {};
    } catch {
      history = {};
    }

    const normalizedHistory = Object.entries(history).reduce((result, [key, value]) => {
      result[normalizeStatus(key)] = value;
      return result;
    }, {});
    const currentStatus = normalizeStatus(order.status);
    const currentIndex = timelineSteps.indexOf(currentStatus);

    return timelineSteps.map((step, index) => ({
      name: step,
      completed: step === "Order Received" || Boolean(normalizedHistory[step]) || (currentIndex >= 0 && index <= currentIndex),
      completedAt: normalizedHistory[step] || (step === "Order Received" ? order.created_at : null),
    }));
  };

  const handleTrack = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setInvoiceError("");
    setMatchedOrder(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/track-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ order_number: orderId.trim().toUpperCase(), phone: phone.trim() }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.message || "No order found with these details.");
        return;
      }

      const items = Array.isArray(data.items) ? data.items : [];
      setMatchedOrder({
        id: data.order_number,
        customerName: data.customer_name || "Customer",
        email: data.email || "",
        total: data.total,
        paymentStatus: data.payment_status,
        paymentMethod: data.payment_method || "Online payment",
        invoiceUrl: data.has_invoice ? data.invoice_download_url : null,
        invoiceFileName: data.invoice_file_name || `Climoraone-Invoice-${data.order_number}.pdf`,
        status: normalizeStatus(data.status),
        items,
        createdAt: data.created_at,
        steps: buildSteps(data),
      });
    } catch (requestError) {
      console.error("Track order failed:", requestError);
      setError("Unable to check the order right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async () => {
    if (!matchedOrder?.invoiceUrl) return;

    setInvoiceLoading(true);
    setInvoiceError("");

    try {
      const response = await fetch(matchedOrder.invoiceUrl, {
        headers: { Accept: "application/pdf" },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message || "Unable to download the invoice.");
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = matchedOrder.invoiceFileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setInvoiceError(downloadError instanceof Error ? downloadError.message : "Unable to download the invoice.");
    } finally {
      setInvoiceLoading(false);
    }
  };

  return (
    <PublicPageLayout
      className="tracking-page"
      eyebrow="Order updates"
      title="Track your order"
      description="Enter your confirmation number and the phone number used at checkout to follow your order journey."
    >
      <section className="tracking-search-card">
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
          <button type="submit" disabled={loading}>{loading ? "Checking..." : "Track Order"}</button>
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
            <article><span>Customer</span><strong>{matchedOrder.customerName}</strong></article>
            <article><span>Total amount</span><strong>₹{formatMoney(matchedOrder.total)}</strong></article>
            <article><span>Payment</span><strong>{matchedOrder.paymentStatus || matchedOrder.paymentMethod}</strong></article>
            <article><span>Estimated delivery</span><strong>4–6 business days</strong></article>
          </div>

          {matchedOrder.paymentStatus === "Paid" && matchedOrder.invoiceUrl && (
            <div className="tracking-invoice-action">
              <div>
                <strong>Your paid invoice is ready</strong>
                <span>The secure download link expires after 15 minutes.</span>
              </div>
              <button type="button" onClick={downloadInvoice} disabled={invoiceLoading}>
                {invoiceLoading ? "Preparing invoice..." : "Download Invoice"}
              </button>
            </div>
          )}
          {invoiceError && <div className="tracking-error" role="alert">{invoiceError}</div>}

          <div className="tracking-details-grid">
            <section className="tracking-items-card">
              <div className="tracking-section-heading">
                <h3>Items ordered</h3>
                <span>{matchedOrder.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)} item(s)</span>
              </div>
              {matchedOrder.items.length > 0 ? matchedOrder.items.map((item, index) => (
                <div className="tracking-item-row" key={item.id || `${item.product_id || item.product_name}-${index}`}>
                  <div>
                    <strong>{item.product_name || "Product"}</strong>
                    <span>Quantity: {item.quantity}</span>
                  </div>
                  <strong>₹{formatMoney(item.subtotal || Number(item.price || 0) * Number(item.quantity || 0))}</strong>
                </div>
              )) : <p className="tracking-empty-items">Order item details are unavailable.</p>}
            </section>

            <section className="tracking-timeline-card">
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
            </section>
          </div>
        </section>
      )}
    </PublicPageLayout>
  );
}

export default TrackOrder;
