import { PublicPageLayout } from "../components/PublicPageLayout";

export default function PrivacyPolicy() {
  return <PublicPageLayout eyebrow="Legal" title="Privacy Policy" description="How Climoraone collects, uses and protects customer information.">
    <article className="page-container legal-page">
      <p><strong>Effective date:</strong> July 22, 2026</p>
      <h2>Information we collect</h2>
      <p>We collect information you provide when you create an account, place an order, contact us or update your profile, including your name, username, email address, mobile number, delivery address and order details.</p>
      <h2>Payments</h2>
      <p>Payments are processed by our payment service provider. Climoraone does not store complete card, UPI PIN or banking credentials.</p>
      <h2>How we use information</h2>
      <p>We use customer information to operate accounts, process and deliver orders, issue invoices, provide support, prevent fraud, secure the service, comply with law and improve product recommendations.</p>
      <h2>Sharing</h2>
      <p>We may share only the information needed with payment processors, delivery partners, email providers, hosting providers, professional advisers and government authorities where legally required. We do not sell personal information.</p>
      <h2>Retention and security</h2>
      <p>We retain information for as long as needed to provide services, maintain transaction and tax records, resolve disputes and meet legal obligations. We use access controls, encryption in transit, logging and restricted administrative access, but no online service can guarantee absolute security.</p>
      <h2>Your choices</h2>
      <p>You may update your profile, change your password and request correction or deletion of eligible personal information by contacting Climoraone. Some transaction records may need to be retained for legal or accounting purposes.</p>
      <h2>Cookies and similar technologies</h2>
      <p>We may use essential cookies or local storage for login sessions, carts, security and site preferences. Additional analytics or advertising technologies will be disclosed before they are introduced.</p>
      <h2>Children</h2>
      <p>Climoraone is not intended for children to create accounts or make purchases without involvement of a parent or legal guardian.</p>
      <h2>Contact</h2>
      <p>Privacy questions or requests may be sent through the Contact Us page. We may update this policy as our services or legal requirements change.</p>
    </article>
  </PublicPageLayout>;
}
