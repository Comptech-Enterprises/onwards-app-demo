"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import {
  CATEGORIES,
  ISSUE_STATUSES,
  LOCATIONS,
  REVIEW_CATEGORIES,
  TASKS,
  canDeleteIssue,
  canDeleteVisitor,
  computeCMScore,
  computeCentreScore,
  getCentreTeam,
  liveDoneMap,
  reviewProgress,
  taskIdsForUser,
  visibleTasks,
} from "@/lib/seed";
import { IssuePhoto } from "./PhotoLightbox";
import CmView from "./CmView";
import styles from "./ManagerView.module.css";

export default function ManagerView() {
  const { user, completions, checklistPhotos, reviewChecks, issues, visitors, employees, view: tab, updateIssueProgress, setIssueStatus } = useApp();
  const [unit, setUnit] = useState("all");
  const [openId, setOpenId] = useState(null);

  const myCMs = useMemo(() => employees.filter((e) => e.managerId === user?.id), [employees, user?.id]);
  const hasCMs = myCMs.length > 0;
  const cmIds = useMemo(() => new Set(myCMs.map((e) => e.id)), [myCMs]);

  const nonOverseers = useMemo(() => {
    return employees.filter((e) => {
      if (e.location === "All centres") return false;
      if (!hasCMs) return true;
      return cmIds.has(e.id) || cmIds.has(e.supervisorId);
    });
  }, [employees, hasCMs, cmIds]);

  const myLocations = useMemo(() => [...new Set(nonOverseers.map((e) => e.location))], [nonOverseers]);

  const rows = useMemo(() => {
    return nonOverseers.map((e) => {
      if (e.designation === "cm") {
        const cmScore = computeCMScore(e, employees, completions);
        const groupLocations = cmScore.groups.map((g) => g.location);
        const locLabel = groupLocations.length > 1
          ? groupLocations.map((l) => l.split(",")[0]).join(" & ")
          : (e.location || "All centres");
        return {
          ...e, total: cmScore.totalTasks, completed: cmScore.uniqueDoneCount,
          pct: cmScore.scorePct, cmScore,
          managedLocations: groupLocations,
          locationDisplay: locLabel,
        };
      }
      const team = getCentreTeam(e, employees);
      const centreScore = computeCentreScore(team, completions);
      return {
        ...e, total: centreScore.totalTasks, completed: centreScore.uniqueDoneCount,
        pct: centreScore.scorePct,
        managedLocations: [e.location].filter((l) => l && l !== "All centres"),
        locationDisplay: e.location,
      };
    });
  }, [nonOverseers, employees, completions]);

  const totals = useMemo(() => {
    const total = rows.reduce((a, r) => a + r.total, 0);
    const completed = rows.reduce((a, r) => a + r.completed, 0);
    const pct = total ? Math.round((completed / total) * 100) : 0;
    const onTrack = rows.filter((r) => r.pct >= 80).length;
    return { total, completed, pct, onTrack };
  }, [rows]);

  const locs = hasCMs ? myLocations : LOCATIONS;

  const detailRows = useMemo(
    () => (unit === "all" ? rows : rows.filter((r) =>
      (r.managedLocations || [r.location]).includes(unit)
    )).slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    [rows, unit]
  );

  const openRow = rows.find((r) => r.id === openId) || null;

  return (
    <section>
      {tab === "cm" ? (
        <CmView />
      ) : tab === "visitors" ? (
        <VASTab visitors={visitors} />
      ) : tab === "issues" ? (
        <IssuesTab issues={issues} setIssueStatus={setIssueStatus} />
      ) : tab === "scores" ? (
        <ScoresTab rows={rows} setOpenId={setOpenId} />
      ) : (
        <HomeTab
          totals={totals}
          rows={rows}
          detailRows={detailRows}
          unit={unit}
          setUnit={setUnit}
          setOpenId={setOpenId}
          locs={locs}
          hasCMs={hasCMs}
          employees={employees}
          completions={completions}
          issues={issues}
          reviewChecks={reviewChecks}
        />
      )}
      {openRow && <PersonModal row={openRow} onClose={() => setOpenId(null)} />}
    </section>
  );
}

