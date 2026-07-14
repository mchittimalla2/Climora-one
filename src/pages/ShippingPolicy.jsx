import { PublicPageLayout } from "../components/PublicPageLayout";

function ShippingPolicy() {
  return (
    <PublicPageLayout
      eyebrow="Careful delivery"
      title="Shipping Policy"
      description="Thoughtful packaging and dependable delivery for every handcrafted piece."
    >
      <p className="policy-intro">
        Climoraone currently delivers across India. Every order is prepared with care so handcrafted products arrive safely and beautifully presented.
      </p>

      <div className="policy-grid">
        <section className="policy-panel">
          <h3>Order preparation</h3>
          <p>Orders are generally processed within 2–3 business days after confirmation.</p>
        </section>

        <section className="policy-panel">
          <h3>Estimated delivery</h3>
          <p>Most orders arrive within 5–10 business days, depending on the destination and courier network.</p>
        </section>

        <section className="policy-panel">
          <h3>Tracking updates</h3>
          <p>Tracking information will be shared after dispatch and can be checked from the Track Order page.</p>
        </section>

        <section className="policy-panel">
          <h3>Delivery considerations</h3>
          <p>Timelines can vary due to location, holidays, weather conditions, or courier service interruptions.</p>
        </section>
      </div>

      <h3>Shipping assistance</h3>
      <p>For delivery support, contact <strong>support@climoraone.com</strong> with your order number.</p>
    </PublicPageLayout>
  );
}

export default ShippingPolicy;
