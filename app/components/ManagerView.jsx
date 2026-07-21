"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { EMPLOYEES, taskById } from "@/lib/seed";

export default function ManagerView() {
  const { completions, issues } = useApp();

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

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Manager Dashboard</h1>
          <p className="muted">Live view across all {locations} locations</p>
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
        <StatTile label="Open issues today" value={issues.length} warn={issues.length > 0} />
      </div>

      <div className="dash-grid">
        {/* Per-employee completion */}
        <div className="card">
          <div className="card-title">Completion by employee</div>
          <div className="emp-rows">
            {rows.map((r) => (
              <div key={r.id} className="emp-row">
                <div className="emp-meta">
                  <span className="emp-name">{r.name}</span>
                  <span className="muted small">{r.location}</span>
                </div>
                <div className="bar-wrap">
                  <div className="bar">
                    <div
                      className={`bar-fill ${r.pct === 100 ? "full" : ""}`}
                      style={{ width: `${r.pct}%` }}
                    />
                  </div>
                  <span className="bar-label">
                    {r.completed}/{r.total} · {r.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Issues panel — inline in the dashboard, not a separate tab */}
        <div className="card">
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
      </div>

      {/* All-employee task detail */}
      <div className="card">
        <div className="card-title">All employees — task detail</div>
        <div className="table-scroll">
          <table className="detail-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Location</th>
                <th>Progress</th>
                <th>Done</th>
                <th>Pending</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const doneTasks = r.taskIds.filter((id) => r.done[id]);
                const pendingTasks = r.taskIds.filter((id) => !r.done[id]);
                return (
                  <tr key={r.id}>
                    <td data-label="Employee">{r.name}</td>
                    <td data-label="Location">{r.location}</td>
                    <td data-label="Progress">
                      <span className={`chip ${r.pct === 100 ? "chip-ok" : ""}`}>
                        {r.pct}%
                      </span>
                    </td>
                    <td data-label="Done">
                      {doneTasks.length === 0 ? (
                        <span className="muted">—</span>
                      ) : (
                        doneTasks.map((id) => (
                          <span key={id} className="mini done-mini">
                            {taskById(id).name}
                          </span>
                        ))
                      )}
                    </td>
                    <td data-label="Pending">
                      {pendingTasks.length === 0 ? (
                        <span className="muted">—</span>
                      ) : (
                        pendingTasks.map((id) => (
                          <span key={id} className="mini pending-mini">
                            {taskById(id).name}
                          </span>
                        ))
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
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

function slug(s) {
  return s.toLowerCase().replace(/\s+/g, "-");
}
