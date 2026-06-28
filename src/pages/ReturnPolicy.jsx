import "../App.css";

function ReturnPolicy() {
  return (
    <div>
      <header className="simple-header">
        <img src="/images/logo.jpeg" alt="Climoraone" className="header-logo" />
        <a href="/">Back to Store</a>
      </header>

      <main className="page-container">
        <h1>Return & Refund Policy</h1>

        <div className="policy-card">
          <p>
            We accept returns within 7 days of delivery only if the product is
            damaged, defective, or incorrect.
          </p>

            <h3>Eligibility for Returns</h3>

            <ul>
            <li>Order ID is required.</li>
            <li>Photo proof of damage is required.</li>
            <li>Product must be unused.</li>
            <li>Product should be returned in original packaging.</li>
            </ul>

            <h3>Important Notes</h3>

            <p>
            Handmade products may have small variations in color, shape, or finish.
            These variations are part of the handmade process and are not considered defects.
            </p>

            <p>
            Refunds will be processed after the returned product is verified.
            </p>

            <p>
            For return support contact:
            <strong> support@climoraone.com</strong>
            </p>
        </div>
      </main>

      <footer className="footer-bottom-only">
        © 2026 Climoraone. All rights reserved.
      </footer>
    </div>
  );
}

export default ReturnPolicy;