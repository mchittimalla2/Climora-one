import { PublicPageLayout } from "../components/PublicPageLayout";

function ReturnPolicy() {
  return (
    <PublicPageLayout
      eyebrow="Customer care"
      title="Return & Refund Policy"
      description="Clear, considered support for handcrafted products selected with care."
    >
      <p className="policy-intro">
        We accept return requests within 7 days of delivery when a product is damaged, defective, or different from what was ordered.
      </p>

      <div className="policy-grid">
        <section className="policy-panel">
          <h3>Eligibility for returns</h3>
          <ul>
            <li>Your order number is required.</li>
            <li>Photo or video proof of the issue is required.</li>
            <li>The product must be unused.</li>
            <li>The original packaging should be retained.</li>
          </ul>
        </section>

        <section className="policy-panel">
          <h3>Handmade character</h3>
          <p>
            Small variations in colour, grain, shape, or finish are natural characteristics of handcrafted work. These details make every piece individual and are not treated as defects.
          </p>
        </section>
      </div>

      <h3>Refund processing</h3>
      <p>
        Once the returned product is received and verified, an approved refund will be processed through the original payment method. Processing timelines may vary by payment provider.
      </p>

      <h3>Need assistance?</h3>
      <p>Contact <strong>support@climoraone.com</strong> with your order number and supporting images.</p>
    </PublicPageLayout>
  );
}

export default ReturnPolicy;
