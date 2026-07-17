import { useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { adminApi, getAdminUser, saveAdminSession, getAdminToken } from "../../auth/adminAuth";

export default function Profile() {
  const currentUser = getAdminUser();
  const [name, setName] = useState(currentUser?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const readResponse = async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || Object.values(data?.errors || {}).flat()[0] || "Request failed.");
    return data;
  };

  const updateProfile = async (event) => {
    event.preventDefault();
    try {
      setSaving(true); setError(""); setProfileMessage("");
      const data = await readResponse(await adminApi("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }));
      saveAdminSession(getAdminToken(), data.user);
      setProfileMessage(data.message);
    } catch (profileError) { setError(profileError.message); } finally { setSaving(false); }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    try {
      setSaving(true); setError(""); setPasswordMessage("");
      const data = await readResponse(await adminApi("/api/admin/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, password, password_confirmation: passwordConfirmation }),
      }));
      setPasswordMessage(data.message);
      setCurrentPassword(""); setPassword(""); setPasswordConfirmation("");
    } catch (passwordError) { setError(passwordError.message); } finally { setSaving(false); }
  };

  return (
    <AdminLayout eyebrow="Account security" title="My profile" description="Manage your display name and password. Email changes require a separate verification workflow and are intentionally not enabled yet.">
      {error && <div className="admin-alert error">{error}</div>}
      <div className="admin-profile-grid">
        <section className="admin-panel">
          <div className="admin-panel-header"><div><span className="admin-eyebrow">Identity</span><h2>Profile details</h2></div></div>
          {profileMessage && <div className="admin-alert success">{profileMessage}</div>}
          <form className="admin-profile-form" onSubmit={updateProfile}>
            <label>Display name<input value={name} onChange={(event) => setName(event.target.value)} required maxLength="120" /></label>
            <label>Email address<div className="admin-profile-readonly">{currentUser?.email}</div></label>
            <label>Role<div className="admin-profile-readonly">{currentUser?.role}</div></label>
            <button className="admin-primary-btn" disabled={saving}>Save profile</button>
          </form>
          <div className="admin-role-note">Your email, role, MFA setting and account status cannot be changed directly from this page. This prevents account takeover and privilege escalation.</div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header"><div><span className="admin-eyebrow">Credentials</span><h2>Change password</h2></div></div>
          {passwordMessage && <div className="admin-alert success">{passwordMessage}</div>}
          <form className="admin-profile-form" onSubmit={changePassword}>
            <label>Current password<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required /></label>
            <label>New password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required minLength="12" /></label>
            <label>Confirm new password<input type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} autoComplete="new-password" required minLength="12" /></label>
            <button className="admin-primary-btn" disabled={saving}>Change password</button>
          </form>
        </section>
      </div>
    </AdminLayout>
  );
}
