import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearCustomerSession, customerApi } from "../auth/customerAuth";
import { useCustomer } from "../context/CustomerContext";
import { PublicPageLayout } from "../components/PublicPageLayout";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="google-icon">
    <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.9-1.75 2.98-4.33 2.98-7.37Z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.4l-3.24-2.52c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.39 13.91A6.02 6.02 0 0 1 6.08 12c0-.66.11-1.3.31-1.91v-2.6H3.04A10 10 0 0 0 2 12c0 1.62.39 3.16 1.04 4.51l3.35-2.6Z" />
    <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.49l3.35 2.6C7.18 7.72 9.39 5.96 12 5.96Z" />
  </svg>
);

export default function CustomerAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { accept } = useCustomer();
  const [tab, setTab] = useState("login");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const code = params.get("code");
    const oauthError = params.get("oauth_error");

    if (oauthError) {
      setError(oauthError === "link_required"
        ? "An account already uses this email. Sign in with your password before linking Google."
        : "Google sign-in could not be completed.");
    }

    if (location.pathname === "/verify-email-change" && token) {
      customerApi("/api/customer/email-change/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
        .then(async (response) => { const data = await response.json(); if (response.ok) { clearCustomerSession(); setMessage(data.message); } else setError(data.message); });
    }

    if (location.pathname === "/verify-email" && token) {
      customerApi("/api/customer/auth/email/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
        .then(async (response) => { const data = await response.json(); response.ok ? setMessage(data.message) : setError(data.message); });
    }

    if (location.pathname === "/auth/google/callback" && code) {
      customerApi("/api/customer/auth/google/exchange", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) })
        .then(async (response) => { const data = await response.json(); if (response.ok) { accept(data); navigate("/account", { replace: true }); } else setError(data.message); });
    }

    if (location.pathname === "/reset-password") setTab("reset");
  }, [location.pathname, location.search, accept, navigate]);

  const changeTab = (nextTab) => {
    setTab(nextTab);
    setError("");
    setMessage("");
    setFieldErrors({});
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form);
    if (tab === "register") payload.terms = Boolean(form.get("terms"));

    try {
      const path = tab === "register" ? "register" : tab === "forgot" ? "forgot-password" : tab === "reset" ? "reset-password" : "login";
      if (tab === "reset") payload.token = new URLSearchParams(location.search).get("token");
      const response = await customerApi(`/api/customer/auth/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = Number(response.headers.get("Retry-After"));
          const waitText = Number.isFinite(retryAfter) && retryAfter > 0
            ? `Please wait ${retryAfter} seconds and try again.`
            : "Please wait a moment and try again.";
          throw new Error(`You have made several attempts. ${waitText}`);
        }

        if (data.errors) {
          const normalized = Object.fromEntries(Object.entries(data.errors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
          setFieldErrors(normalized);
          throw new Error("Please review the highlighted fields below.");
        }
        throw new Error(data.message || "Unable to continue.");
      }

      if (data.token) {
        accept(data);
        navigate(location.state?.from || "/account");
      } else {
        setMessage(data.message);
      }
    } catch (submissionError) {
      setError(submissionError.message || "Unable to continue.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setError("");
    const response = await customerApi("/api/customer/auth/google/redirect");
    const data = await response.json();
    if (response.ok) window.location.assign(data.url);
    else { setError(data.message); setBusy(false); }
  };

  const field = (name, label, input) => (
    <label className={fieldErrors[name] ? "field-has-error" : ""}>
      {label}
      {input}
      {fieldErrors[name] && <small className="field-error">{fieldErrors[name]}</small>}
    </label>
  );

  return (
    <PublicPageLayout eyebrow="Customer account" title="Your Climoraone account" description="Orders, invoices and thoughtful recommendations in one secure place." className="customer-page">
      <section className="customer-auth-card">
        <div className="customer-auth-tabs">
          <button type="button" className={tab === "login" ? "active" : ""} onClick={() => changeTab("login")}>Sign In</button>
          <button type="button" className={tab === "register" ? "active" : ""} onClick={() => changeTab("register")}>Create Account</button>
        </div>

        {error && <div className="customer-alert error">{error}</div>}
        {message && <div className="customer-alert success">{message}</div>}

        <form onSubmit={submit} className="customer-form" noValidate>
          {tab === "register" && <>
            {field("name", "Full name", <input name="name" required minLength="2" autoComplete="name" placeholder="Enter your full name" />)}
            {field("username", "Username", <input name="username" required minLength="3" pattern="[A-Za-z0-9._-]+" autoComplete="username" placeholder="Letters, numbers, dots, _ or -" />)}
            {field("email", "Email address", <input name="email" type="email" required autoComplete="email" placeholder="name@example.com" />)}
            {field("phone", <>Mobile number <small>Optional</small></>, <input name="phone" inputMode="tel" autoComplete="tel" placeholder="10-digit Indian mobile number" />)}
          </>}

          {tab === "login" && field("identifier", "Username or email", <input name="identifier" autoComplete="username" required placeholder="Enter username or email" />)}
          {tab === "forgot" && field("email", "Email address", <input name="email" type="email" required placeholder="name@example.com" />)}
          {tab === "reset" && <>
            {field("password", "New password", <input name="password" type="password" required placeholder="8+ chars, upper, lower and number" />)}
            {field("password_confirmation", "Confirm password", <input name="password_confirmation" type="password" required placeholder="Re-enter your new password" />)}
          </>}

          {["login", "register"].includes(tab) && <>
            {field("password", "Password", <input name="password" type="password" required autoComplete={tab === "register" ? "new-password" : "current-password"} placeholder={tab === "register" ? "8+ chars, upper, lower and number" : "Enter your password"} />)}
            {tab === "register" && <>
              {field("password_confirmation", "Confirm password", <input name="password_confirmation" type="password" required autoComplete="new-password" placeholder="Re-enter your password" />)}
              <label className={`customer-check ${fieldErrors.terms ? "field-has-error" : ""}`}>
                <input name="terms" type="checkbox" required /> I agree to the <Link to="/terms" target="_blank">Terms of Use</Link> and <Link to="/privacy-policy" target="_blank">Privacy Policy</Link>
                {fieldErrors.terms && <small className="field-error">{fieldErrors.terms}</small>}
              </label>
            </>}
          </>}

          <button className="customer-primary" disabled={busy}>{busy ? "Please wait..." : tab === "register" ? "Create Account" : tab === "forgot" ? "Send Reset Link" : tab === "reset" ? "Reset Password" : "Sign In"}</button>
        </form>

        {tab === "login" && <button type="button" className="customer-text-button" onClick={() => changeTab("forgot")}>Forgot password?</button>}
        {["login", "register"].includes(tab) && <>
          <div className="customer-or"><span>or</span></div>
          <button type="button" className="customer-google" onClick={google} disabled={busy}>
            <GoogleIcon />
            <span>{tab === "register" ? "Create account with Google" : "Continue with Google"}</span>
          </button>
        </>}
        <Link className="customer-guest" to="/">Continue Shopping as Guest</Link>
      </section>
    </PublicPageLayout>
  );
}
