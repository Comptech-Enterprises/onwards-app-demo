"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import {
  CATEGORIES,
  ISSUE_STATUSES,
  LOCATIONS,
  TASKS,
  canDeleteIssue,
  canDeleteVisitor,
  computeCMScore,
  computeCentreScore,
  getCentreTeam,
  liveDoneMap,
  taskIdsForUser,
  visibleTasks,
} from "@/lib/seed";
import { IssuePhoto } from "./PhotoLightbox";
import CmView from "./CmView";
import styles from "./ManagerView.module.css";

export default function ManagerView() {
  const { user, completions, checklistPhotos, issues, visitors, employees, view: tab, setIssueStatus } = useApp();
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
    () => unit === "all" ? rows : rows.filter((r) =>
      (r.managedLocations || [r.location]).includes(unit)
    ),
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
        <ScoresTab rows={rows} />
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
        />
      )}
      {openRow && <PersonModal row={openRow} onClose={() => setOpenId(null)} />}
    </section>
  );
}

function HomeTab({ totals, rows, detailRows, unit, setUnit, setOpenId, locs, hasCMs }) {
  return (
    <>
      <div className={styles.statRow}>
        <StatTile label="COMPLETION" value={`${totals.pct}%`} />
        <StatTile label="DONE" value={`${totals.completed}/${totals.total}`} />
        <StatTile label="ON TRACK" value={`${totals.onTrack}/${rows.length}`} ok />
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
        {detailRows.map((r) => (
          <button key={r.id} type="button" className={styles.empCard} onClick={() => setOpenId(r.id)}>
            <div className={styles.empTop}>
              <div className={styles.empInfo}>
                <div className={styles.empNameRow}>
                  <span className={styles.empName}>{r.name}</span>
                  {r.designation === "cm" && <span className={styles.cmBadge}>CM</span>}
                </div>
                <span className="muted small">{r.locationDisplay || r.location}</span>
              </div>
              <div className={styles.ring} style={{ "--pct": r.pct }}>
                <span style={{ color: r.pct === 100 ? "var(--ok)" : "var(--text)" }}>{r.pct}%</span>
              </div>
            </div>
            <div className="progress-track" style={{ marginTop: 10 }}>
              <span className="progress-fill" style={{ width: `${r.pct}%` }} />
            </div>
            <span className="muted small" style={{ marginTop: 4, display: "block" }}>{r.completed}/{r.total} tasks</span>
          </button>
        ))}
      </div>
    </>
  );
}

function IssuesTab({ issues: allIssues, setIssueStatus }) {
  const { deleteIssue } = useApp();
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
            <IssueCard key={i.id} issue={i} onStatusChange={setIssueStatus} onDelete={deleteIssue} />
          ))}
        </div>
      )}
    </>
  );
}

function IssueCard({ issue: i, onStatusChange, onDelete }) {
  const timeStr = new Date(i.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  const borderLeft = i.status === "In progress" ? "3px solid #2f6df4" : i.status === "Resolved" ? "3px solid var(--ok)" : undefined;

  return (
    <div className={styles.issueCard} style={borderLeft ? { borderLeft } : undefined}>
      <div className={styles.issueTop}>
        <span className={`tag tag-${slug(i.category)}`}>{i.category}</span>
        <span className={`status-badge status-${slug(i.status)}`}>{i.status}</span>
      </div>
      <p className={styles.issueDesc}>{i.notes || i.description}</p>
      {i.photo && <IssuePhoto src={i.photo} caption={`${i.category} · ${i.location}`} />}
      <div className={styles.issueFoot}>
        <span className="muted small">{i.employeeName} · {i.location} · {timeStr}</span>
        <div className={styles.statusBtns}>
          {[["Unattended", "New"], ["In progress", "WIP"], ["Resolved", "Done"]].map(([val, label]) => (
            <button
              key={val}
              type="button"
              className={`${styles.statusBtn} ${i.status === val ? styles.statusBtnActive : ""}`}
              onClick={() => onStatusChange(i.id, val)}
            >{label}</button>
          ))}
        </div>
      </div>
      {canDeleteIssue(i) && (
        <button type="button" className="btn-delete" style={{ marginTop: 8 }}
          onClick={() => { if (!window.confirm("Delete this issue?")) return; const r = onDelete(i.id); if (!r.ok) window.alert(r.error); }}>
          Delete
        </button>
      )}
    </div>
  );
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
                  📍 {v.source === "Direct" ? "Direct" : (v.aggregatorName || v.aggregator || "Aggregator")} · {v.payment || "Cash"}
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

function ScoresTab({ rows }) {
  const { employees, completions } = useApp();
  const [search, setSearch] = useState("");
  const [expandedCM, setExpandedCM] = useState(null);

  const cmRows = rows.filter((r) => r.designation === "cm");
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
