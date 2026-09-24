"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { LOCATIONS } from "@/lib/seed";
import styles from "./CmView.module.css";

function firstName(name) {
  return name.trim().split(/\s+/)[0] || "";
}
function defaultUsername(name) {
  return firstName(name).toLowerCase();
}
function defaultPassword(name) {
  const first = firstName(name);
  if (!first) return "";
  return first[0].toUpperCase() + first.slice(1).toLowerCase() + "@123";
}
function initials(name) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : (parts[0]?.[0] || "?").toUpperCase();
}

export default function CmView() {
  const { user, users, addUser, deleteUser } = useApp();
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState("");
  const [search, setSearch] = useState("");
  const [locFilter, setLocFilter] = useState("all");

  const staff = users.filter((u) => u.role === "employee");

  const filtered = useMemo(() => {
    let list = staff;
    if (locFilter !== "all") list = list.filter((u) => u.location === locFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          (u.username || "").toLowerCase().includes(q) ||
          (u.employeeCode || "").toLowerCase().includes(q) ||
          (u.location || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [staff, locFilter, search]);

  function onAdded() {
    setOpen(false);
    setFlash("Employee added.");
    setTimeout(() => setFlash(""), 3000);
  }

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.heading}>Centre Management</h1>
        <button type="button" className="btn-primary btn-compact" onClick={() => setOpen(true)}>
          + Add
        </button>
      </div>

      {flash && <p className="flash">{flash}</p>}

      <label className="search-bar">
        <span aria-hidden="true">⌕</span>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee…" />
      </label>

      <div className={styles.chipScroll}>
        <button
          type="button"
          className={`${styles.locChip} ${locFilter === "all" ? styles.chipActive : ""}`}
          onClick={() => setLocFilter("all")}
        >All</button>
        {LOCATIONS.map((l) => (
          <button
            key={l}
            type="button"
            className={`${styles.locChip} ${locFilter === l ? styles.chipActive : ""}`}
            onClick={() => setLocFilter(l)}
          >{l}</button>
        ))}
      </div>

      <p className="muted small" style={{ marginBottom: 12 }}>
        {filtered.length} employee{filtered.length !== 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <p className="muted empty">No employees match filters.</p>
      ) : (
        <div className="stack">
          {filtered.map((u) => {
            const isSelf = u.id === user.id;
            return (
              <div key={u.id} className={styles.empRow}>
                <div className={styles.avatar}>{initials(u.name)}</div>
                <div className={styles.empBody}>
                  <div className={styles.empTop}>
                    <span className={styles.empName}>{u.name}</span>
                    {u.employeeCode && <span className={`tag tag-common-areas`}>{u.employeeCode}</span>}
                  </div>
                  <span className="muted small">@{u.username} · {u.location}</span>
                </div>
                <button
                  type="button"
                  className="btn-delete"
                  disabled={isSelf}
                  style={{ flexShrink: 0 }}
                  onClick={() => {
                    if (!window.confirm(`Delete ${u.name}?`)) return;
                    const result = deleteUser(u.id);
                    if (!result.ok) window.alert(result.error);
                  }}
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <AddEmployeeModal
          addUser={addUser}
          onClose={() => setOpen(false)}
          onAdded={onAdded}
        />
      )}
    </>
  );
}

function AddEmployeeModal({ addUser, onClose, onAdded }) {
  const [name, setName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function onName(value) {
    setName(value);
    setUsername(defaultUsername(value));
    setPassword(defaultPassword(value));
  }

  function submit(e) {
    e.preventDefault();
    setError("");
    const result = addUser({
      name,
      employeeCode,
      username: username || defaultUsername(name),
      password: password || defaultPassword(name),
      location,
    });
    if (!result.ok) { setError(result.error); return; }
    onAdded();
  }

  return (
    <div className="modal-wrap modal-wrap--form" role="dialog" aria-modal="true" aria-labelledby="add-emp-title">
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />
      <form className="modal" onSubmit={submit}>
        <div className="modal-head">
          <strong className="modal-title" id="add-emp-title">Add employee</strong>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="form-row">
          <label className="field">
            <span>Name</span>
            <input autoFocus value={name} onChange={(e) => onName(e.target.value)} placeholder="e.g. Riya Sharma" required />
          </label>
          <label className="field">
            <span>Employee code</span>
            <input autoCapitalize="characters" autoCorrect="off" value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} placeholder="e.g. OW-1042" required />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span>Centre</span>
            <select value={location} onChange={(e) => setLocation(e.target.value)}>
              {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Username</span>
            <input autoCapitalize="none" autoCorrect="off" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="riya" required />
          </label>
        </div>
        <label className="field">
          <span>Password</span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Riya@123" required />
        </label>
        {error && <div className="login-error">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Add employee</button>
        </div>
      </form>
    </div>
  );
}
