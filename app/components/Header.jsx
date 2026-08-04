"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";

export default function Header() {
  const { user, logout } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Close the drawer on Escape, and keep the page behind it from scrolling.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const roleLabel = user.role === "manager" ? "Manager" : user.location;

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
              <span className={`role-badge ${user.role}`}>{roleLabel}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            Log out
          </button>
        </div>

        <button
          className="menu-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div
        className={`drawer-backdrop ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`drawer ${menuOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Account menu"
      >
        <div className="drawer-top">
          <div className="user-chip">
            <div className="avatar">{initials}</div>
            <div className="user-meta">
              <strong>{user.name}</strong>
              <span className={`role-badge ${user.role}`}>{roleLabel}</span>
            </div>
          </div>
          <button
            className="drawer-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="drawer-section">
          <span className="drawer-label">Today</span>
          <strong>{today}</strong>
        </div>

        <div className="drawer-section">
          <span className="drawer-label">Signed in as</span>
          <strong>@{user.username}</strong>
        </div>

        <button
          className="drawer-logout"
          onClick={() => {
            setMenuOpen(false);
            logout();
          }}
        >
          Log out
        </button>
      </aside>
    </header>
  );
}
