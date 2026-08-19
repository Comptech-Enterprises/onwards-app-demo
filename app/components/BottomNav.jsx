"use client";

import { useApp } from "@/lib/store";
import styles from "./BottomNav.module.css";

function Icon({ name }) {
  if (name === "home") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
      </svg>
    );
  }
  if (name === "tasks") {
    return (
      <svg viewBox="0 0 24 24">
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <path d="M9 9h6M9 13h6M9 17h4" />
      </svg>
    );
  }
  if (name === "issues") {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v5M12 16.5h.01" />
      </svg>
    );
  }
  if (name === "vas") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M4 7h16v12H4zM8 7V5h8v2" />
      </svg>
    );
  }
  if (name === "cm") {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="9" cy="8" r="3" />
        <circle cx="16" cy="9" r="2.4" />
        <path d="M4 19c1-3 3.2-4.5 5-4.5S13 16 14 19M14 19c.6-2 2-3.2 3.5-3.2S21 17.4 21.5 19" />
      </svg>
    );
  }
  if (name === "alerts") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M6 17h12l-1.2-2.2a6.5 6.5 0 0 1-.8-3.1V10a5 5 0 0 0-10 0v1.7c0 1.1-.3 2.2-.8 3.1z" />
        <path d="M10 17a2 2 0 0 0 4 0" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M6 19c1.2-3.2 3.4-4.8 6-4.8s4.8 1.6 6 4.8" />
    </svg>
  );
}

export default function BottomNav() {
  const { user, view, setView, alerts } = useApp();
  const unread = (alerts || []).some((a) => !a.read);

  const items =
    user.role === "manager"
      ? [
          { id: "dashboard", label: "Home", icon: "home" },
          { id: "issues", label: "Issues", icon: "issues" },
          { id: "visitors", label: "VAS", icon: "vas" },
          { id: "cm", label: "CM", icon: "cm" },
          { id: "alerts", label: "Alerts", icon: "alerts" },
          { id: "profile", label: "Profile", icon: "profile" },
        ]
      : [
          { id: "tasks", label: "Tasks", icon: "tasks" },
          { id: "issues", label: "Issues", icon: "issues" },
          { id: "visitors", label: "VAS", icon: "vas" },
          { id: "alerts", label: "Alerts", icon: "alerts" },
          { id: "profile", label: "Profile", icon: "profile" },
        ];

  return (
    <nav className={styles.bar} aria-label="Main">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`${styles.item} ${view === item.id ? styles.active : ""}`}
          aria-current={view === item.id ? "page" : undefined}
          onClick={() => setView(item.id)}
        >
          <span className={styles.iconWrap}>
            <Icon name={item.icon} />
            {item.id === "alerts" && unread && <span className={styles.dot} />}
          </span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
