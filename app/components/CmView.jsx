"use client";

import { useState } from "react";
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

export default function CmView() {
  const { user, users, addUser, deleteUser } = useApp();
  const [name, setName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

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
    setName("");
    setEmployeeCode("");
    setUsername("");
    setPassword("");
    setLocation(LOCATIONS[0]);
    setFlash("User added.");
    setTimeout(() => setFlash(""), 3000);
  }

  const staff = users.filter((u) => u.role === "employee");

  return (
    <div className="stack">
      <form className="card issue-form" onSubmit={submit}>
        <div className="card-title">Add employee</div>

        <div className="form-row">
          <label className="field">
            <span>Name</span>
            <input
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
        {flash && <p className="muted">{flash}</p>}

        <button type="submit" className="btn-primary">
          Add employee
        </button>
      </form>

      <UserGroup
        title="Employees"
        rows={staff}
        currentId={user.id}
        deleteUser={deleteUser}
      />
    </div>
  );
}

function UserGroup({ title, rows, currentId, deleteUser }) {
  return (
    <div className="card">
      <div className="card-title">
        {title}
        <span className="pill">{rows.length}</span>
      </div>
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
