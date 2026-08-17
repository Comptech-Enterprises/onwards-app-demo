"use client";

import { createContext, useContext, useEffect, useState } from "react";
import SEED_USERS from "./credentials.json";
import {
  ALL_TASK_IDS,
  DEFAULT_STATUS,
  OPS_EMAIL,
  demoIssues,
  todayKey,
} from "./seed";

const STORAGE_KEY = "onward-task-state-v2";
const SESSION_KEY = "onward-session-v2";
const USERS_KEY = "onward-users-v1";

const AppContext = createContext(null);

function freshState() {
  return {
    date: todayKey(),
    // completions[employeeId][taskId] = ISO timestamp
    completions: {},
    // issues: newest first — pre-seeded with demo reports across the units
    issues: demoIssues(),
    // visitors: walk-ins logged by employees, newest first
    visitors: [],
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

    const merged = { ...fresh, ...parsed };
    // Issues stored before statuses existed default to unattended.
    merged.issues = (merged.issues || []).map((i) => ({
      status: DEFAULT_STATUS,
      ...i,
    }));
    return merged;
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

function cloneSeedUsers() {
  return JSON.parse(JSON.stringify(SEED_USERS));
}

function loadUsers() {
  if (typeof window === "undefined") return cloneSeedUsers();
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return cloneSeedUsers();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return cloneSeedUsers();
    return parsed;
  } catch {
    return cloneSeedUsers();
  }
}

function withoutPassword(record) {
  const { password: _pw, ...safe } = record;
  return safe;
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null); // signed-in user (no password)
  const [users, setUsers] = useState(cloneSeedUsers);
  const [state, setState] = useState(freshState);
  const [hydrated, setHydrated] = useState(false);
  // Which manager section is showing. Lives here so the header drawer can
  // switch it on mobile, where the tab row is hidden.
  const [view, setView] = useState("dashboard");

  // Re-read from localStorage after mount to avoid SSR mismatch.
  useEffect(() => {
    setState(loadState());
    setUsers(loadUsers());
    setUser(loadSession());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users, hydrated]);

  function login(username, password) {
    const u = username.trim().toLowerCase();
    const found = users.find(
      (x) => x.username.toLowerCase() === u && x.password === password
    );
    if (!found) return false;
    const safe = withoutPassword(found);
    setUser(safe);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(safe));
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

  function addUser({ name, username, password, location, employeeCode }) {
    const uname = username.trim().toLowerCase();
    const code = (employeeCode || "").trim();
    if (!name.trim() || !uname || !password || !code) {
      return { ok: false, error: "Name, employee code, username and password are required." };
    }
    if (users.some((u) => u.username.toLowerCase() === uname)) {
      return { ok: false, error: "Username already exists." };
    }
    if (
      users.some(
        (u) => (u.employeeCode || "").trim().toLowerCase() === code.toLowerCase()
      )
    ) {
      return { ok: false, error: "Employee code already exists." };
    }
    const record = {
      id: `e-${Date.now()}`,
      name: name.trim(),
      username: uname,
      password,
      role: "employee",
      location,
      employeeCode: code,
      taskIds: [...ALL_TASK_IDS],
    };
    setUsers((prev) => [...prev, record]);
    return { ok: true };
  }

  function deleteUser(userId) {
    if (user?.id === userId) {
      return { ok: false, error: "You cannot delete the signed-in account." };
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return { ok: false, error: "User not found." };
    const managerCount = users.filter((u) => u.role === "manager").length;
    if (target.role === "manager" && managerCount <= 1) {
      return { ok: false, error: "Keep at least one manager." };
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    return { ok: true };
  }

  function addVisitor({ employeeId, date, facilityType, aggregator, arrivalTime, punchOutTime, guestName, location, seats, payment }) {
    const emp = users.find((e) => e.id === employeeId);
    const visitor = {
      id: `v-${Date.now()}`,
      employeeId,
      employeeName: emp?.name || "Unknown",
      location: location || emp?.location || "Unknown",
      date,
      facilityType,
      aggregator,
      arrivalTime,
      punchOutTime,
      guestName,
      seats,
      payment,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, visitors: [visitor, ...prev.visitors] }));
    return visitor;
  }

  function addIssue({ employeeId, location, category, description, photo }) {
    const emp = users.find((e) => e.id === employeeId);
    const issue = {
      id: `i-${Date.now()}`,
      employeeId,
      employeeName: emp?.name || "Unknown",
      // Reporter picks the unit — an issue isn't always at their home site.
      location: location || emp?.location || "Unknown",
      category,
      description,
      photo: photo || null,
      status: DEFAULT_STATUS,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      notifiedEmail: OPS_EMAIL,
    };
    setState((prev) => ({ ...prev, issues: [issue, ...prev.issues] }));
    return issue;
  }

  // Manager moves an issue along: Unattended → In progress → Resolved.
  function setIssueStatus(issueId, status) {
    setState((prev) => ({
      ...prev,
      issues: prev.issues.map((i) =>
        i.id === issueId
          ? { ...i, status, updatedAt: new Date().toISOString() }
          : i
      ),
    }));
  }

  function deleteIssue(issueId) {
    setState((prev) => ({
      ...prev,
      issues: prev.issues.filter((i) => i.id !== issueId),
    }));
  }

  function deleteVisitor(visitorId) {
    setState((prev) => ({
      ...prev,
      visitors: prev.visitors.filter((v) => v.id !== visitorId),
    }));
  }

  const value = {
    hydrated,
    user,
    login,
    logout,
    view,
    setView,
    users,
    employees: users.filter((u) => u.role === "employee"),
    completions: state.completions,
    issues: state.issues,
    visitors: state.visitors,
    toggleTask,
    addIssue,
    setIssueStatus,
    deleteIssue,
    addVisitor,
    deleteVisitor,
    addUser,
    deleteUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
