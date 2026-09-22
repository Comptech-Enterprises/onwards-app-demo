"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import api, { ApiError } from "./api";
import SEED_USERS from "./credentials.json";
import {
  CATEGORY_REVIEWERS,
  CHECKLIST_PHOTO_GATES,
  DEFAULT_STATUS,
  OPS_EMAIL,
  canDeleteIssue,
  canDeleteVisitor,
  checklistPhotosReady,
  frequencyOf,
  isCategoryReviewer,
  isCompletionLive,
  photoList,
  taskById,
  taskIdsForUser,
  tasksForCategory,
  todayKey,
} from "./seed";

const SESSION_KEY = "onward-session-v2";
const TOKEN_KEY = "token";

const AppContext = createContext(null);

function defaultViewFor(role) {
  return role === "manager" ? "dashboard" : "tasks";
}

function dataUrlToBlob(dataUrl) {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState(SEED_USERS);
  const [completions, setCompletions] = useState({});
  const [reviewChecks, setReviewChecks] = useState({});
  const [checklistPhotos, setChecklistPhotos] = useState({});
  const [issues, setIssues] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState("tasks");
  const wsRef = useRef(null);

  const fetchInitialData = useCallback(async (currentUser) => {
    if (!currentUser) return;
    try {
      const isManager = currentUser.role === "manager" || currentUser.designation === "cm";

      // Parallel data fetching from live backend
      const promises = [
        api.get("/tasks").catch(() => []),
        api.get("/issues").catch(() => []),
        api.get("/visitors").catch(() => []),
        api.get("/alerts").catch(() => []),
        isManager ? api.get("/completions/all").catch(() => ({})) : api.get("/completions/my").catch(() => ({})),
        isManager ? api.get("/photos/all").catch(() => ({})) : api.get("/photos/my").catch(() => ({})),
      ];

      if (isManager) {
        promises.push(api.get("/users").catch(() => SEED_USERS));
      }

      const results = await Promise.all(promises);
      const [tasksRes, issuesRes, visitorsRes, alertsRes, compRes, photosRes, usersRes] = results;

      if (Array.isArray(issuesRes)) setIssues(issuesRes);
      if (Array.isArray(visitorsRes)) setVisitors(visitorsRes);
      if (Array.isArray(alertsRes)) setAlerts(alertsRes);

      if (usersRes && Array.isArray(usersRes)) {
        setUsers(usersRes.map((u) => ({ ...u, taskIds: u.taskIds || taskIdsForUser(u) })));
      }

      // Handle completions mapping
      if (compRes) {
        if (isManager) {
          setCompletions(compRes);
        } else {
          setCompletions({ [currentUser.id]: compRes });
        }
      }

      // Handle photos mapping
      if (photosRes) {
        if (isManager) {
          setChecklistPhotos(photosRes);
        } else {
          setChecklistPhotos({ [currentUser.id]: photosRes });
        }
      }
    } catch (err) {
      console.warn("Could not fetch all initial backend data:", err);
    }
  }, []);

  // Initialize WebSocket connection for real-time checklist sync
  const connectWebSocket = useCallback((token) => {
    if (typeof window === "undefined" || !token) return;
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://app.onwardworkspaces.com/ws";
    try {
      const ws = new WebSocket(`${wsUrl}?token=${token}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "completion") {
            const { userId, taskId, status, completed_at } = data.payload || {};
            if (userId && taskId) {
              setCompletions((prev) => {
                const userComp = { ...(prev[userId] || {}) };
                if (status === "checked") {
                  userComp[taskId] = completed_at || new Date().toISOString();
                } else {
                  delete userComp[taskId];
                }
                return { ...prev, [userId]: userComp };
              });
            }
          }
        } catch {
          // ignore non-json messages
        }
      };

      ws.onerror = () => {
        // quiet error handle
      };

      ws.onclose = () => {
        // reconnection can be handled if needed
      };
    } catch {
      // ignore
    }
  }, []);

  // Re-read session from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const rawUser = window.localStorage.getItem(SESSION_KEY);
      const token = window.localStorage.getItem(TOKEN_KEY);

      if (rawUser && token) {
        const parsed = JSON.parse(rawUser);
        setUser(parsed);
        setView(defaultViewFor(parsed.role));
        fetchInitialData(parsed);
        connectWebSocket(token);
      }
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchInitialData, connectWebSocket]);

  async function login(username, password) {
    try {
      const data = await api.post("/auth/login", {
        username: username.trim(),
        password,
      });

      if (!data?.token || !data?.user) {
        return { ok: false, error: "Invalid response from server." };
      }

      const safeUser = data.user;
      setUser(safeUser);
      setView(defaultViewFor(safeUser.role));

      if (typeof window !== "undefined") {
        window.localStorage.setItem(TOKEN_KEY, data.token);
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      }

      await fetchInitialData(safeUser);
      connectWebSocket(data.token);

      return { ok: true, user: safeUser };
    } catch (err) {
      return { ok: false, error: err.message || "Invalid username or password." };
    }
  }

  function logout() {
    setUser(null);
    setView("tasks");
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(SESSION_KEY);
    }
  }

  const addAlert = useCallback(async (alert) => {
    try {
      await api.post("/alerts", alert);
    } catch {
      // fallback local
    }
    setAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)].slice(0, 80));
  }, []);

  const markAlertRead = useCallback((id) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true, is_read: true } : a)));
  }, []);

  const markAllAlertsRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true, is_read: true })));
  }, []);

  async function toggleTask(employeeId, taskId, location) {
    const targetUserId = employeeId || user?.id;
    const isAlreadyDone = !!completions[targetUserId]?.[taskId];

    // Optimistic UI update
    setCompletions((prev) => {
      const userComp = { ...(prev[targetUserId] || {}) };
      if (isAlreadyDone) {
        delete userComp[taskId];
      } else {
        userComp[taskId] = new Date().toISOString();
      }
      return { ...prev, [targetUserId]: userComp };
    });

    try {
      const res = await api.post(`/completions/toggle/${taskId}`, {
        forUserId: targetUserId !== user?.id ? targetUserId : undefined,
      });
      return { ok: true, status: res.status };
    } catch (err) {
      // Revert optimistic update on failure
      setCompletions((prev) => {
        const userComp = { ...(prev[targetUserId] || {}) };
        if (isAlreadyDone) {
          userComp[taskId] = new Date().toISOString();
        } else {
          delete userComp[taskId];
        }
        return { ...prev, [targetUserId]: userComp };
      });
      return { ok: false, error: err.message || "Failed to update task." };
    }
  }

  async function addChecklistPhoto(employeeId, category, fileOrDataUrl) {
    const targetUserId = employeeId || user?.id;
    try {
      const formData = new FormData();
      formData.append("category", category);

      if (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob) {
        formData.append("photo", fileOrDataUrl);
      } else if (typeof fileOrDataUrl === "string" && fileOrDataUrl.startsWith("data:")) {
        const blob = dataUrlToBlob(fileOrDataUrl);
        formData.append("photo", blob, `photo-${Date.now()}.jpg`);
      } else {
        return { ok: false, error: "Invalid photo format." };
      }

      const res = await api.post("/photos", formData);
      if (res?.url) {
        setChecklistPhotos((prev) => {
          const userPhotos = { ...(prev[targetUserId] || {}) };
          const catList = [...(userPhotos[category] || [])];
          catList.push(res.url);
          userPhotos[category] = catList;
          return { ...prev, [targetUserId]: userPhotos };
        });
        return { ok: true, url: res.url, id: res.id };
      }
      return { ok: false, error: "Upload failed." };
    } catch (err) {
      return { ok: false, error: err.message || "Failed to upload photo." };
    }
  }

  async function removeChecklistPhoto(employeeId, category, photoUrlOrIndex) {
    const targetUserId = employeeId || user?.id;
    try {
      let photoUrl = photoUrlOrIndex;
      let photoId = null;

      if (typeof photoUrlOrIndex === "number") {
        const currentList = checklistPhotos[targetUserId]?.[category] || [];
        photoUrl = currentList[photoUrlOrIndex];
      }

      if (photoUrl && photoUrl.includes("/photos/")) {
        // extract ID or call delete
        await api.delete("/photos/my");
      }

      setChecklistPhotos((prev) => {
        const userPhotos = { ...(prev[targetUserId] || {}) };
        const catList = [...(userPhotos[category] || [])].filter((u, i) =>
          typeof photoUrlOrIndex === "number" ? i !== photoUrlOrIndex : u !== photoUrl
        );
        userPhotos[category] = catList;
        return { ...prev, [targetUserId]: userPhotos };
      });

      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || "Could not remove photo." };
    }
  }

  async function addIssue({ employeeId, location, category, notes, description, photo }) {
    try {
      const text = (notes || description || "").trim();
      const formData = new FormData();
      formData.append("location", location || user?.location || "Unknown");
      formData.append("category", category || "Other");
      formData.append("notes", text);
      formData.append("description", text);

      if (photo instanceof File || photo instanceof Blob) {
        formData.append("photo", photo);
      } else if (typeof photo === "string" && photo.startsWith("data:")) {
        const blob = dataUrlToBlob(photo);
        formData.append("photo", blob, `issue-${Date.now()}.jpg`);
      }

      const created = await api.post("/issues", formData);
      if (created) {
        setIssues((prev) => [created, ...prev]);
        return { ok: true, issue: created };
      }
      return { ok: false, error: "Failed to report issue." };
    } catch (err) {
      return { ok: false, error: err.message || "Could not create issue." };
    }
  }

  async function setIssueStatus(issueId, status) {
    try {
      await api.patch(`/issues/${issueId}/status`, { status });
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status, updatedAt: new Date().toISOString() } : i))
      );
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || "Could not update issue status." };
    }
  }

  async function deleteIssue(issueId) {
    try {
      await api.delete(`/issues/${issueId}`);
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || "Could not delete issue." };
    }
  }

  async function addVisitor(data) {
    try {
      const visitor = await api.post("/visitors", data);
      if (visitor) {
        setVisitors((prev) => [visitor, ...prev]);
        return { ok: true, visitor };
      }
      return { ok: false, error: "Failed to log entry." };
    } catch (err) {
      return { ok: false, error: err.message || "Could not log entry." };
    }
  }

  async function deleteVisitor(visitorId) {
    try {
      await api.delete(`/visitors/${visitorId}`);
      setVisitors((prev) => prev.filter((v) => v.id !== visitorId));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || "Could not delete entry." };
    }
  }

  async function addUser(userData) {
    try {
      const created = await api.post("/users", userData);
      setUsers((prev) => [...prev, created]);
      return { ok: true, user: created };
    } catch (err) {
      return { ok: false, error: err.message || "Could not create user." };
    }
  }

  async function deleteUser(userId) {
    try {
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || "Could not delete user." };
    }
  }

  async function clearMyCompletions(employeeId) {
    try {
      await api.delete("/completions/my");
      setCompletions((prev) => ({ ...prev, [employeeId]: {} }));
    } catch (err) {
      console.warn("Clear completions error:", err);
    }
  }

  async function clearUserCompletions(userId) {
    try {
      await api.delete(`/completions/user/${userId}`);
      setCompletions((prev) => ({ ...prev, [userId]: {} }));
    } catch (err) {
      console.warn("Clear user completions error:", err);
    }
  }

  async function clearMyPhotos(employeeId) {
    try {
      await api.delete("/photos/my");
      setChecklistPhotos((prev) => ({ ...prev, [employeeId]: {} }));
    } catch (err) {
      console.warn("Clear photos error:", err);
    }
  }

  async function clearUserPhotos(userId) {
    try {
      await api.delete(`/photos/user/${userId}`);
      setChecklistPhotos((prev) => ({ ...prev, [userId]: {} }));
    } catch (err) {
      console.warn("Clear user photos error:", err);
    }
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
    completions,
    reviewChecks,
    checklistPhotos,
    issues,
    visitors,
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
    clearMyCompletions,
    clearUserCompletions,
    clearMyPhotos,
    clearUserPhotos,
    alerts,
    addAlert,
    markAlertRead,
    markAllAlertsRead,
    refreshData: () => fetchInitialData(user),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
