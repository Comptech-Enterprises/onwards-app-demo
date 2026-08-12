"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { EMPLOYEES, ISSUE_STATUSES, LOCATIONS, taskById } from "@/lib/seed";
import { IssuePhoto } from "./PhotoLightbox";
import StatusBadge from "./StatusBadge";

export default function ManagerView() {
  const { completions, issues, visitors, view: tab, setView: setTab } = useApp();
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

      {/* Hidden on mobile — the hamburger drawer carries the same nav there. */}
      <div className="tabs manager-tabs" role="tablist">
        <button
          role="tab"
          className={tab === "dashboard" ? "active" : ""}
          onClick={() => setTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          role="tab"
          className={tab === "issues" ? "active" : ""}
          onClick={() => setTab("issues")}
        >
          Issues
          <span className="pill">{issues.length}</span>
        </button>
        <button
          role="tab"
          className={tab === "visitors" ? "active" : ""}
          onClick={() => setTab("visitors")}
        >
          Value Added Services
          {visitors.length > 0 && <span className="pill">{visitors.length}</span>}
        </button>
      </div>

      {tab === "visitors" ? (
        <VisitorsTab visitors={visitors} />
      ) : tab === "issues" ? (
        <IssuesTab issues={issues} />
      ) : (
        <>
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

      {/* All-employee task detail */}
      <div className="card">
        <div className="card-title">
          All employees — task detail
          <label className="unit-filter">
            <span className="muted small">Location</span>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="all">All locations</option>
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
        </>
      )}

      {openRow && (
        <PersonModal row={openRow} onClose={() => setOpenId(null)} />
      )}
    </section>
  );
}

// Every issue across the units, filterable and grouped by location.
function IssuesTab({ issues: allIssues }) {
  const [unit, setUnit] = useState("all");
  const [status, setStatus] = useState("all");

  const counts = useMemo(() => {
    const c = {};
    ISSUE_STATUSES.forEach((s) => (c[s] = 0));
    allIssues.forEach((i) => (c[i.status] = (c[i.status] || 0) + 1));
    return c;
  }, [allIssues]);

  const issues = useMemo(
    () =>
      status === "all" ? allIssues : allIssues.filter((i) => i.status === status),
    [allIssues, status]
  );

  const units = useMemo(() => {
    const seen = new Set(issues.map((i) => i.location));
    // Keep the configured order, then anything unexpected that turns up.
    return [
      ...LOCATIONS.filter((l) => seen.has(l)),
      ...[...seen].filter((l) => !LOCATIONS.includes(l)),
    ];
  }, [issues]);

  const visible = useMemo(
    () => (unit === "all" ? units : units.filter((l) => l === unit)),
    [units, unit]
  );

  return (
    <div className="card">
      <div className="card-title">
        Reported issues today
        <span className="pill">{allIssues.length}</span>
        <label className="unit-filter">
          <span className="muted small">Location</span>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="all">All locations</option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Status filter — doubles as an at-a-glance count per status. */}
      <div className="status-filter" role="group" aria-label="Filter by status">
        <button
          className={`status-chip ${status === "all" ? "active" : ""}`}
          onClick={() => setStatus("all")}
        >
          All <span className="status-count">{allIssues.length}</span>
        </button>
        {ISSUE_STATUSES.map((s) => (
          <button
            key={s}
            className={`status-chip status-${slug(s)} ${
              status === s ? "active" : ""
            }`}
            onClick={() => setStatus(s)}
          >
            {s} <span className="status-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="muted empty">
          {allIssues.length === 0
            ? "No issues reported yet."
            : `No ${status === "all" ? "" : `${status.toLowerCase()} `}issues${
                unit === "all" ? "" : ` at ${unit}`
              }.`}
        </p>
      ) : (
        visible.map((loc) => {
          const forUnit = issues.filter((i) => i.location === loc);
          return (
            <div key={loc} className="issue-group">
              <div className="issue-group-head">
                <strong>{loc}</strong>
                <span className="muted small">
                  {forUnit.length} {forUnit.length === 1 ? "issue" : "issues"}
                </span>
              </div>
              <ul className="issue-list">
                {forUnit.map((i) => (
                  <IssueItem key={i.id} issue={i} />
                ))}
              </ul>
            </div>
          );
        })
      )}
    </div>
  );
}

function IssueItem({ issue: i }) {
  return (
    <li className={`issue-item issue-${slug(i.status)}`}>
      <div className="issue-top">
        <span className="muted small">{i.location}</span>
        <span className={`tag tag-${slug(i.category)}`}>{i.category}</span>
        <StatusBadge status={i.status} />
        <span className="muted small right">
          {new Date(i.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <p className="issue-desc">{i.description}</p>
      {i.photo && (
        <IssuePhoto
          src={i.photo}
          caption={`${i.category} · ${i.location} — reported by ${i.employeeName}`}
        />
      )}
      <div className="issue-foot">
        <span className="muted small">
          reported by {i.employeeName}
          {i.updatedAt && ` · updated ${timeOf(i.updatedAt)}`}
        </span>
      </div>
    </li>
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

function VisitorsTab({ visitors: allVisitors }) {
  const [unit, setUnit] = useState("all");

  const visible = useMemo(
    () => unit === "all" ? allVisitors : allVisitors.filter((v) => v.location === unit),
    [allVisitors, unit]
  );

  const totalPaid = visible.reduce((sum, v) => sum + (parseFloat(v.amountPaid) || 0), 0);

  return (
    <div className="card">
      <div className="card-title">
        Value Added Services today
        <span className="pill">{allVisitors.length}</span>
        <label className="unit-filter">
          <span className="muted small">Location</span>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="all">All locations</option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="stat-grid" style={{ marginBottom: "12px" }}>
        <div className="stat-tile accent">
          <div className="stat-value">{visible.length}</div>
          <div className="stat-label">Total entries{unit !== "all" ? ` · ${unit}` : ""}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">₹{totalPaid.toLocaleString()}</div>
          <div className="stat-label">Amount collected</div>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="muted empty">No entries logged{unit !== "all" ? ` at ${unit}` : ""} yet.</p>
      ) : (
        <ul className="issue-list">
          {visible.map((v) => (
            <li key={v.id} className="issue-item">
              <div className="issue-top">
                <span className="muted small">{v.location}</span>
                <span className="muted small right">
                  {new Date(v.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="issue-desc">
                <strong>{v.name}</strong>{v.companyName ? ` · ${v.companyName}` : ""}
              </p>
              <div className="issue-foot">
                <span className="muted small">
                  {[v.phone, v.email].filter(Boolean).join(" · ")}
                  {" · logged by "}{v.employeeName}
                </span>
                {v.amountPaid && <span className="chip chip-ok">₹{v.amountPaid}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
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
