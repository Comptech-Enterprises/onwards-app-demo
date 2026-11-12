"use client";

import { useMemo, useState, useCallback } from "react";
import { useApp } from "@/lib/store";
import {
  getCentreTeam,
  computeCentreScore,
  taskIdsForUser,
  tasksForCategory,
  liveDoneMap,
  CATEGORIES,
  CHECKLIST_PHOTO_GATES,
  checklistPhotosReady,
} from "@/lib/seed";
import styles from "./TeamView.module.css";

function initials(name) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : (parts[0]?.[0] || "?").toUpperCase();
}

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function EmployeeDetailModal({ emp, onClose, isCM, employees, completions, checklistPhotos, toggleTask }) {
  const centreTeam = useMemo(
    () => getCentreTeam(emp, employees, emp.location),
    [emp, employees]
  );

  const siteDone = useMemo(() => {
    const merged = {};
    centreTeam.forEach((e) => {
      Object.assign(merged, liveDoneMap(completions[e.id] || {}));
    });
    return merged;
  }, [centreTeam, completions]);

  const allIds = useMemo(() => {
    const ids = new Set();
    centreTeam.forEach((e) => taskIdsForUser(e).forEach((id) => ids.add(id)));
    if (ids.size === 0) (emp.taskIds || []).forEach((id) => ids.add(id));
    return ids;
  }, [centreTeam, emp]);

  const teamPhotoReady = useCallback(
    (category) => {
      const gate = CHECKLIST_PHOTO_GATES[category];
      if (!gate) return true;
      for (const e of centreTeam) {
        const locKey = emp.location ? `${e.id}@${emp.location}` : null;
        const locPhotos = locKey ? checklistPhotos[locKey]?.[category] : null;
        const plainPhotos = checklistPhotos[e.id]?.[category];
        if (checklistPhotosReady(category, locPhotos || plainPhotos)) return true;
      }
      return false;
    },
    [centreTeam, checklistPhotos, emp.location]
  );

  const categoryData = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const catTasks = tasksForCategory(cat).filter((t) => allIds.has(t.id));
      if (catTasks.length === 0) return null;
      const done = catTasks.filter((t) => siteDone[t.id]);
      const photoOk = teamPhotoReady(cat);
      return { category: cat, tasks: catTasks, doneCount: done.length, total: catTasks.length, photoOk };
    }).filter(Boolean);
  }, [allIds, siteDone, teamPhotoReady]);

  const handleTick = async (taskId) => {
    if (!isCM) return;
    await toggleTask(emp.id, taskId, emp.location);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalAvatar}>{initials(emp.name)}</div>
          <div className={styles.modalInfo}>
            <span className={styles.modalName}>{emp.name}</span>
            <span className="muted small">{emp.location}</span>
          </div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          {categoryData.map(({ category, tasks, doneCount, total, photoOk }) => {
            const pct = total ? Math.round((doneCount / total) * 100) : 0;
            const gate = CHECKLIST_PHOTO_GATES[category];
            return (
              <div key={category} className={styles.catSection}>
                <div className={styles.catHeader}>
                  <span className={styles.catName}>{category}</span>
                  <span className={styles.catScore}>{doneCount}/{total}</span>
                </div>
                <div className="progress-track" style={{ marginBottom: 8 }}>
                  <span className="progress-fill" style={{ width: `${pct}%` }} />
                </div>

                {gate && !photoOk && (
                  <div className={styles.photoLock}>Photos required to unlock tasks</div>
                )}

                <ul className={styles.taskList}>
                  {tasks.map((t) => {
                    const isDone = !!siteDone[t.id];
                    const locked = gate && !photoOk && !isDone;
                    return (
                      <li
                        key={t.id}
                        className={`${styles.taskRow} ${isDone ? styles.taskDone : ""} ${locked ? styles.taskLocked : ""}`}
                      >
                        <button
                          className={styles.tickBtn}
                          disabled={!isCM || locked}
                          onClick={() => handleTick(t.id)}
                        >
                          {isDone ? "✓" : locked ? "🔒" : ""}
                        </button>
                        <div className={styles.taskInfo}>
                          <span className={styles.taskName}>{t.name}</span>
                          {isDone && siteDone[t.id] && (
                            <span className={styles.taskTime}>{fmtTime(siteDone[t.id])}</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function TeamView() {
  const { user, employees, completions, checklistPhotos, toggleTask } = useApp();
  const isCM = user.designation === "cm";
  const [selectedEmp, setSelectedEmp] = useState(null);

  const isSupervisor = user.designation === "supervisor";

  const team = useMemo(() => {
    if (isCM) {
      return employees.filter(
        (e) =>
          e.supervisorId === user.id ||
          (user.location &&
            user.location !== "All centres" &&
            e.location === user.location &&
            e.id !== user.id)
      );
    }
    if (isSupervisor) {
      return employees.filter(
        (e) =>
          e.id !== user.id &&
          ((user.location &&
            user.location !== "All centres" &&
            e.location === user.location) ||
            (user.supervisorId && e.supervisorId === user.supervisorId) ||
            e.id === user.supervisorId)
      );
    }
    return [];
  }, [user, employees, isCM, isSupervisor]);

  const teamRows = useMemo(() => {
    return team.map((e) => {
      const memberTeam = getCentreTeam(e, employees);
      const score = computeCentreScore(memberTeam, completions);
      return {
        ...e,
        total: score.totalTasks,
        completed: score.uniqueDoneCount,
        pct: score.scorePct,
      };
    });
  }, [team, employees, completions]);

  const avgPct = teamRows.length
    ? Math.round(teamRows.reduce((a, r) => a + r.pct, 0) / teamRows.length)
    : 0;
  const totalDone = teamRows.reduce((a, r) => a + r.completed, 0);
  const totalTasks = teamRows.reduce((a, r) => a + r.total, 0);

  return (
    <>
      <div className={styles.statRow}>
        <div className={styles.tile}>
          <span className={styles.tileLabel}>COMPLETION</span>
          <span className={styles.tileValue}>{avgPct}%</span>
        </div>
        <div className={styles.tile}>
          <span className={styles.tileLabel}>DONE</span>
          <span className={styles.tileValue}>{totalDone}/{totalTasks}</span>
        </div>
        {isCM && (
          <div className={styles.tile}>
            <span className={styles.tileLabel}>TEAM SIZE</span>
            <span className={styles.tileValue}>{teamRows.length}</span>
          </div>
        )}
      </div>

      {teamRows.length === 0 ? (
        <p className="muted empty">No team members found.</p>
      ) : (
        <div className="stack">
          {teamRows.map((r) => (
            <div
              key={r.id}
              className={styles.card}
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedEmp(r)}
            >
              <div className={styles.cardTop}>
                <div className={styles.avatar}>{initials(r.name)}</div>
                <div className={styles.info}>
                  <span className={styles.name}>{r.name}</span>
                  <span className="muted small">
                    {r.designation === "cm" ? "CM" : r.location}
                  </span>
                </div>
                <div className={styles.ring} style={{ "--pct": r.pct }}>
                  <span style={{ color: r.pct === 100 ? "var(--ok)" : "var(--text)" }}>{r.pct}%</span>
                </div>
              </div>
              <div className="progress-track" style={{ marginTop: 10 }}>
                <span className="progress-fill" style={{ width: `${r.pct}%` }} />
              </div>
              <span className="muted small" style={{ marginTop: 4, display: "block" }}>{r.completed}/{r.total} tasks</span>
            </div>
          ))}
        </div>
      )}

      {selectedEmp && (
        <EmployeeDetailModal
          emp={selectedEmp}
          onClose={() => setSelectedEmp(null)}
          isCM={isCM}
          employees={employees}
          completions={completions}
          checklistPhotos={checklistPhotos}
          toggleTask={toggleTask}
        />
      )}
    </>
  );
}
