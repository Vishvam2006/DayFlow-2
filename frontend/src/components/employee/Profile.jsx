import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/authContext";
import { Camera, Save, X, User, Mail, Briefcase, FileText, Lock, ShieldCheck } from "lucide-react";
import API_BASE_URL from "../../config/api.js";

const C = { text: "#0f172a", sub: "#475569", muted: "#94a3b8", border: "#e2e8f0", indigo: "#4f46e5", green: "#059669", bg: "#f4f6f9", card: "#fff" };

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name: "", jobTitle: "", bio: "" });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordState, setPasswordState] = useState({ loading: false, error: "", success: "" });

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    // Load profile from MongoDB on mount
    const fetchProfile = async () => {
      try {
        const r = await axios.get(`${API_BASE_URL}/api/profile/me`, { headers });
        if (r.data.success) {
          const u = r.data.user;
          setProfile({ name: u.name || "", jobTitle: u.jobTitle || "", bio: u.bio || "" });
          if (u.profileImage) setPreview(`${API_BASE_URL}/${u.profileImage}`);
        }
      } catch (e) {
        // Fallback to auth context
        setProfile({ name: user?.name || "", jobTitle: user?.jobTitle || "", bio: user?.bio || "" });
      }
    };
    fetchProfile();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", profile.name);
      formData.append("jobTitle", profile.jobTitle);
      formData.append("bio", profile.bio);
      if (image) formData.append("profileImage", image);

      const r = await axios.put(`${API_BASE_URL}/api/profile/update`, formData, { headers });
      if (r.data.success) {
        setIsEditing(false);
        setImage(null);
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 3000);
        if (r.data.user?.profileImage) setPreview(`${API_BASE_URL}/${r.data.user.profileImage}`);
        updateUser(r.data.user);
      }
    } catch (e) { console.log(e); }
    setSaving(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordState({ loading: true, error: "", success: "" });

    try {
      const r = await axios.put(`${API_BASE_URL}/api/profile/change-password`, passwordForm, { headers });
      if (r.data.success) {
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setPasswordState({ loading: false, error: "", success: r.data.message || "Password updated successfully." });
      }
    } catch (error) {
      setPasswordState({
        loading: false,
        error: error.response?.data?.message || "Unable to change password right now.",
        success: "",
      });
    }
  };

  const inputStyle = { width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "9px", fontSize: "14px", color: C.text, outline: "none" };

  const card = { background: C.card, borderRadius: "12px", border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", maxWidth: "640px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: C.text, letterSpacing: "-0.4px" }}>My Profile</h1>
        <p style={{ color: C.sub, fontSize: "13px", marginTop: "3px" }}>Manage your personal information and photo</p>
      </div>

      {savedMsg && (
        <div style={{ padding: "11px 16px", borderRadius: "9px", marginBottom: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: C.green, fontSize: "13px", fontWeight: 500 }}>
          ✓ Profile updated successfully
        </div>
      )}

      {/* Profile Card */}
      <div style={{ ...card, marginBottom: "16px" }}>
        {/* Cover */}
        <div style={{ height: "80px", background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)" }} />

        {/* Avatar + Info */}
        <div style={{ padding: "0 24px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" }}>
            <div style={{ position: "relative", marginTop: "-36px" }}>
              {preview ? (
                <img src={preview} alt="avatar" style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "3px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }} />
              ) : (
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg,#4f46e5,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 700, color: "#fff", border: "3px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
                  {(profile.name || "E").charAt(0).toUpperCase()}
                </div>
              )}
              {isEditing && (
                <label style={{ position: "absolute", bottom: 2, right: 2, width: "26px", height: "26px", borderRadius: "50%", background: C.indigo, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid #fff" }}>
                  <Camera size={12} color="#fff" />
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                </label>
              )}
            </div>
            <div>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} style={{ padding: "8px 18px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "#fff", color: C.sub, fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.indigo; e.currentTarget.style.color = C.indigo; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.sub; }}
                >
                  Edit Profile
                </button>
              ) : (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => { setIsEditing(false); setImage(null); }} style={{ padding: "8px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "#fff", color: C.sub, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                    <X size={13} /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", opacity: saving ? 0.7 : 1 }}>
                    <Save size={13} /> {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {isEditing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.sub, marginBottom: "6px" }}>Full Name</label>
                <input style={inputStyle} value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Your full name"
                  onFocus={e => e.target.style.borderColor = C.indigo} onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.sub, marginBottom: "6px" }}>Job Title</label>
                <input style={inputStyle} value={profile.jobTitle} onChange={e => setProfile({ ...profile, jobTitle: e.target.value })} placeholder="e.g. Software Engineer"
                  onFocus={e => e.target.style.borderColor = C.indigo} onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.sub, marginBottom: "6px" }}>Bio</label>
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "90px" }} value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} placeholder="A short bio about yourself…"
                  onFocus={e => e.target.style.borderColor = C.indigo} onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
            </div>
          ) : (
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: C.text }}>{profile.name || "—"}</h2>
              <p style={{ color: C.indigo, fontSize: "13px", fontWeight: 500, marginTop: "2px" }}>{profile.jobTitle || "No title set"}</p>
              {profile.bio && <p style={{ color: C.sub, fontSize: "13.5px", marginTop: "10px", lineHeight: 1.65 }}>{profile.bio}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Account Info */}
      <div style={card}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid #f1f5f9` }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.7px" }}>Account Details</p>
        </div>
        <div style={{ padding: "4px 24px 8px" }}>
          {[
            { icon: User, label: "Full Name", value: profile.name || "—" },
            { icon: Mail, label: "Email", value: user?.email || "—" },
            { icon: Briefcase, label: "Role", value: user?.role || "employee", cap: true },
            { icon: FileText, label: "Bio", value: profile.bio || "Not set" },
          ].map(({ icon: Ic, label, value, cap }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 0", borderBottom: "1px solid #f8fafc" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Ic size={15} color={C.indigo} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "11px", color: C.muted, fontWeight: 500 }}>{label}</p>
                <p style={{ fontSize: "13.5px", color: C.text, fontWeight: 500, textTransform: cap ? "capitalize" : "none" }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...card, marginTop: "16px", padding: "22px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={17} color={C.indigo} />
          </div>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: C.text }}>Change Password</h2>
            <p style={{ fontSize: "12px", color: C.sub, marginTop: "2px" }}>Use a strong password with uppercase, lowercase, number, and symbol.</p>
          </div>
        </div>

        {passwordState.error ? (
          <div style={{ padding: "11px 14px", borderRadius: "9px", marginBottom: "14px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "13px" }}>
            {passwordState.error}
          </div>
        ) : null}

        {passwordState.success ? (
          <div style={{ padding: "11px 14px", borderRadius: "9px", marginBottom: "14px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: C.green, fontSize: "13px" }}>
            {passwordState.success}
          </div>
        ) : null}

        <form onSubmit={handlePasswordChange} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          {[
            { key: "currentPassword", label: "Current Password" },
            { key: "newPassword", label: "New Password" },
            { key: "confirmPassword", label: "Confirm Password" },
          ].map((field, index) => (
            <div key={field.key} style={index === 2 ? { gridColumn: "1 / -1" } : undefined}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.sub, marginBottom: "6px" }}>{field.label}</label>
              <div style={{ position: "relative" }}>
                <Lock size={14} color={C.muted} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="password"
                  value={passwordForm[field.key]}
                  onChange={(e) => setPasswordForm({ ...passwordForm, [field.key]: e.target.value })}
                  style={{ ...inputStyle, paddingLeft: "36px" }}
                  onFocus={e => e.target.style.borderColor = C.indigo}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
            </div>
          ))}
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={passwordState.loading}
              style={{
                padding: "10px 18px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg,#4f46e5,#6366f1)",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
                opacity: passwordState.loading ? 0.7 : 1,
              }}
            >
              {passwordState.loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
