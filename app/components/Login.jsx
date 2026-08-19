"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import Logo from "./Logo";
import styles from "./Login.module.css";

export default function Login() {
  const { login } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (!login(username, password)) {
      setError("Invalid username or password.");
    }
  }

  return (
    <div className={`login-screen ${styles.screen}`}>
      <form className={styles.card} onSubmit={submit}>
        <div className={styles.brand}>
          <Logo className={styles.logo} />
          <span className="muted small">Daily Task Management</span>
        </div>

        <h1 className={styles.title}>Sign in</h1>
        <p className={`muted ${styles.sub}`}>Use your assigned credentials.</p>

        <label className="field">
          <span>Username</span>
          <input
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            placeholder="e.g. amit"
          />
        </label>

        <label className="field">
          <span>Password</span>
          <div className={styles.pwWrap}>
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="••••••••"
            />
            <button
              type="button"
              className={styles.pwToggle}
              onClick={() => setShow((s) => !s)}
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="btn-primary">
          Sign in
        </button>
      </form>
    </div>
  );
}
