import "../App.css";

function ShippingPolicy() {
  return (
    <div>
      <header className="simple-header">
        <img src="/images/logo.jpeg" alt="Climoraone" className="header-logo" />
        <a href="/">Back to Store</a>
      </header>

      <main className="page-container">
        <h1>Shipping Policy</h1>

        <div className="policy-card">
          <p>We currently ship products across India.</p>

          <ul>
            <li>Order Processing Time: 2–3 Business Days</li>
            <li>Estimated Delivery: 5–10 Business Days</li>
            <li>Tracking details will be shared after shipment.</li>
          </ul>

          <p>
            Delivery timelines may vary depending on location, courier service,
            holidays, and weather conditions.
          </p>

          <p>
            For shipping support: <strong>support@climoraone.com</strong>
          </p>
        </div>
      </main>

      <footer className="footer-bottom-only">
        © 2026 Climoraone. All rights reserved.
      </footer>
    </div>
  );
}

export default ShippingPolicy;