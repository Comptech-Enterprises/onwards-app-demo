"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  EMPLOYEES,
  OPS_EMAIL,
  authenticate,
  demoIssues,
  todayKey,
} from "./seed";

const STORAGE_KEY = "onward-task-state-v1";
const SESSION_KEY = "onward-session-v1";

const AppContext = createContext(null);

function freshState() {
  return {
    date: todayKey(),
    // completions[employeeId][taskId] = ISO timestamp
    completions: {},
    // issues: newest first — pre-seeded with demo reports across the units
    issues: demoIssues(),
  };
}

function loadState() {
  const fresh = freshState();
  if (typeof window === "undefined") return fresh;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw);

    // Daily auto-reset: BOTH task completions and issues clear each morning.
    if (parsed.date !== todayKey()) return fresh;

    return { ...fresh, ...parsed };
  } catch {
    return fresh;
  }
}

function loadSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null); // signed-in user (no password)
  const [state, setState] = useState(freshState);
  const [hydrated, setHydrated] = useState(false);
  // Which manager section is showing. Lives here so the header drawer can
  // switch it on mobile, where the tab row is hidden.
  const [view, setView] = useState("dashboard");

  // Re-read from localStorage after mount to avoid SSR mismatch.
  useEffect(() => {
    setState(loadState());
    setUser(loadSession());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  function login(username, password) {
    const found = authenticate(username, password);
    if (!found) return false;
    setUser(found);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(found));
    return true;
  }

  function logout() {
    setUser(null);
    setView("dashboard");
    window.localStorage.removeItem(SESSION_KEY);
  }

  function toggleTask(employeeId, taskId) {
    setState((prev) => {
      const emp = { ...(prev.completions[employeeId] || {}) };
      if (emp[taskId]) {
        delete emp[taskId];
      } else {
        emp[taskId] = new Date().toISOString();
      }
      return {
        ...prev,
        completions: { ...prev.completions, [employeeId]: emp },
      };
    });
  }

  function addIssue({ employeeId, location, category, description, photo }) {
    const emp = EMPLOYEES.find((e) => e.id === employeeId);
    const issue = {
      id: `i-${Date.now()}`,
      employeeId,
      employeeName: emp?.name || "Unknown",
      // Reporter picks the unit — an issue isn't always at their home site.
      location: location || emp?.location || "Unknown",
      category,
      description,
      photo: photo || null,
      createdAt: new Date().toISOString(),
      notifiedEmail: OPS_EMAIL,
    };
    setState((prev) => ({ ...prev, issues: [issue, ...prev.issues] }));
    return issue;
  }

  const value = {
    hydrated,
    user,
    login,
    logout,
    view,
    setView,
    completions: state.completions,
    issues: state.issues,
    toggleTask,
    addIssue,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
