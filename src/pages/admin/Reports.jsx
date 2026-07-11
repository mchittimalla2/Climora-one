import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "../../App.css";

function Reports() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    setOrders(JSON.parse(localStorage.getItem("climoraone_orders")) || []);
    setProducts(JSON.parse(localStorage.getItem("climoraone_products")) || []);
  }, []);

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  const totalItemsSold = orders.reduce(
    (sum, order) =>
      sum +
      order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  const lowStockProducts = products.filter(
    (product) => (product.stock ?? 0) <= (product.lowStockAlert ?? 5)
  );

  return (
    <div>
      <header className="header">
        <div className="logo-section">
          <img
            src="/images/logo.jpeg"
            alt="Climoraone"
            className="header-logo"
          />
        </div>

        <nav>
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/orders">Orders</Link>
          <Link to="/admin/products">Products</Link>
          <Link to="/">Store</Link>
        </nav>
      </header>
      <section className="admin-dashboard">
        <h2>Reports</h2>

        <div className="impact">
          <div>
            <h3>Total Revenue</h3>
            <p>₹{totalRevenue}</p>
          </div>

          <div>
            <h3>Items Sold</h3>
            <p>{totalItemsSold}</p>
          </div>

          <div>
            <h3>Total Products</h3>
            <p>{products.length}</p>
          </div>

          <div>
            <h3>Low Stock Products</h3>
            <p>{lowStockProducts.length}</p>
          </div>
        </div>

        <h2>Low Stock Alerts</h2>

        {lowStockProducts.length === 0 ? (
          <p>No low stock products.</p>
        ) : (
          lowStockProducts.map((product) => (
            <div className="admin-order" key={product.id}>
              <h3>{product.name}</h3>
              <p>Current Stock: {product.stock ?? 0}</p>
              <p>Alert Level: {product.lowStockAlert ?? 5}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default Reports;