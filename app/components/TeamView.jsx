"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { getCentreTeam, computeCentreScore } from "@/lib/seed";
import styles from "./TeamView.module.css";

function initials(name) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : (parts[0]?.[0] || "?").toUpperCase();
}

export default function TeamView() {
  const { user, employees, completions } = useApp();
  const isCM = user.designation === "cm";

  const team = useMemo(
    () => getCentreTeam(user, employees).filter((e) => e.id !== user.id),
    [user, employees]
  );

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
            <div key={r.id} className={styles.card}>
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
    </>
  );
}
