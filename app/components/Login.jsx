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
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await login(username, password);
      if (!res.ok) {
        setError(res.error || "Invalid username or password.");
      }
    } catch {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
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
            disabled={loading}
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
              disabled={loading}
            />
            <button
              type="button"
              className={styles.pwToggle}
              onClick={() => setShow((s) => !s)}
              disabled={loading}
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
