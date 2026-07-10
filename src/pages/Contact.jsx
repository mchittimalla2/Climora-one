import { Link } from "react-router-dom";
import "../App.css";

function Contact() {
  return (
    <div>
      <header className="simple-header">
        <img src="/images/logo.jpeg" alt="Climoraone" className="header-logo" />
        <Link to="/">Back to Store</Link>
      </header>
      <main className="page-container">
        <h1>Contact Us</h1>

        <div className="policy-card">
          <p>
            For order support, delivery issues, returns, or product questions,
            please contact us.
          </p>

          <p><strong>Email:</strong> support@climoraone.com</p>
          <p><strong>Phone:</strong> +91 98765 43210</p>
          <p><strong>WhatsApp:</strong> +91 98765 43210</p>

          <h3>Business Hours</h3>
          <p>Monday to Saturday, 10:00 AM – 6:00 PM IST</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer-bottom-only">
      © 2026 Climoraone. All rights reserved.
    </footer>
  );
}

export default Contact;