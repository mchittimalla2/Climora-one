import { PublicPageLayout } from "../components/PublicPageLayout";

function Contact() {
  return (
    <PublicPageLayout
      eyebrow="We are here to help"
      title="Contact Climoraone"
      description="Questions about a product, an order, or delivery? Our customer care team is ready to assist."
    >
      <div className="contact-grid">
        <section className="contact-card">
          <span>Email</span>
          <h3>Customer support</h3>
          <p><strong>support@climoraone.com</strong></p>
          <p>Best for product questions, order support, returns, and delivery concerns.</p>
        </section>

        <section className="contact-card">
          <span>Phone & WhatsApp</span>
          <h3>Speak with us</h3>
          <p><strong>+91 98765 43210</strong></p>
          <p>Share your order number when contacting us for faster assistance.</p>
        </section>

        <section className="contact-card">
          <span>Business hours</span>
          <h3>Monday to Saturday</h3>
          <p><strong>10:00 AM – 6:00 PM IST</strong></p>
          <p>Messages received outside business hours will be answered on the next working day.</p>
        </section>
      </div>
    </PublicPageLayout>
  );
}

export default Contact;
