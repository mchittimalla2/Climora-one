import { useEffect, useState } from "react";
import "../../App.css";

function Admin() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const savedOrders =
      JSON.parse(localStorage.getItem("climoraone_orders")) || [];

    const savedProducts =
      JSON.parse(localStorage.getItem("climoraone_products")) || [];

    setOrders(savedOrders);
    setProducts(savedProducts);
  }, []);

  const deliveredOrders = orders.filter(
    (order) =>
      order.steps?.find((step) => step.name === "Delivered")?.completed
  ).length;

  const openOrders = orders.length - deliveredOrders;

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  const totalItemsSold = orders.reduce(
    (sum, order) =>
      sum +
      order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
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
          <a href="/">Store</a>
          <a href="/admin/orders">Orders</a>
          <a href="/admin/products">Products</a>
          <a href="/admin/reports">Reports</a>
        </nav>
      </header>

      <section className="admin-dashboard">
        <h2>Climoraone Admin Dashboard</h2>

        <div className="impact">
          <div>
            <h3>Total Orders</h3>
            <p>{orders.length}</p>
          </div>

          <div>
            <h3>Open Orders</h3>
            <p>{openOrders}</p>
          </div>

          <div>
            <h3>Delivered Orders</h3>
            <p>{deliveredOrders}</p>
          </div>

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
        </div>
      </section>
    </div>
  );
}

export default Admin;