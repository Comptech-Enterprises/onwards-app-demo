"use client";

import { useApp } from "@/lib/store";
import styles from "./ProfileView.module.css";

export default function ProfileView() {
  const { user, logout } = useApp();
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const roleLabel = user.role === "manager" ? "Manager" : user.location;

  return (
    <section>
      <div className="page-head page-head-stack">
        <div>
          <h1>Profile</h1>
          <p className="muted">Account and sign-out</p>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.avatar}>{initials}</div>
        <h2 className={styles.name}>{user.name}</h2>
        <p className={`muted ${styles.meta}`}>{roleLabel}</p>
        <p className={`muted ${styles.meta}`}>@{user.username}</p>
        {user.employeeCode && (
          <p className={`muted ${styles.meta}`}>{user.employeeCode}</p>
        )}
        <button type="button" className="btn-primary" style={{ marginTop: 12 }} onClick={logout}>
          Log out
        </button>
      </div>
    </section>
  );
}
