"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import SEED_USERS from "./credentials.json";
import {
  CATEGORY_REVIEWERS,
  CHECKLIST_PHOTO_GATES,
  DEFAULT_STATUS,
  OPS_EMAIL,
  canDeleteIssue,
  canDeleteVisitor,
  checklistPhotosReady,
  demoIssues,
  frequencyOf,
  isCategoryReviewer,
  isCompletionLive,
  photoList,
  pruneCompletions,
  pruneReviewChecks,
  taskById,
  taskIdsForUser,
  tasksForCategory,
  todayKey,
} from "./seed";

const STORAGE_KEY = "onward-task-state-v2";
const SESSION_KEY = "onward-session-v2";
const USERS_KEY = "onward-users-v1";
const ALERTS_KEY = "onward-alerts-v1";

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
    // checklistPhotos[employeeId][category] = data-URL list
    checklistPhotos: {},
    // reviewChecks[category][location][taskId] = ISO timestamp (Ravi / Infra & Safety)
    reviewChecks: {},
  };
}

function loadState() {
  const fresh = freshState();
  if (typeof window === "undefined") return fresh;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw);
    const completions = pruneCompletions(parsed.completions);
    const reviewChecks = pruneReviewChecks(parsed.reviewChecks);

    // New day: issues, visitors and photos reset. Weekly/monthly ticks stay.
    if (parsed.date !== todayKey()) {
      return {
        ...fresh,
        completions,
        reviewChecks,
      };
    }

    const merged = { ...fresh, ...parsed };
    merged.issues = (merged.issues || []).map((i) => ({
      status: DEFAULT_STATUS,
      ...i,
      notes: i.notes || i.description || "",
    }));
    merged.checklistPhotos = loadChecklistPhotos(parsed);
    merged.completions = completions;
    merged.reviewChecks = reviewChecks;
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
  return withCatalogueTasks(JSON.parse(JSON.stringify(SEED_USERS)));
}

function withCatalogueTasks(users) {
  return users.map((u) =>
    u.role === "employee" ? { ...u, taskIds: taskIdsForUser(u) } : u
  );
}

function emptyChecklistPhotos() {
  return { Pantry: [], Washroom: [], "Common Areas": [], "Soft Services": [] };
}

function loadChecklistPhotos(parsed) {
  const out = {};
  for (const [id, cats] of Object.entries(parsed.checklistPhotos || {})) {
    out[id] = {
      ...emptyChecklistPhotos(),
      Pantry: photoList(cats?.Pantry),
      Washroom: photoList(cats?.Washroom),
      "Common Areas": photoList(cats?.["Common Areas"]),
      "Soft Services": photoList(cats?.["Soft Services"]),
    };
  }
  for (const [id, rec] of Object.entries(parsed.pantryPhotos || {})) {
    if (!out[id]) out[id] = emptyChecklistPhotos();
    if (!out[id].Pantry.length) out[id].Pantry = photoList(rec);
  }
  return out;
}

function loadUsers() {
  if (typeof window === "undefined") return cloneSeedUsers();
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return cloneSeedUsers();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return cloneSeedUsers();
    return withCatalogueTasks(parsed);
  } catch {
    return cloneSeedUsers();
  }
}

function withoutPassword(record) {
  const { password: _pw, ...safe } = record;
  return safe;
}

