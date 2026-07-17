import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import { saveAdminSession } from "../../auth/adminAuth";
import { BrandLogo } from "../../components/BrandLogo";
import "../../styles/admin-login.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const request = async (path, body) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || Object.values(data?.errors || {}).flat()[0] || "Request failed.");
    return data;
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    try {
      setLoading(true); setError(""); setMessage("");
      await request("/api/admin/auth/login", { email, password });
      setStep("otp");
      setMessage("A six-digit security code was sent to your registered email address.");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const submitOtp = async (event) => {
    event.preventDefault();
    try {
      setLoading(true); setError("");
      const data = await request("/api/admin/auth/verify-otp", { email, otp });
      saveAdminSession(data.token, data.user);
      navigate(location.state?.from || "/admin", { replace: true });
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const resendOtp = async () => {
    try {
      setLoading(true); setError("");
      await request("/api/admin/auth/resend-otp", { email, password });
      setMessage("A new security code was sent.");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <BrandLogo className="admin-login-logo" />
        <span className="admin-login-eyebrow">Private administration</span>
        <h1>{step === "password" ? "Sign in to Commerce Studio" : "Verify your identity"}</h1>
        <p>{step === "password" ? "Use your assigned personal admin account. MFA is required on every login." : `Enter the code sent to ${email}. It expires in five minutes.`}</p>

        {message && <div className="admin-login-message">{message}</div>}
        {error && <div className="admin-login-error">{error}</div>}

        {step === "password" ? (
          <form onSubmit={submitPassword}>
            <label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></label>
            <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
            <button disabled={loading}>{loading ? "Checking..." : "Continue securely"}</button>
          </form>
        ) : (
          <form onSubmit={submitOtp}>
            <label>Six-digit code<input className="otp-input" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} autoComplete="one-time-code" required /></label>
            <button disabled={loading || otp.length !== 6}>{loading ? "Verifying..." : "Verify and sign in"}</button>
            <div className="admin-login-actions">
              <button type="button" className="text-button" onClick={resendOtp} disabled={loading}>Resend code</button>
              <button type="button" className="text-button" onClick={() => { setStep("password"); setOtp(""); setError(""); }}>Use another account</button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
