import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { adminApi } from "../../auth/adminAuth";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);

function Reports() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = async () => {
    try {
      setLoading(true); setError("");
      const [ordersResponse, productsResponse] = await Promise.all([
        adminApi("/api/admin/orders"),
        adminApi("/api/admin/products"),
      ]);
      const ordersData = await ordersResponse.json();
      const productsData = await productsResponse.json();
      if (!ordersResponse.ok) throw new Error(ordersData?.message || "Unable to load orders.");
      if (!productsResponse.ok) throw new Error(productsData?.message || "Unable to load products.");
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (reportError) { setError(reportError.message || "Unable to load report data."); } finally { setLoading(false); }
  };

  useEffect(() => { loadReports(); }, []);

  const analytics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const totalItemsSold = orders.reduce((sum, order) => sum + (order.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0), 0);
    const delivered = orders.filter((order) => order.status === "Delivered").length;
    const openOrders = orders.length - delivered;
    const averageOrder = orders.length ? totalRevenue / orders.length : 0;
    const lowStock = products.filter((product) => Number(product.stock || 0) > 0 && Number(product.stock || 0) <= 5);
    const outOfStock = products.filter((product) => Number(product.stock || 0) <= 0);
    const unitsInStock = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
    const productSales = new Map();
    orders.forEach((order) => (order.items || []).forEach((item) => {
      const name = item.product_name || item.name || "Product";
      const existing = productSales.get(name) || { name, quantity: 0, revenue: 0 };
      existing.quantity += Number(item.quantity || 0);
      existing.revenue += Number(item.subtotal || Number(item.price || 0) * Number(item.quantity || 0));
      productSales.set(name, existing);
    }));
    return { totalRevenue, totalItemsSold, delivered, openOrders, averageOrder, lowStock, outOfStock, unitsInStock, topProducts: [...productSales.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5) };
  }, [orders, products]);

  const maxTopQuantity = Math.max(1, ...analytics.topProducts.map((product) => product.quantity));
  const recentOrders = [...orders].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 6);

  return (
    <AdminLayout eyebrow="Business intelligence" title="Reports & performance" description="A live operational view of sales, inventory health, order movement and product performance." actions={<button className="admin-secondary-btn" onClick={loadReports}>Refresh data</button>}>
      {error && <div className="admin-alert error">{error}</div>}
      {loading ? <div className="admin-panel admin-empty">Preparing live business insights...</div> : <>
        <section className="admin-metrics">
          <article className="admin-metric-card"><small>Total revenue</small><strong>{money(analytics.totalRevenue)}</strong><span>Across {orders.length} orders</span></article>
          <article className="admin-metric-card"><small>Items sold</small><strong>{analytics.totalItemsSold}</strong><span>{analytics.delivered} delivered orders</span></article>
          <article className="admin-metric-card"><small>Average order value</small><strong>{money(analytics.averageOrder)}</strong><span>{analytics.openOrders} orders still active</span></article>
          <article className="admin-metric-card"><small>Total products</small><strong>{products.length}</strong><span>{analytics.unitsInStock} units currently in stock</span></article>
          <article className="admin-metric-card"><small>Low stock</small><strong>{analytics.lowStock.length}</strong><span>Five units or fewer</span></article>
          <article className="admin-metric-card"><small>Out of stock</small><strong>{analytics.outOfStock.length}</strong><span>Needs replenishment</span></article>
          <article className="admin-metric-card"><small>Delivered orders</small><strong>{analytics.delivered}</strong><span>Completed customer journeys</span></article>
          <article className="admin-metric-card"><small>Open orders</small><strong>{analytics.openOrders}</strong><span>Requires operational attention</span></article>
        </section>
        <section className="admin-grid-2">
          <article className="admin-panel"><div className="admin-panel-header"><div><span className="admin-eyebrow">Product demand</span><h2>Best-selling products</h2></div></div>{analytics.topProducts.length === 0 ? <div className="admin-empty">Sales rankings will appear after orders are placed.</div> : analytics.topProducts.map((product) => <div className="admin-progress-row" key={product.name}><div className="admin-progress-label"><strong>{product.name}</strong><span>{product.quantity} sold · {money(product.revenue)}</span></div><div className="admin-progress-track"><div className="admin-progress-fill" style={{ width: `${(product.quantity / maxTopQuantity) * 100}%` }} /></div></div>)}</article>
          <article className="admin-panel"><div className="admin-panel-header"><div><span className="admin-eyebrow">Inventory watch</span><h2>Products needing attention</h2></div></div>{[...analytics.outOfStock, ...analytics.lowStock].length === 0 ? <div className="admin-empty">Inventory is healthy. No low-stock alerts.</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Status</th></tr></thead><tbody>{[...analytics.outOfStock, ...analytics.lowStock].slice(0, 8).map((product) => <tr key={product.id}><td><strong>{product.name}</strong></td><td>{product.category || "Collection"}</td><td>{Number(product.stock || 0)}</td><td>{Number(product.stock || 0) <= 0 ? "Out of stock" : "Low stock"}</td></tr>)}</tbody></table></div>}</article>
        </section>
        <section className="admin-panel"><div className="admin-panel-header"><div><span className="admin-eyebrow">Latest activity</span><h2>Recent orders</h2></div></div>{recentOrders.length === 0 ? <div className="admin-empty">No orders have been placed yet.</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th>Total</th></tr></thead><tbody>{recentOrders.map((order) => <tr key={order.order_number || order.id}><td><strong>{order.order_number || order.id}</strong></td><td>{order.customer_name || "Customer"}</td><td>{order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}</td><td>{order.status || "Order Received"}</td><td>{money(order.total)}</td></tr>)}</tbody></table></div>}</section>
      </>}
    </AdminLayout>
  );
}

export default Reports;