"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import {
  CATEGORY_REVIEWERS,
  ISSUE_STATUSES,
  LOCATIONS,
  REVIEW_CATEGORIES,
  canDeleteIssue,
  canDeleteVisitor,
  isDedicatedReviewer,
  liveDoneMap,
  reviewProgress,
  taskById,
  tasksForCategory,
  visibleTasks,
} from "@/lib/seed";
import { IssuePhoto } from "./PhotoLightbox";
import StatusBadge from "./StatusBadge";
import CmView from "./CmView";
import styles from "./ManagerView.module.css";

export default function ManagerView() {
  const { completions, reviewChecks, checklistPhotos, issues, visitors, employees, view: tab } = useApp();
  const [unit, setUnit] = useState("all");
  const [openId, setOpenId] = useState(null);

  const rows = useMemo(() => {
    return employees.map((e) => {
      const done = liveDoneMap(completions[e.id] || {});
      let total;
      let completed;
      if (isDedicatedReviewer(e)) {
        const cats = REVIEW_CATEGORIES.filter((c) => CATEGORY_REVIEWERS[c] && (
          (e.username || "").toLowerCase() === CATEGORY_REVIEWERS[c].username.toLowerCase()
          || (e.name || "").toLowerCase() === CATEGORY_REVIEWERS[c].name.toLowerCase()
        ));
        total = 0;
        completed = 0;
        for (const loc of LOCATIONS) {
          for (const cat of cats) {
            const p = reviewProgress(reviewChecks, cat, loc);
            total += p.total;
            completed += p.completed;
          }
        }
      } else {
        const due = visibleTasks(
          (e.taskIds || []).map(taskById).filter(Boolean),
          done
        );
        total = due.length;
        completed = due.filter((t) => done[t.id]).length;
      }
      const pct = total ? Math.round((completed / total) * 100) : 0;
      return { ...e, total, completed, pct, done, photos: checklistPhotos[e.id] || {}, reviewChecks };
    });
  }, [completions, reviewChecks, checklistPhotos, employees]);

  const totals = useMemo(() => {
    const total = rows.reduce((a, r) => a + r.total, 0);
    const completed = rows.reduce((a, r) => a + r.completed, 0);
    const pct = total ? Math.round((completed / total) * 100) : 0;
    const fullyDone = rows.filter((r) => r.pct === 100).length;
    return { total, completed, pct, fullyDone };
  }, [rows]);

  const centreCount = LOCATIONS.length;

  // The task-detail table can be narrowed to a single unit.
  const detailRows = useMemo(
    () =>
      unit === "all"
        ? rows
        : rows.filter((r) => r.location === unit || isDedicatedReviewer(r)),
    [rows, unit]
  );

  const openRow = rows.find((r) => r.id === openId) || null;

  return (
    <section>
      <div className="page-head page-head-stack">
        <div>
          <h1>
            {tab === "issues"
              ? "Issues"
              : tab === "visitors"
                ? "VAS"
                : tab === "cm"
                  ? "CM"
                  : "Home"}
          </h1>
          <p className="muted">
            {tab === "dashboard"
              ? `Live view across all ${centreCount} centres`
              : "Manage centres and staff"}
          </p>
        </div>
      </div>

      {tab === "cm" ? (
        <CmView />
      ) : tab === "visitors" ? (
        <VisitorsTab visitors={visitors} />
      ) : tab === "issues" ? (
        <IssuesTab issues={issues} />
      ) : (
        <>
      {/* Stat tiles */}
      <div className={styles.statGrid}>
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
      <div className={styles.card}>
        <div className="card-title">
          All employees — task detail
          <label className="unit-filter">
            <span className="muted small">Centre</span>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="all">All centres</option>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
        {/* Name + unit only; green once every task is ticked. Tap for detail. */}
        <div className={styles.peopleGrid}>
          {detailRows.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`${styles.person} ${r.pct === 100 ? styles.complete : ""}`}
              onClick={() => setOpenId(r.id)}
            >
              <span className={styles.personName}>{r.name}</span>
              <span className={styles.personUnit}>{r.location}{r.employeeCode ? ` · ${r.employeeCode}` : ""}</span>
              <div className="progress-track" aria-hidden="true">
                <span className="progress-fill" style={{ width: `${r.pct}%` }} />
              </div>
              <span className="muted small">{r.completed}/{r.total} · {r.pct}%</span>
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
    <div className={styles.card}>
      <div className="card-title">
        Reported issues today
        <span className="pill">{allIssues.length}</span>
        <label className="unit-filter">
          <span className="muted small">Centre</span>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="all">All centres</option>
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
  const { deleteIssue } = useApp();
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
      <p className="issue-desc">{i.notes || i.description}</p>
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
        {canDeleteIssue(i) && (
          <button
            type="button"
            className="btn-delete"
            onClick={() => {
              if (!window.confirm("Delete this issue?")) return;
              const result = deleteIssue(i.id);
              if (!result.ok) window.alert(result.error);
            }}
          >
            Delete
          </button>
        )}
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

  const visible = visibleTasks((row.taskIds || []).map(taskById).filter(Boolean), row.done);
  const doneTasks = visible.filter((t) => row.done[t.id]).map((t) => t.id);
  const pendingTasks = visible.filter((t) => !row.done[t.id]).map((t) => t.id);
  const reviewer = isDedicatedReviewer(row);
  const siteLocation = row.location !== "All centres" ? row.location : null;

  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-label={`${row.name} task detail`}>
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="modal">
        <div className="modal-head">
          <div>
            <strong className="modal-title">{row.name}</strong>
            <span className="muted small">{row.location}{row.employeeCode ? ` · ${row.employeeCode}` : ""}</span>
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

          {reviewer ? (
            REVIEW_CATEGORIES.map((category) => (
              <div key={category} className="modal-section">
                <span className="drawer-label">{category} · reviewed by {row.name}</span>
                {LOCATIONS.map((loc) => {
                  const p = reviewProgress(row.reviewChecks, category, loc);
                  const pending = tasksForCategory(category).filter((t) => !p.done[t.id]);
                  return (
                    <div key={loc} className="review-centre-block">
                      <div className="modal-row">
                        <span>{loc}</span>
                        <span className={`chip ${p.completed === p.total ? "chip-ok" : ""}`}>
                          {p.completed}/{p.total}
                        </span>
                      </div>
                      {pending.length > 0 && (
                        <div className="mini-list">
                          {pending.map((t) => (
                            <span key={t.id} className="mini pending-mini">
                              {t.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <>
          <PhotoReview label="Washroom photos" photos={row.photos?.Washroom} captionPrefix={`${row.location} · washroom`} />
          <PhotoReview label="Pantry photos" photos={row.photos?.Pantry} captionPrefix={`${row.location} · pantry`} />
          <PhotoReview label="Common area photos" photos={row.photos?.["Common Areas"]} captionPrefix={`${row.location} · common area`} />
          <PhotoReview label="Soft services staff photo" photos={row.photos?.["Soft Services"]} captionPrefix={`${row.location} · soft services staff`} />

          <div className="modal-section">
            <span className="drawer-label">Done</span>
            {doneTasks.length === 0 ? (
              <p className="muted empty">Nothing ticked off yet.</p>
            ) : (
              <div className="mini-list">
                {doneTasks.map((id) => {
                  const task = taskById(id);
                  if (!task) return null;
                  return (
                  <span key={id} className="mini done-mini">
                    {task.name}
                    <em className="done-time">{timeOf(row.done[id])}</em>
                  </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="modal-section">
            <span className="drawer-label">Pending</span>
            {pendingTasks.length === 0 ? (
              <p className="muted empty">All tasks complete.</p>
            ) : (
              <div className="mini-list">
                {pendingTasks.map((id) => {
                  const task = taskById(id);
                  if (!task) return null;
                  return (
                  <span key={id} className="mini pending-mini">
                    {task.name}
                  </span>
                  );
                })}
              </div>
            )}
          </div>

          {siteLocation && REVIEW_CATEGORIES.map((category) => {
            const owner = CATEGORY_REVIEWERS[category];
            const p = reviewProgress(row.reviewChecks, category, siteLocation);
            const pending = tasksForCategory(category).filter((t) => !p.done[t.id]);
            return (
              <div key={category} className="modal-section">
                <span className="drawer-label">{category}</span>
                <p className="muted small review-note">
                  {p.completed === p.total
                    ? `Checked by ${owner.name}`
                    : `Pending — this checklist is reviewed by ${owner.name}`}
                </p>
                <div className="modal-row">
                  <span className="muted small">{siteLocation}</span>
                  <span className={`chip ${p.completed === p.total ? "chip-ok" : ""}`}>
                    {p.completed}/{p.total}
                  </span>
                </div>
                {pending.length > 0 && (
                  <div className="mini-list">
                    {pending.map((t) => (
                      <span key={t.id} className="mini pending-mini">
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function VisitorsTab({ visitors: allVisitors }) {
  const { deleteVisitor } = useApp();
  const [unit, setUnit] = useState("all");

  const visible = useMemo(
    () => unit === "all" ? allVisitors : allVisitors.filter((v) => v.location === unit),
    [allVisitors, unit]
  );

  const totalPaid = visible.reduce((sum, v) => sum + (parseFloat(v.amountPaid) || 0), 0);

  return (
    <div className={styles.card}>
      <div className="card-title">
        Value Added Services today
        <span className="pill">{allVisitors.length}</span>
        <label className="unit-filter">
          <span className="muted small">Centre</span>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="all">All centres</option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.statGrid} style={{ marginBottom: "12px" }}>
        <div className={`${styles.tile} ${styles.accent}`}>
          <div className={styles.value}>{visible.length}</div>
          <div className={styles.label}>Total entries{unit !== "all" ? ` · ${unit}` : ""}</div>
        </div>
        <div className={styles.tile}>
          <div className={styles.value}>₹{totalPaid.toLocaleString()}</div>
          <div className={styles.label}>Amount collected</div>
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
                {v.facilityType && <span className={`tag tag-common-areas`}>{v.facilityType}</span>}
                <span className="muted small right">{v.date}</span>
              </div>
              <p className="issue-desc">
                <strong>{v.guestName}</strong>{v.aggregator ? ` · ${v.aggregator}` : ""}
              </p>
              <div className="issue-foot">
                <span className="muted small">
                  {v.arrivalTime && `In: ${v.arrivalTime}`}{v.punchOutTime && ` · Out: ${v.punchOutTime}`}{v.seats && ` · ${v.seats} seat${v.seats > 1 ? "s" : ""}`}{" · logged by "}{v.employeeName}
                </span>
                {v.payment && <span className="chip chip-ok">₹{v.payment}</span>}
                {canDeleteVisitor(v) && (
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => {
                      if (!window.confirm("Delete this entry?")) return;
                      const result = deleteVisitor(v.id);
                      if (!result.ok) window.alert(result.error);
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PhotoReview({ label, photos, captionPrefix }) {
  const list = photos || [];
  return (
    <div className="modal-section">
      <span className="drawer-label">{label}</span>
      {list.length === 0 ? (
        <p className="muted empty">No photos uploaded.</p>
      ) : (
        <div className={styles.photoGrid}>
          {list.map((src, i) => (
            <IssuePhoto key={`${captionPrefix}-${i}`} src={src} caption={`${captionPrefix} ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, accent, warn }) {
  return (
    <div className={`${styles.tile} ${accent ? styles.accent : ""} ${warn ? styles.warn : ""}`}>
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
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
