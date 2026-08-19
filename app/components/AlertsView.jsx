"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import styles from "./AlertsView.module.css";

function timeAgo(iso) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.max(0, Math.round(ms / 60000));
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}

export default function AlertsView() {
  const { alerts, markAlertRead, markAllAlertsRead } = useApp();
  const [filter, setFilter] = useState("all");
  const unread = (alerts || []).filter((a) => !a.read).length;
  const visible = (alerts || []).filter((a) => (filter === "unread" ? !a.read : true));

  return (
    <section>
      <div className="page-head page-head-stack">
        <div className={styles.toolbar}>
          <div>
            <h1>Alerts</h1>
            <p className="muted">Stay updated with your work.</p>
          </div>
          {unread > 0 && (
            <button type="button" className={styles.mark} onClick={markAllAlertsRead}>
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="chip-row" role="tablist" aria-label="Filter alerts">
        <button
          type="button"
          className={`chip-filter ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          type="button"
          className={`chip-filter ${filter === "unread" ? "active" : ""}`}
          onClick={() => setFilter("unread")}
        >
          Unread
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="muted empty">No alerts yet.</p>
      ) : (
        <div className={styles.list}>
          {visible.map((a) => (
            <button
              key={a.id}
              type="button"
              className={styles.card}
              onClick={() => markAlertRead(a.id)}
            >
              <span className={`${styles.icon} ${a.kind === "deadline" ? styles.warn : ""}`}>
                {a.kind === "deadline" ? "!" : "⏱"}
              </span>
              <div className={styles.body}>
                <p className={styles.title}>{a.title}</p>
                <p className={`muted ${styles.detail}`}>{a.body}</p>
                <p className={`muted ${styles.time}`}>{timeAgo(a.createdAt)}</p>
              </div>
              {!a.read && <span className={styles.unread} />}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
