"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { EMPLOYEES, LOCATIONS, taskById } from "@/lib/seed";

export default function ManagerView() {
  const { completions, issues } = useApp();
  const [unit, setUnit] = useState("all");
  const [openId, setOpenId] = useState(null);

  const rows = useMemo(() => {
    return EMPLOYEES.map((e) => {
      const done = completions[e.id] || {};
      const total = e.taskIds.length;
      const completed = e.taskIds.filter((id) => done[id]).length;
      const pct = total ? Math.round((completed / total) * 100) : 0;
      return { ...e, total, completed, pct, done };
    });
  }, [completions]);

  const totals = useMemo(() => {
    const total = rows.reduce((a, r) => a + r.total, 0);
    const completed = rows.reduce((a, r) => a + r.completed, 0);
    const pct = total ? Math.round((completed / total) * 100) : 0;
    const fullyDone = rows.filter((r) => r.pct === 100).length;
    return { total, completed, pct, fullyDone };
  }, [rows]);

  const locations = new Set(EMPLOYEES.map((e) => e.location)).size;

  // The task-detail table can be narrowed to a single unit.
  const detailRows = useMemo(
    () => (unit === "all" ? rows : rows.filter((r) => r.location === unit)),
    [rows, unit]
  );

  const openRow = rows.find((r) => r.id === openId) || null;

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Manager Dashboard</h1>
          <p className="muted">Live view across all {locations} units</p>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="stat-grid">
        <StatTile label="Overall completion" value={`${totals.pct}%`} accent />
        <StatTile
          label="Tasks done"
          value={`${totals.completed}/${totals.total}`}
        />
        <StatTile
          label="Employees on track"
          value={`${totals.fullyDone}/${rows.length}`}
        />
        <StatTile
          label="Tasks pending"
          value={totals.total - totals.completed}
          warn={totals.total - totals.completed > 0}
        />
      </div>

      {/* Issues panel — inline in the dashboard, not a separate tab */}
      <div className="card issues-card">
        <div className="card-title">
          Reported issues today
          <span className="pill">{issues.length}</span>
        </div>
        {issues.length === 0 ? (
          <p className="muted empty">No issues reported yet.</p>
        ) : (
          <ul className="issue-list">
            {issues.map((i) => (
              <li key={i.id} className="issue-item">
                <div className="issue-top">
                  <span className={`tag tag-${slug(i.category)}`}>
                    {i.category}
                  </span>
                  <span className="muted small">{i.location}</span>
                  <span className="muted small right">
                    {new Date(i.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="issue-desc">{i.description}</p>
                {i.photo && (
                  <img className="issue-photo" src={i.photo} alt="attachment" />
                )}
                <span className="muted small">reported by {i.employeeName}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* All-employee task detail */}
      <div className="card">
        <div className="card-title">
          All employees — task detail
          <label className="unit-filter">
            <span className="muted small">Unit</span>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="all">All units</option>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
        {/* Name + unit only; green once every task is ticked. Tap for detail. */}
        <div className="people-grid">
          {detailRows.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`person-card ${r.pct === 100 ? "complete" : ""}`}
              onClick={() => setOpenId(r.id)}
            >
              <span className="person-name">{r.name}</span>
              <span className="person-unit">{r.location}</span>
            </button>
          ))}
        </div>
      </div>

      {openRow && (
        <PersonModal row={openRow} onClose={() => setOpenId(null)} />
      )}
    </section>
  );
}

function PersonModal({ row, onClose }) {
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

  const doneTasks = row.taskIds.filter((id) => row.done[id]);
  const pendingTasks = row.taskIds.filter((id) => !row.done[id]);

  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-label={`${row.name} task detail`}>
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="modal">
        <div className="modal-head">
          <div>
            <strong className="modal-title">{row.name}</strong>
            <span className="muted small">{row.location}</span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-row">
            <span className="drawer-label">Progress</span>
            <span className={`chip ${row.pct === 100 ? "chip-ok" : ""}`}>
              {row.completed}/{row.total} · {row.pct}%
            </span>
          </div>

          <div className="modal-section">
            <span className="drawer-label">Done</span>
            {doneTasks.length === 0 ? (
              <p className="muted empty">Nothing ticked off yet.</p>
            ) : (
              <div className="mini-list">
                {doneTasks.map((id) => (
                  <span key={id} className="mini done-mini">
                    {taskById(id).name}
                    <em className="done-time">{timeOf(row.done[id])}</em>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="modal-section">
            <span className="drawer-label">Pending</span>
            {pendingTasks.length === 0 ? (
              <p className="muted empty">All tasks complete.</p>
            ) : (
              <div className="mini-list">
                {pendingTasks.map((id) => (
                  <span key={id} className="mini pending-mini">
                    {taskById(id).name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, accent, warn }) {
  return (
    <div className={`stat-tile ${accent ? "accent" : ""} ${warn ? "warn" : ""}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

// completions[employeeId][taskId] holds the ISO time the box was ticked.
function timeOf(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function slug(s) {
  return s.toLowerCase().replace(/\s+/g, "-");
}
