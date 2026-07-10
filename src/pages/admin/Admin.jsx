import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "../../App.css";
import { API_BASE_URL } from "../../config/api";

function Admin() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ordersResponse, productsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/orders`),
        fetch(`${API_BASE_URL}/api/products`),
      ]);

      const ordersData = await ordersResponse.json();
      const productsData = await productsResponse.json();

      setOrders(ordersData);
      setProducts(productsData);
    } catch (error) {
      console.error("Dashboard load failed:", error);
      alert("Unable to load dashboard data.");
    }
  };

  const totalOrders = orders.length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  const openOrders = orders.filter(
    (order) => order.status !== "Delivered"
  ).length;

  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const itemsSold = orders.reduce((sum, order) => {
    const orderItems = order.items || [];
    return (
      sum +
      orderItems.reduce(
        (itemSum, item) => itemSum + Number(item.quantity || 0),
        0
      )
    );
  }, 0);

  const totalProducts = products.length;

  return (
    <div>
      <header className="header">
        <div className="logo-section">
          <img src="/images/logo.jpeg" alt="Climoraone" className="header-logo" />
        </div>

        <nav>
          <Link to="/">Store</Link>
          <Link to="/admin/orders">Orders</Link>
          <Link to="/admin/products">Products</Link>
          <Link to="/admin/reports">Reports</Link>
        </nav>
      </header>
      <section className="admin-dashboard">
        <h2>Climoraone Admin Dashboard</h2>

        <div className="impact">
          <div>
            <h3>Total Orders</h3>
            <p>{totalOrders}</p>
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
            <p>{itemsSold}</p>
          </div>

          <div>
            <h3>Total Products</h3>
            <p>{totalProducts}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Admin;