"use client";

import { useApp } from "@/lib/store";

export default function Header() {
  const { user, logout } = useApp();

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="header">
      <div className="header-inner container">
        <div className="brand">
          <div className="brand-mark">OW</div>
          <div className="brand-text">
            <strong>Onward Workspaces</strong>
            <span>{today}</span>
          </div>
        </div>

        <div className="header-controls">
          <div className="user-chip">
            <div className="avatar">{initials}</div>
            <div className="user-meta">
              <strong>{user.name}</strong>
              <span className={`role-badge ${user.role}`}>
                {user.role === "manager" ? "Manager" : user.location}
              </span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
