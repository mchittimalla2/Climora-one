import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { API_BASE_URL } from "../../config/api";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

function Admin() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      const [ordersResponse, productsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/orders`, { headers: { Accept: "application/json" } }),
        fetch(`${API_BASE_URL}/api/products`, { headers: { Accept: "application/json" } }),
      ]);

      const ordersData = await ordersResponse.json();
      const productsData = await productsResponse.json();
      if (!ordersResponse.ok) throw new Error(ordersData?.message || "Unable to load orders.");
      if (!productsResponse.ok) throw new Error(productsData?.message || "Unable to load products.");

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (dashboardError) {
      setError(dashboardError.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const metrics = useMemo(() => {
    const delivered = orders.filter((order) => order.status === "Delivered").length;
    const open = orders.length - delivered;
    const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const itemsSold = orders.reduce(
      (sum, order) => sum + (order.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0),
      0
    );
    const lowStock = products.filter((product) => Number(product.stock || 0) > 0 && Number(product.stock || 0) <= 5).length;
    const outOfStock = products.filter((product) => Number(product.stock || 0) <= 0).length;

    return { delivered, open, revenue, itemsSold, lowStock, outOfStock };
  }, [orders, products]);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);

  return (
    <AdminLayout
      eyebrow="Operations overview"
      title="Climoraone commerce dashboard"
      description="Track orders, revenue, product health and fulfilment from one premium operational workspace."
      actions={<button className="admin-secondary-btn" onClick={fetchDashboardData}>Refresh</button>}
    >
      {error && <div className="admin-alert error">{error}</div>}
      {loading ? (
        <div className="admin-panel admin-empty">Loading commerce overview...</div>
      ) : (
        <>
          <section className="admin-metrics">
            <article className="admin-metric-card"><small>Total orders</small><strong>{orders.length}</strong><span>All customer purchases</span></article>
            <article className="admin-metric-card"><small>Open orders</small><strong>{metrics.open}</strong><span>Still moving through fulfilment</span></article>
            <article className="admin-metric-card"><small>Delivered</small><strong>{metrics.delivered}</strong><span>Completed deliveries</span></article>
            <article className="admin-metric-card"><small>Total revenue</small><strong>{money(metrics.revenue)}</strong><span>Recorded order value</span></article>
            <article className="admin-metric-card"><small>Items sold</small><strong>{metrics.itemsSold}</strong><span>Units across all orders</span></article>
            <article className="admin-metric-card"><small>Total products</small><strong>{products.length}</strong><span>Current catalogue size</span></article>
            <article className="admin-metric-card"><small>Low stock</small><strong>{metrics.lowStock}</strong><span>Five units or fewer</span></article>
            <article className="admin-metric-card"><small>Out of stock</small><strong>{metrics.outOfStock}</strong><span>Needs replenishment</span></article>
          </section>

          <section className="admin-grid-2">
            <article className="admin-panel">
              <div className="admin-panel-header"><div><span className="admin-eyebrow">Fulfilment pulse</span><h2>Order status</h2></div></div>
              <div className="admin-progress-row">
                <div className="admin-progress-label"><strong>Delivered</strong><span>{metrics.delivered}</span></div>
                <div className="admin-progress-track"><div className="admin-progress-fill" style={{ width: `${orders.length ? (metrics.delivered / orders.length) * 100 : 0}%` }} /></div>
              </div>
              <div className="admin-progress-row">
                <div className="admin-progress-label"><strong>Open</strong><span>{metrics.open}</span></div>
                <div className="admin-progress-track"><div className="admin-progress-fill" style={{ width: `${orders.length ? (metrics.open / orders.length) * 100 : 0}%` }} /></div>
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-header"><div><span className="admin-eyebrow">Catalogue health</span><h2>Inventory summary</h2></div></div>
              <div className="admin-progress-row">
                <div className="admin-progress-label"><strong>Healthy products</strong><span>{Math.max(0, products.length - metrics.lowStock - metrics.outOfStock)}</span></div>
                <div className="admin-progress-track"><div className="admin-progress-fill" style={{ width: `${products.length ? ((products.length - metrics.lowStock - metrics.outOfStock) / products.length) * 100 : 0}%` }} /></div>
              </div>
              <div className="admin-progress-row">
                <div className="admin-progress-label"><strong>Needs attention</strong><span>{metrics.lowStock + metrics.outOfStock}</span></div>
                <div className="admin-progress-track"><div className="admin-progress-fill" style={{ width: `${products.length ? ((metrics.lowStock + metrics.outOfStock) / products.length) * 100 : 0}%` }} /></div>
              </div>
            </article>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-header"><div><span className="admin-eyebrow">Latest activity</span><h2>Recent orders</h2></div></div>
            {recentOrders.length === 0 ? (
              <div className="admin-empty">New customer orders will appear here.</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Items</th><th>Total</th></tr></thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.order_number || order.id}>
                        <td><strong>{order.order_number || order.id}</strong></td>
                        <td>{order.customer_name || "Customer"}</td>
                        <td>{order.status || "Order Received"}</td>
                        <td>{(order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</td>
                        <td>{money(order.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </AdminLayout>
  );
}

export default Admin;
