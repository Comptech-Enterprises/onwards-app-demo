"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { LOCATIONS } from "@/lib/seed";

function firstName(name) {
  return (name.trim().split(/\s+/)[0] || "");
}

function defaultUsername(name) {
  return firstName(name).toLowerCase();
}

function defaultPassword(name) {
  const first = firstName(name);
  if (!first) return "";
  return first[0].toUpperCase() + first.slice(1).toLowerCase() + "@123";
}

const emptyForm = {
  name: "",
  employeeCode: "",
  username: "",
  password: "",
  location: LOCATIONS[0],
};

export default function CmView() {
  const { user, users, addUser, deleteUser } = useApp();
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState("");

  const staff = users.filter((u) => u.role === "employee");

  function onAdded() {
    setOpen(false);
    setFlash("User added.");
    setTimeout(() => setFlash(""), 3000);
  }

  return (
    <div className="stack">
      <UserGroup
        title="Employees"
        rows={staff}
        currentId={user.id}
        deleteUser={deleteUser}
        flash={flash}
        onAdd={() => setOpen(true)}
      />
      {open && (
        <AddEmployeeModal
          addUser={addUser}
          onClose={() => setOpen(false)}
          onAdded={onAdded}
        />
      )}
    </div>
  );
}

function AddEmployeeModal({ addUser, onClose, onAdded }) {
  const [name, setName] = useState(emptyForm.name);
  const [employeeCode, setEmployeeCode] = useState(emptyForm.employeeCode);
  const [username, setUsername] = useState(emptyForm.username);
  const [password, setPassword] = useState(emptyForm.password);
  const [location, setLocation] = useState(emptyForm.location);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
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
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onAdded();
  }

  return (
    <div className="modal-wrap modal-wrap--form" role="dialog" aria-modal="true" aria-labelledby="add-employee-title">
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />
      <form className="modal" onSubmit={submit}>
        <div className="modal-head">
          <strong className="modal-title" id="add-employee-title">
            Add employee
          </strong>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="form-row">
          <label className="field">
            <span>Name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => onName(e.target.value)}
              placeholder="e.g. Riya Sharma"
              required
            />
          </label>
          <label className="field">
            <span>Employee code</span>
            <input
              autoCapitalize="characters"
              autoCorrect="off"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              placeholder="e.g. OW-1042"
              required
            />
          </label>
        </div>

        <div className="form-row">
          <label className="field">
            <span>Centre</span>
            <select value={location} onChange={(e) => setLocation(e.target.value)}>
              {LOCATIONS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Username</span>
            <input
              autoCapitalize="none"
              autoCorrect="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="riya"
              required
            />
          </label>
        </div>

        <label className="field">
          <span>Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Riya@123"
            required
          />
        </label>

        {error && <div className="login-error">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Add employee
          </button>
        </div>
      </form>
    </div>
  );
}

function UserGroup({ title, rows, currentId, deleteUser, flash, onAdd }) {
  return (
    <div className="card">
      <div className="card-title">
        {title}
        <span className="pill">{rows.length}</span>
        <button type="button" className="btn-primary btn-compact" onClick={onAdd}>
          Add employee
        </button>
      </div>
      {flash && <p className="flash">{flash}</p>}
      {rows.length === 0 ? (
        <p className="muted empty">None yet.</p>
      ) : (
        <ul className="issue-list">
          {rows.map((u) => {
            const isSelf = u.id === currentId;
            return (
              <li key={u.id} className="issue-item">
                <div className="issue-top">
                  <strong>{u.name}</strong>
                  {u.employeeCode && (
                    <span className="tag tag-common-areas">{u.employeeCode}</span>
                  )}
                  <span className="muted small right">{u.location}</span>
                </div>
                <p className="issue-desc">
                  @{u.username} · {u.password}
                </p>
                <div className="issue-foot">
                  <span className="muted small">
                    {isSelf ? "Signed in" : `${u.taskIds?.length || 0} tasks`}
                  </span>
                  <button
                    type="button"
                    className="btn-delete"
                    disabled={isSelf}
                    onClick={() => {
                      if (!window.confirm(`Delete ${u.name}?`)) return;
                      const result = deleteUser(u.id);
                      if (!result.ok) window.alert(result.error);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