function ProgressCard({ r, onClick, children }) {
  return (
    <button type="button" className={styles.empCard} onClick={onClick}>
      <div className={styles.empTop}>
        <div className={styles.empInfo}>
          <div className={styles.empNameRow}>
            <span className={styles.empName}>{r.name}</span>
            {r.designation === "cm" && <span className={styles.cmBadge}>CM</span>}
          </div>
          <span className="muted small" style={{ color: "var(--brand)", fontWeight: 600 }}>
            📍 {r.locationDisplay || r.location}
          </span>
        </div>
        <div className={styles.ring} style={{ "--pct": r.pct }}>
          <span style={{ color: r.pct === 100 ? "var(--ok)" : "var(--text)" }}>{r.pct}%</span>
        </div>
      </div>
      <div className="progress-track" style={{ marginTop: 10 }}>
        <span className="progress-fill" style={{ width: `${r.pct}%` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span className="muted small">{r.completed}/{r.total} tasks</span>
        <span style={{ color: r.pct >= 80 ? "var(--ok)" : "var(--brand)", fontWeight: 700, fontSize: 12 }}>
          Score: {r.pct}%
        </span>
      </div>
      {children}
    </button>
  );
}

function HomeTab({ totals, rows, detailRows, unit, setUnit, setOpenId, locs, hasCMs, employees, completions, issues, reviewChecks }) {
  const [cmModalId, setCmModalId] = useState(null);

  // Build CM-to-children mapping
  const cmIdSet = useMemo(() => new Set(detailRows.filter((r) => r.designation === "cm").map((r) => r.id)), [detailRows]);

  const childrenByCM = useMemo(() => {
    const map = {};
    detailRows.forEach((r) => {
      if (r.designation !== "cm" && cmIdSet.has(r.supervisorId)) {
        if (!map[r.supervisorId]) map[r.supervisorId] = [];
        const own = computeCentreScore([r], completions);
        map[r.supervisorId].push({
          ...r,
          total: own.totalTasks,
          completed: own.uniqueDoneCount,
          pct: own.scorePct,
        });
      }
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
    );
    return map;
  }, [detailRows, cmIdSet, completions]);

  // Top-level: CMs + employees not under any CM
  const topLevel = useMemo(
    () => detailRows.filter((r) => r.designation === "cm" || !cmIdSet.has(r.supervisorId)),
    [detailRows, cmIdSet]
  );

  const cmModalRow = cmModalId ? topLevel.find((r) => r.id === cmModalId) : null;
  const cmModalChildren = cmModalRow ? childrenByCM[cmModalRow.id] || [] : [];

  return (
    <>
      <div className={styles.statRow}>
        <StatTile label="COMPLETION" value={`${totals.pct}%`} />
        <StatTile label="DONE" value={`${totals.completed}/${totals.total}`} />
        <StatTile label="ON TRACK" value={`${totals.onTrack}/${rows.length}`} ok />
        <StatTile label="OPEN ISSUES" value={issues.filter((i) => i.status !== "Resolved").length} />
      </div>

      {!hasCMs && <div className={styles.chipScroll}>
        <button
          type="button"
          className={`${styles.locChip} ${unit === "all" ? styles.chipActive : ""}`}
          onClick={() => setUnit("all")}
        >All</button>
        {locs.map((l) => (
          <button
            key={l}
            type="button"
            className={`${styles.locChip} ${unit === l ? styles.chipActive : ""}`}
            onClick={() => setUnit(l)}
          >{l}</button>
        ))}
      </div>}

      <h2 className={styles.sectionHead}>Employee Progress</h2>
      <div className="stack">
        {topLevel.map((r) => {
          const children = childrenByCM[r.id] || [];
          const isCMWithChildren = r.designation === "cm" && children.length > 0;

          return (
            <ProgressCard
              key={r.id}
              r={r}
              onClick={() => {
                if (isCMWithChildren) {
                  setCmModalId(r.id);
                } else {
                  setOpenId(r.id);
                }
              }}
            >
              {r.designation === "cm" && r.cmScore?.groups?.length > 1 && (
                <div className={styles.subChips}>
                  {r.cmScore.groups.map((g) => (
                    <span key={g.location} className={styles.subChip}>
                      {g.location.split(",")[0]}: <strong>{g.stats.scorePct}%</strong>
                    </span>
                  ))}
                </div>
              )}
              {isCMWithChildren && (
                <span className="muted small" style={{ marginTop: 6, display: "block" }}>
                  {children.length} supervisor{children.length !== 1 ? "s" : ""} on ground · tap to view
                </span>
              )}
            </ProgressCard>
          );
        })}
      </div>

      {/* CM team modal */}
      {cmModalRow && (
        <div className="modal-wrap" role="dialog" aria-modal="true" aria-label={`${cmModalRow.name} team`}
          onKeyDown={(e) => e.key === "Escape" && setCmModalId(null)}>
          <div className="modal-backdrop" onClick={() => setCmModalId(null)} aria-hidden="true" />
          <div className="modal">
            <div className="modal-head">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <strong className="modal-title">{cmModalRow.name}</strong>
                  <span className={styles.cmBadge}>CM</span>
                </div>
                <span style={{ color: "var(--brand)", fontSize: 13, fontWeight: 600 }}>
                  📍 {cmModalRow.locationDisplay || cmModalRow.location}
                </span>
                <span className="muted small" style={{ display: "block", marginTop: 2 }}>
                  {cmModalChildren.length} supervisor{cmModalChildren.length !== 1 ? "s" : ""} · Overall CM Score: {cmModalRow.pct}%
                </span>
              </div>
              <button className="modal-close" onClick={() => setCmModalId(null)} aria-label="Close">✕</button>
            </div>
            <div className="stack">
              {cmModalChildren.map((child) => (
                <ProgressCard
                  key={child.id}
                  r={child}
                  onClick={() => {
                    setCmModalId(null);
                    setOpenId(child.id);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {REVIEW_CATEGORIES.map((cat) => {
        const reviewLocs = hasCMs ? locs : LOCATIONS;
        return (
          <div key={cat}>
            <h2 className={styles.sectionHead}>{cat} Review</h2>
            <div className="stack">
              {reviewLocs.map((loc) => {
                const prog = reviewProgress(reviewChecks, cat, loc);
                const rpct = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
                return (
                  <div key={loc} className={styles.reviewRow}>
                    <div className={styles.reviewRowTop}>
                      <span className={styles.reviewLoc}>{loc}</span>
                      <span className="muted small">{prog.completed}/{prog.total}</span>
                    </div>
                    <div className="progress-track" style={{ marginTop: 6 }}>
                      <span className="progress-fill" style={{ width: `${rpct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}

function IssuesTab({ issues: allIssues, setIssueStatus }) {
  const { deleteIssue, updateIssueProgress } = useApp();
  const [unit, setUnit] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = allIssues;
    if (status !== "all") list = list.filter((i) => i.status === status);
    if (unit !== "all") list = list.filter((i) => i.location === unit);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((i) =>
        (i.notes || i.description || "").toLowerCase().includes(q) ||
        (i.employeeName || "").toLowerCase().includes(q) ||
        (i.category || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [allIssues, status, unit, search]);

  return (
    <>
      <h1 className={styles.pageHeading}>All Issues</h1>
      <label className="search-bar">
        <span aria-hidden="true">⌕</span>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search issues…" />
      </label>
      <div className="chip-row">
        <button type="button" className={`chip-filter ${status === "all" ? "active" : ""}`} onClick={() => setStatus("all")}>All</button>
        {ISSUE_STATUSES.map((s) => (
          <button key={s} type="button" className={`chip-filter ${status === s ? "active" : ""}`} onClick={() => setStatus(s)}>{s}</button>
        ))}
      </div>
      <div className={styles.chipScroll} style={{ marginBottom: 16 }}>
        <button type="button" className={`${styles.locChip} ${unit === "all" ? styles.chipActive : ""}`} onClick={() => setUnit("all")}>All</button>
        {LOCATIONS.map((l) => (
          <button key={l} type="button" className={`${styles.locChip} ${unit === l ? styles.chipActive : ""}`} onClick={() => setUnit(l)}>{l}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="muted empty">No issues match filters.</p>
      ) : (
        <div className="stack">
          {filtered.map((i) => (
            <IssueCard key={i.id} issue={i} onStatusChange={setIssueStatus} onUpdateProgress={updateIssueProgress} onDelete={deleteIssue} />
          ))}
        </div>
      )}
    </>
  );
}

function IssueCard({ issue: i, onStatusChange, onUpdateProgress, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(i.status);
  const [progressNote, setProgressNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const timeStr = new Date(i.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  const isOverdue = i.status !== "Resolved" && (i.escalationSent || Date.now() - new Date(i.createdAt).getTime() >= 259200000);
  const borderLeft = isOverdue ? "3.5px solid var(--warn, #f59e0b)" : i.status === "In progress" ? "3px solid #2f6df4" : i.status === "Resolved" ? "3px solid var(--ok)" : undefined;
  const history = i.progressHistory || [];

  async function handleSaveProgress() {
    setSubmitting(true);
    await onUpdateProgress(i.id, { status: selectedStatus, progressNote: progressNote.trim() || undefined });
    setProgressNote("");
    setSubmitting(false);
    setShowModal(false);
  }

  return (
    <>
      <div className={styles.issueCard} style={borderLeft ? { borderLeft } : undefined}>
        <div className={styles.issueTop}>
          <span className={`tag tag-${slug(i.category)}`}>{i.category}</span>
          <span className={`status-badge status-${slug(i.status)}`}>{i.status}</span>
        </div>
        {isOverdue && <div style={{ background: "color-mix(in srgb, var(--warn, #f59e0b) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--warn, #f59e0b) 40%, transparent)", color: "var(--warn, #f59e0b)", fontSize: 11, fontWeight: 600, padding: "4px 8px", borderRadius: 6 }}>🚨 Escalated (3+ Days Unresolved)</div>}
        <p className={styles.issueDesc}>{i.notes || i.description}</p>
        {i.photo && <IssuePhoto src={i.photo} caption={`${i.category} · ${i.location}`} />}
        {i.progressNote && (
          <div style={{ background: "var(--surface-2, var(--surface))", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", fontSize: 13 }}>
            <span className="muted small">Last: <strong>{i.progressUpdatedBy}</strong> ({i.progressUpdatedByRole})</span>
            <p style={{ margin: "4px 0 0", color: "var(--text)" }}>[{i.status}] {i.progressNote}</p>
          </div>
        )}
        {history.length > 0 && (
          <details style={{ fontSize: 12 }}>
            <summary className="muted small" style={{ cursor: "pointer", fontWeight: 600 }}>Progress History ({history.length})</summary>
            {history.slice(-5).reverse().map((h) => (
              <div key={h.id} style={{ padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span className="muted small">{h.updatedByName} ({h.updatedByRole})</span>
                  <span className="muted small">{fmtAgo(h.updatedAt)}</span>
                </div>
                <p style={{ margin: "2px 0 0", color: "var(--text)" }}><strong style={{ color: "var(--brand)" }}>[{h.status}]</strong> {h.note}</p>
              </div>
            ))}
          </details>
        )}
        <div className={styles.issueFoot}>
          <span className="muted small">{i.employeeName} · {i.location} · {timeStr}{i.clusterManagerName ? ` · CM: ${i.clusterManagerName}` : ""}</span>
          <div className={styles.statusBtns}>
            {[["Unattended", "New"], ["In progress", "WIP"], ["Resolved", "Done"]].map(([val, label]) => (
              <button key={val} type="button" className={`${styles.statusBtn} ${i.status === val ? styles.statusBtnActive : ""}`} onClick={() => onStatusChange(i.id, val)}>{label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button type="button" style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--brand) 30%, transparent)", color: "var(--brand)", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8, cursor: "pointer" }} onClick={() => { setSelectedStatus(i.status); setProgressNote(""); setShowModal(true); }}>
            ✏️ {i.progressNote ? "Update Progress" : "Add Note"}
          </button>
          {canDeleteIssue(i) && (
            <button type="button" className="btn-delete" onClick={() => { if (window.confirm("Delete this issue?")) { const r = onDelete(i.id); if (!r.ok) window.alert(r.error); } }}>Delete</button>
          )}
        </div>
      </div>
      {showModal && (
        <div className="modal-wrap" role="dialog" aria-modal="true">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} aria-hidden="true" />
          <div className="modal">
            <div className="modal-head">
              <div>
                <strong className="modal-title">Issue Progress Update</strong>
                <span className="muted small">{i.category} at {i.location}</span>
              </div>
              <button type="button" className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">✕</button>
            </div>
            <div className="field">
              <span>Status</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {ISSUE_STATUSES.map((s) => (
                  <button key={s} type="button" className={`chip-filter ${selectedStatus === s ? "active" : ""}`} onClick={() => setSelectedStatus(s)}>{s}</button>
                ))}
              </div>
            </div>
            <label className="field">
              <span>Progress Note</span>
              <textarea rows={3} value={progressNote} onChange={(e) => setProgressNote(e.target.value)} placeholder="Describe what was done, next steps…" />
            </label>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="button" className="btn-primary" disabled={submitting} onClick={handleSaveProgress}>{submitting ? "Saving…" : "Save Progress"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function fmtAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function VASTab({ visitors: allVisitors }) {
  const { deleteVisitor } = useApp();
  const [unit, setUnit] = useState("all");

  const visible = useMemo(
    () => unit === "all" ? allVisitors : allVisitors.filter((v) => v.location === unit),
    [allVisitors, unit]
  );

  return (
    <>
      <h1 className={styles.pageHeading}>All Visitors</h1>
      <div className={styles.chipScroll} style={{ marginBottom: 16 }}>
        <button type="button" className={`${styles.locChip} ${unit === "all" ? styles.chipActive : ""}`} onClick={() => setUnit("all")}>All</button>
        {LOCATIONS.map((l) => (
          <button key={l} type="button" className={`${styles.locChip} ${unit === l ? styles.chipActive : ""}`} onClick={() => setUnit(l)}>{l}</button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="muted empty">No entries logged{unit !== "all" ? ` at ${unit}` : ""} yet.</p>
      ) : (
        <div className="stack">
          {visible.map((v) => (
            <div key={v.id} className={styles.visitorCard}>
              <div className={styles.visitorTop}>
                <div>
                  <span className={styles.visitorName}>{v.guestName}</span>
                  {v.facilityType && (
                    <span style={{ color: "var(--brand)", fontSize: 13, fontWeight: 600, display: "block", marginTop: 1 }}>
                      {v.facilityType}{v.seats ? ` · ${v.seats} seat${v.seats > 1 ? "s" : ""}` : ""}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span className="muted small">{v.arrivalTime || v.date}</span>
                  {v.invoiceTechMonk != null && (
                    <span style={{ background: v.invoiceTechMonk === "Yes" ? "color-mix(in srgb, var(--ok) 15%, transparent)" : "#fff3cd", color: v.invoiceTechMonk === "Yes" ? "var(--ok)" : "#9a6700", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6 }}>
                      TM Invoice: {v.invoiceTechMonk}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.visitorMeta} style={{ marginTop: 6 }}>
                <span className="muted small">
                  📍 {v.source === "Direct" ? "Direct" : `${v.source || "Aggregator"}${v.aggregator && v.aggregator !== "NA" ? ` (${v.aggregator})` : ""}`} · {v.payment || "Cash"}
                </span>
              </div>
              {(v.amountReceived != null || v.paymentAmount != null) && (
                <div style={{ marginTop: 2 }}>
                  <span style={{ color: "var(--ok)", fontWeight: 700, fontSize: 13 }}>
                    💰 Amount (excl. GST): ₹{v.amountReceived ?? v.paymentAmount ?? 0}
                  </span>
                </div>
              )}
              <span className="muted small" style={{ marginTop: 4, display: "block" }}>Logged by {v.employeeName} · {v.location}</span>
              {canDeleteVisitor(v) && (
                <button type="button" className="btn-delete" style={{ marginTop: 8 }}
                  onClick={() => { if (!window.confirm("Delete this entry?")) return; const r = deleteVisitor(v.id); if (!r.ok) window.alert(r.error); }}>
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function ScoresTab({ rows, setOpenId }) {
  const { employees, completions } = useApp();
  const [search, setSearch] = useState("");
  const [expandedCM, setExpandedCM] = useState(null);

  const cmRows = rows.filter((r) => r.designation === "cm")
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  const avgScore = cmRows.length ? Math.round(cmRows.reduce((a, r) => a + r.pct, 0) / cmRows.length) : 0;
  const totalCentres = cmRows.reduce((a, r) => a + (r.cmScore?.groups?.length || 1), 0);
  const onTrack = cmRows.filter((r) => r.pct >= 80).length;

  const visible = search.trim()
    ? cmRows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || (r.locationDisplay || r.location || "").toLowerCase().includes(search.toLowerCase()))
    : cmRows;

  return (
    <>
      <h1 className={styles.pageHeading}>CM Scores</h1>
      <p className="muted" style={{ marginBottom: 14, marginTop: -10 }}>Cluster manager scoring overview</p>
      <div className={styles.statRow}>
        <StatTile label="AVG SCORE" value={`${avgScore}%`} />
        <StatTile label="CENTRES" value={totalCentres} />
        <StatTile label="ON TRACK" value={`${onTrack}/${cmRows.length}`} ok />
      </div>
      <label className="search-bar" style={{ marginBottom: 16 }}>
        <span aria-hidden="true">⌕</span>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search CM or centre name…" />
      </label>
      <div className="stack">
        {visible.map((r) => {
          const cmScore = r.cmScore || computeCMScore(r, employees, completions);
          const expanded = expandedCM === r.id;
          return (
            <div key={r.id} className={styles.empCard} style={{ cursor: "pointer" }} onClick={() => setExpandedCM(expanded ? null : r.id)}>
              <div className={styles.empTop}>
                <div className={styles.empInfo}>
                  <div className={styles.empNameRow}>
                    <span className={styles.empName}>{r.name}</span>
                    <span className={styles.cmBadge}>CM</span>
                  </div>
                  <span className="muted small" style={{ color: "var(--brand)", fontWeight: 600 }}>📍 {r.locationDisplay || r.location}</span>
                </div>
                <div className={styles.ring} style={{ "--pct": r.pct }}>
                  <span style={{ color: r.pct === 100 ? "var(--ok)" : "var(--text)" }}>{r.pct}%</span>
                </div>
              </div>
              <div className="progress-track" style={{ marginTop: 10 }}>
                <span className="progress-fill" style={{ width: `${r.pct}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span className="muted small">{r.completed}/{r.total} tasks completed</span>
                <span style={{ color: r.pct === 100 ? "var(--ok)" : "var(--brand)", fontWeight: 700, fontSize: 12 }}>
                  Score: {r.pct}%
                </span>
              </div>

              {expanded && cmScore.groups && (
                <div style={{ marginTop: 12, borderTop: "1px solid var(--glass-border)", paddingTop: 10 }}>
                  {cmScore.groups.map((g) => (
                    <div key={g.location} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{g.location.split(",")[0]}</span>
                        <span style={{ color: "var(--brand)", fontWeight: 700, fontSize: 12 }}>{g.stats.scorePct}%</span>
                      </div>
                      <div className="progress-track" style={{ marginBottom: 6 }}>
                        <span className="progress-fill" style={{ width: `${g.stats.scorePct}%` }} />
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {g.stats.individualStats.filter((s) => s.emp.id !== r.id).map((s) => (
                          <span key={s.emp.id} style={{
                            background: "color-mix(in srgb, var(--brand) 10%, transparent)",
                            color: "var(--brand)", fontSize: 11, padding: "2px 8px",
                            borderRadius: 6, fontWeight: 600,
                          }}>
                            {s.emp.name.split(" ")[0]} {s.pct}%
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    style={{ marginTop: 8, background: "var(--brand)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    onClick={(e) => { e.stopPropagation(); setOpenId(r.id); }}
                  >
                    View Tasks
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function PersonModal({ row, onClose }) {
  const { employees, completions, checklistPhotos } = useApp();
  const isCM = row.designation === "cm";
  const cmStats = useMemo(
    () => isCM ? (row.cmScore || computeCMScore(row, employees, completions)) : null,
    [isCM, row, employees, completions]
  );
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0);

  const currentGroup = (isCM && cmStats?.groups?.length > 0) ? cmStats.groups[selectedGroupIdx] : null;
  const targetLocation = currentGroup ? currentGroup.location : row.location;

  const centreTeam = useMemo(() => {
    if (currentGroup) return currentGroup.employees;
    return getCentreTeam(row, employees, targetLocation);
  }, [currentGroup, row, employees, targetLocation]);

  const centreScore = useMemo(() => {
    if (currentGroup) return currentGroup.stats;
    return computeCentreScore(centreTeam, completions);
  }, [currentGroup, centreTeam, completions]);

  const done = centreScore.uniqueDoneMap;

  const allAssignedTaskIds = useMemo(() => {
    const ids = new Set();
    centreTeam.forEach((m) => taskIdsForUser(m).forEach((id) => ids.add(id)));
    if (ids.size === 0) (row.taskIds || []).forEach((id) => ids.add(id));
    return ids;
  }, [centreTeam, row.taskIds]);

  const myTasks = TASKS.filter((t) => allAssignedTaskIds.has(t.id));
  const categories = CATEGORIES.filter((c) => myTasks.some((t) => t.category === c));

  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-label={`${row.name} task detail`}
      onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="modal">
        <div className="modal-head">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <strong className="modal-title">{row.name}</strong>
              {isCM && <span className={styles.cmBadge}>CM</span>}
            </div>
            <span style={{ color: "var(--brand)", fontSize: 13, fontWeight: 600 }}>
              📍 {targetLocation}
            </span>
            {isCM && cmStats ? (
              <span className="muted small" style={{ display: "block", marginTop: 2 }}>
                {cmStats.groups.length > 1
                  ? `Group: ${currentGroup ? currentGroup.stats.scorePct : 0}% · Overall: ${cmStats.scorePct}% (${cmStats.uniqueDoneCount}/${cmStats.totalTasks} tasks)`
                  : `Overall: ${cmStats.scorePct}% (${cmStats.uniqueDoneCount}/${cmStats.totalTasks} tasks)`}
              </span>
            ) : (
              <span className="muted small" style={{ display: "block", marginTop: 2 }}>
                Centre Score: {centreScore.scorePct}% ({centreScore.uniqueDoneCount}/{centreScore.totalTasks} tasks)
              </span>
            )}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {isCM && cmStats && cmStats.groups.length > 1 && (
          <div className={styles.chipScroll} style={{ marginBottom: 14 }}>
            {cmStats.groups.map((g, i) => (
              <button
                key={g.location}
                type="button"
                className={`${styles.locChip} ${selectedGroupIdx === i ? styles.chipActive : ""}`}
                onClick={() => setSelectedGroupIdx(i)}
                style={{ fontSize: 12 }}
              >
                {g.location.split(",")[0]}<br />
                <span style={{ fontSize: 11, opacity: 0.85 }}>{g.stats.scorePct}% ({g.stats.uniqueDoneCount}/{g.stats.totalTasks})</span>
              </button>
            ))}
          </div>
        )}

        {categories.map((cat) => {
          const catTasks = visibleTasks(myTasks.filter((t) => t.category === cat), done);
          const catDone = catTasks.filter((t) => done[t.id]).length;
          const catTotal = catTasks.length;
          const catPct = catTotal ? Math.round((catDone / catTotal) * 100) : 0;
          const pending = catTasks.filter((t) => !done[t.id]);
          return (
            <div key={cat} className={styles.catBlock}>
              <div className={styles.catBlockTop}>
                <span className={styles.catBlockName}>{cat}</span>
                <span style={{ color: "var(--brand)", fontWeight: 700, fontSize: 13 }}>{catDone}/{catTotal}</span>
              </div>
              <div className="progress-track" style={{ marginTop: 6 }}>
                <span className="progress-fill" style={{ width: `${catPct}%` }} />
              </div>
              {pending.length > 0 && (
                <div className={styles.pendingList}>
                  {pending.map((t) => (
                    <span key={t.id} className={styles.pendingChip}>{t.name}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatTile({ label, value, ok }) {
  return (
    <div className={styles.tile}>
      <div className={`${styles.tileLabel}`}>{label}</div>
      <div className={`${styles.tileValue} ${ok ? styles.tileOk : ""}`}>{value}</div>
    </div>
  );
}

function timeOf(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function slug(s) {
  return s.toLowerCase().replace(/\s+/g, "-");
}