function loadAlerts() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ALERTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function defaultViewFor(role) {
  return role === "manager" ? "dashboard" : "tasks";
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null); // signed-in user (no password)
  const [users, setUsers] = useState(cloneSeedUsers);
  const [state, setState] = useState(freshState);
  const [hydrated, setHydrated] = useState(false);
  // Which manager section is showing. Lives here so the header drawer can
  // switch it on mobile, where the tab row is hidden.
  const [view, setView] = useState("tasks");
  const [alerts, setAlerts] = useState([]);

  // Re-read from localStorage after mount to avoid SSR mismatch.
  useEffect(() => {
    const session = loadSession();
    setState(loadState());
    setUsers(loadUsers());
    setUser(session);
    setAlerts(loadAlerts());
    if (session) setView(defaultViewFor(session.role));
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

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  }, [alerts, hydrated]);

  function login(username, password) {
    const u = username.trim().toLowerCase();
    const found = users.find(
      (x) => x.username.toLowerCase() === u && x.password === password
    );
    if (!found) return false;
    const safe = withoutPassword(found);
    setUser(safe);
    setView(defaultViewFor(found.role));
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(safe));
    return true;
  }

  function logout() {
    setUser(null);
    setView("tasks");
    window.localStorage.removeItem(SESSION_KEY);
  }

  const addAlert = useCallback((alert) => {
    setAlerts((prev) => {
      if (prev.some((a) => a.id === alert.id)) return prev;
      return [alert, ...prev].slice(0, 80);
    });
  }, []);

  const markAlertRead = useCallback((id) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  }, []);

  const markAllAlertsRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  }, []);

  function toggleTask(employeeId, taskId, location) {
    let result = { ok: true };
    setState((prev) => {
      const task = taskById(taskId);
      const assignee = users.find((u) => u.id === employeeId);
      const owner = task?.category ? CATEGORY_REVIEWERS[task.category] : null;

      if (owner) {
        if (!isCategoryReviewer(assignee, task.category)) {
          result = {
            ok: false,
            error: `${task.category} is checked by ${owner.name}.`,
          };
          return prev;
        }
        const loc = location || (assignee?.location !== "All centres" ? assignee?.location : null);
        if (!loc) {
          result = { ok: false, error: "Pick a centre before ticking Infra & Safety." };
          return prev;
        }
        const byCat = { ...(prev.reviewChecks?.[task.category] || {}) };
        const byLoc = { ...(byCat[loc] || {}) };
        if (byLoc[taskId]) {
          result = { ok: false, error: "Ticked items cannot be unmarked." };
          return prev;
        }
        byLoc[taskId] = new Date().toISOString();
        byCat[loc] = byLoc;
        return {
          ...prev,
          reviewChecks: { ...(prev.reviewChecks || {}), [task.category]: byCat },
        };
      }

      const emp = { ...(prev.completions[employeeId] || {}) };
      if (emp[taskId]) {
        result = { ok: false, error: "Ticked items cannot be unmarked." };
        return prev;
      }
      const gate = CHECKLIST_PHOTO_GATES[task?.category];
      if (gate && !checklistPhotosReady(task.category, prev.checklistPhotos?.[employeeId]?.[task.category])) {
        result = {
          ok: false,
          error: `Upload the required ${gate.label} photo(s) before ticking this checklist.`,
        };
        return prev;
      }
      emp[taskId] = new Date().toISOString();
      return {
        ...prev,
        completions: { ...prev.completions, [employeeId]: emp },
      };
    });
    return result;
  }

  function addChecklistPhoto(employeeId, category, dataUrl) {
    let result = { ok: false, error: "Photo could not be saved." };
    const gate = CHECKLIST_PHOTO_GATES[category];
    if (!dataUrl || !gate) return result;
    setState((prev) => {
      const emp = {
        ...emptyChecklistPhotos(),
        ...(prev.checklistPhotos?.[employeeId] || {}),
      };
      const current = [...(emp[category] || [])];
      if (current.length >= gate.max) {
        result = { ok: false, error: `Up to ${gate.max} ${gate.label} photos.` };
        return prev;
      }
      current.push(dataUrl);
      emp[category] = current;
      result = { ok: true };
      return {
        ...prev,
        checklistPhotos: { ...prev.checklistPhotos, [employeeId]: emp },
      };
    });
    return result;
  }

  function categoryHasTicks(prev, employeeId, category) {
    const done = prev.completions?.[employeeId] || {};
    return tasksForCategory(category).some(
      (t) => frequencyOf(t) === "daily" && isCompletionLive(t, done[t.id])
    );
  }

  function removeChecklistPhoto(employeeId, category, index) {
    let result = { ok: true };
    setState((prev) => {
      if (categoryHasTicks(prev, employeeId, category)) {
        result = { ok: false, error: "Photos cannot be removed after a task is ticked." };
        return prev;
      }
      const emp = {
        ...emptyChecklistPhotos(),
        ...(prev.checklistPhotos?.[employeeId] || {}),
      };
      const current = [...(emp[category] || [])];
      if (index < 0 || index >= current.length) return prev;
      current.splice(index, 1);
      emp[category] = current;
      return {
        ...prev,
        checklistPhotos: { ...prev.checklistPhotos, [employeeId]: emp },
      };
    });
    return result;
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
      taskIds: taskIdsForUser({
        name: name.trim(),
        username: uname,
        role: "employee",
      }),
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

  function addIssue({ employeeId, location, category, notes, description, photo }) {
    const emp = users.find((e) => e.id === employeeId);
    const text = (notes || description || "").trim();
    const issue = {
      id: `i-${Date.now()}`,
      employeeId,
      employeeName: emp?.name || "Unknown",
      // Reporter picks the unit — an issue isn't always at their home site.
      location: location || emp?.location || "Unknown",
      category,
      notes: text,
      description: text,
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
    let result = { ok: false, error: "Issue not found." };
    setState((prev) => {
      const issue = (prev.issues || []).find((i) => i.id === issueId);
      if (!issue) return prev;
      if (!canDeleteIssue(issue)) {
        result = { ok: false, error: "Issues can only be deleted within 2 hours of reporting." };
        return prev;
      }
      result = { ok: true };
      return {
        ...prev,
        issues: prev.issues.filter((i) => i.id !== issueId),
      };
    });
    return result;
  }

  function deleteVisitor(visitorId) {
    let result = { ok: false, error: "Entry not found." };
    setState((prev) => {
      const visitor = (prev.visitors || []).find((v) => v.id === visitorId);
      if (!visitor) return prev;
      if (!canDeleteVisitor(visitor)) {
        result = { ok: false, error: "Entries can only be deleted within 3 hours of logging." };
        return prev;
      }
      result = { ok: true };
      return {
        ...prev,
        visitors: prev.visitors.filter((v) => v.id !== visitorId),
      };
    });
    return result;
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
    reviewChecks: state.reviewChecks || {},
    checklistPhotos: state.checklistPhotos || {},
    issues: state.issues,
    visitors: state.visitors,
    toggleTask,
    addChecklistPhoto,
    removeChecklistPhoto,
    addIssue,
    setIssueStatus,
    deleteIssue,
    addVisitor,
    deleteVisitor,
    addUser,
    deleteUser,
    alerts,
    addAlert,
    markAlertRead,
    markAllAlertsRead,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
