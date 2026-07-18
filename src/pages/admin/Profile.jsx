import { useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { adminApi, clearAdminSession, getAdminUser, saveAdminSession, getAdminToken } from "../../auth/adminAuth";

export default function Profile() {
  const currentUser = getAdminUser();
  const [name, setName] = useState(currentUser?.name || "");
  const [username, setUsername] = useState(currentUser?.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailStep, setEmailStep] = useState("request");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const readResponse = async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || Object.values(data?.errors || {}).flat()[0] || "Request failed.");
    return data;
  };

  const call = async (path, method, body) => readResponse(await adminApi(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }));

  const updateProfile = async (event) => {
    event.preventDefault();
    try {
      setSaving(true); setError(""); setMessage("");
      const data = await call("/api/admin/profile", "PUT", { name, username });
      saveAdminSession(getAdminToken(), data.user);
      setMessage(data.message);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    try {
      setSaving(true); setError(""); setMessage("");
      await call("/api/admin/profile/password", "PUT", { current_password: currentPassword, password, password_confirmation: passwordConfirmation });
      clearAdminSession();
      window.location.assign("/login");
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const sendEmailChangeCode = async () => {
    const data = await call("/api/admin/profile/email-change", "POST", { new_email: newEmail, current_password: emailPassword });
    setEmailStep("verify");
    setEmailOtp("");
    setMessage(`${data.message} Check Inbox, Junk and Spam. The code expires in 10 minutes.`);
  };

  const requestEmailChange = async (event) => {
    event.preventDefault();
    try {
      setSaving(true); setError(""); setMessage("");
      await sendEmailChangeCode();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const resendEmailChangeCode = async () => {
    try {
      setSaving(true); setError(""); setMessage("");
      await sendEmailChangeCode();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const verifyEmailChange = async (event) => {
    event.preventDefault();
    try {
      setSaving(true); setError(""); setMessage("");
      await call("/api/admin/profile/email-change/verify", "POST", { new_email: newEmail, otp: emailOtp });
      clearAdminSession();
      window.location.assign("/login");
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <AdminLayout eyebrow="Account security" title="My profile" description="Manage your display identity, login username, verified personal email and password.">
      {error && <div className="admin-alert error">{error}</div>}
      {message && <div className="admin-alert success">{message}</div>}
      <div className="admin-profile-grid">
        <section className="admin-panel">
          <div className="admin-panel-header"><div><span className="admin-eyebrow">Identity</span><h2>Profile details</h2></div></div>
          <form className="admin-profile-form" onSubmit={updateProfile}>
            <label>Display name<input value={name} onChange={(e) => setName(e.target.value)} required maxLength="120" /></label>
            <label>Username<input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))} required minLength="3" maxLength="50" /></label>
            <label>Current email<div className="admin-profile-readonly">{currentUser?.email}</div></label>
            <label>Role<div className="admin-profile-readonly">{currentUser?.role}</div></label>
            <button className="admin-primary-btn" disabled={saving}>Save profile</button>
          </form>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header"><div><span className="admin-eyebrow">Verified email</span><h2>Change personal email</h2></div></div>
          {emailStep === "request" ? <form className="admin-profile-form" onSubmit={requestEmailChange}>
            <label>New email address<input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required /></label>
            <label>Current password<input type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} autoComplete="current-password" required /></label>
            <button className="admin-primary-btn" disabled={saving}>Send verification code</button>
          </form> : <form className="admin-profile-form" onSubmit={verifyEmailChange}>
            <div className="admin-profile-readonly">Verification code requested for {newEmail}</div>
            <label>Six-digit code<input inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))} required /></label>
            <small>{emailOtp.length}/6 digits entered. The Verify button activates after all six digits are entered.</small>
            <button className="admin-primary-btn" disabled={saving || emailOtp.length !== 6}>Verify and update email</button>
            <button type="button" className="admin-secondary-btn" onClick={resendEmailChangeCode} disabled={saving}>Resend code</button>
            <button type="button" className="admin-secondary-btn" onClick={() => { setEmailStep("request"); setEmailOtp(""); setMessage(""); setError(""); }} disabled={saving}>Cancel</button>
          </form>}
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header"><div><span className="admin-eyebrow">Credentials</span><h2>Change password</h2></div></div>
          <form className="admin-profile-form" onSubmit={changePassword}>
            <label>Current password<input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required /></label>
            <label>New password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required minLength="12" /></label>
            <label>Confirm new password<input type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} autoComplete="new-password" required minLength="12" /></label>
            <button className="admin-primary-btn" disabled={saving}>Change password</button>
          </form>
        </section>
      </div>
    </AdminLayout>
  );
}
