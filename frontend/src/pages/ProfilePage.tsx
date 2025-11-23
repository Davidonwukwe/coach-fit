import React from "react";
import { useAuth } from "../hooks/useAuth";

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return <p>Loading...</p>;

  const avatar = (user as any).photoURL || "/default-avatar.png";

  return (
    <div className="app-main" style={{ maxWidth: 800 }}>
      <h1 style={{ marginBottom: "1rem" }}>My Profile</h1>

      <div
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        {/* Profile Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <img
            src={avatar}
            alt="avatar"
            style={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              border: "2px solid #ddd",
            }}
          />

          <div>
            <h2 style={{ margin: 0 }}>{user.name}</h2>
            <p style={{ margin: "0.2rem 0", color: "#6b7280" }}>{user.email}</p>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
          <button
            style={{
              padding: "0.6rem 1.2rem",
              background: "#3b82f6",
              color: "white",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
            onClick={() => alert("Edit profile coming soon")}
          >
            Edit Profile
          </button>

          <button
            style={{
              padding: "0.6rem 1.2rem",
              background: "white",
              color: "#dc2626",
              borderRadius: 8,
              border: "1px solid #dc2626",
              cursor: "pointer",
              fontWeight: 600,
            }}
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
