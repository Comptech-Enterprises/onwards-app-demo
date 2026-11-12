"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import {
  taskById,
  CATEGORIES,
  CATEGORY_REVIEWERS,
  ISSUE_STATUSES,
  CHECKLIST_PHOTO_GATES,
  LOCATIONS,
  canDeleteIssue,
  canDeleteVisitor,
  checklistPhotosReady,
  frequencyOf,
  isDedicatedReviewer,
  liveDoneMap,
  reviewDoneMap,
  taskIsVisible,
  taskIdsForUser,
  tasksForCategory,
  visibleTasks,
  getCentreTeam,
  computeCentreScore,
  computeCMScore,
} from "@/lib/seed";
import IssueForm from "./IssueForm";
import VisitorForm from "./VisitorForm";
import { IssuePhoto } from "./PhotoLightbox";
import styles from "./EmployeeView.module.css";

export default function EmployeeView() {
  const { user, users, completions, reviewChecks, checklistPhotos, issues, visitors, toggleTask, addChecklistPhoto, removeChecklistPhoto, updateIssueProgress, setIssueStatus, deleteIssue, deleteVisitor, view } = useApp();
  const tab = view === "issues" || view === "visitors" ? view : "tasks";
  const [reviewLocation, setReviewLocation] = useState(LOCATIONS[0]);
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState("all");

  const currentEmployeeId = user.id;
  const employee = users.find((u) => u.id === currentEmployeeId) || user;
  const reviewer = isDedicatedReviewer(employee);
  const isCM = employee.designation === "cm";
  const homeLocation = employee.location && employee.location !== "All centres" ? employee.location : null;

  const mySupervisors = useMemo(() => isCM ? users.filter((u) => u.supervisorId === currentEmployeeId) : [], [isCM, users, currentEmployeeId]);
  const managedLocations = useMemo(() => {
    if (!isCM) return homeLocation ? [homeLocation] : [];
    return [...new Set([employee.location, ...mySupervisors.map((s) => s.location)].filter((l) => l && l !== "All centres"))];
  }, [isCM, employee.location, mySupervisors, homeLocation]);
  const [selectedLoc, setSelectedLoc] = useState(null);
  const activeLocation = reviewer
    ? reviewLocation
    : (managedLocations.includes(selectedLoc) ? selectedLoc : managedLocations[0] || homeLocation);

  const centreTeam = useMemo(() => getCentreTeam(employee, users, activeLocation), [employee, users, activeLocation]);
  const cmStats = useMemo(() => isCM ? computeCMScore(employee, users, completions) : null, [isCM, employee, users, completions]);
  const siteDone = useMemo(() => {
    const merged = {};
    centreTeam.forEach((emp) => {
      Object.assign(merged, liveDoneMap(completions[emp.id] || {}));
    });
    return merged;
  }, [centreTeam, completions]);

  const myTasks = useMemo(() => {
    if (reviewer) {
      const assigned = (employee.taskIds || []).map(taskById).filter(Boolean);
      return assigned.filter((t) => {
        const done = reviewDoneMap(reviewChecks, t.category, activeLocation);
        return taskIsVisible(t, done[t.id]);
      });
    }
    const allIds = new Set();
    centreTeam.forEach((emp) => taskIdsForUser(emp).forEach((id) => allIds.add(id)));
    if (allIds.size === 0) (employee.taskIds || []).forEach((id) => allIds.add(id));
    const assigned = [...allIds].map(taskById).filter(Boolean);
    return visibleTasks(assigned, siteDone);
  }, [employee, centreTeam, reviewer, reviewChecks, activeLocation, siteDone]);
  const grouped = useMemo(() => {
    const map = {};
    myTasks.forEach((t) => {
      (map[t.category] ||= []).push(t);
    });
    return CATEGORIES.filter((c) => map[c]).map((c) => [c, map[c]]);
  }, [myTasks]);

  const pendingReviewGroups = useMemo(() => {
    if (reviewer) return [];
    return Object.keys(CATEGORY_REVIEWERS).map((category) => [
      category,
      visibleTasks(tasksForCategory(category), reviewDoneMap(reviewChecks, category, activeLocation)),
      CATEGORY_REVIEWERS[category],
    ]);
  }, [reviewer, reviewChecks, activeLocation]);

  // CM sees issues from themselves + their supervisors
  const myTeamIds = useMemo(() => {
    if (employee.designation === "cm") {
      const ids = new Set([currentEmployeeId]);
      users.forEach((u) => { if (u.supervisorId === currentEmployeeId) ids.add(u.id); });
      return ids;
    }
    return new Set([currentEmployeeId]);
  }, [employee.designation, currentEmployeeId, users]);

  const myIssues = issues.filter((i) => myTeamIds.has(i.employeeId) || myTeamIds.has(i.userId));
  const myVisitors = visitors.filter((v) => v.employeeId === currentEmployeeId);

  const totalVisible = grouped.reduce((acc, [, tasks]) => acc + tasks.length, 0);
  const totalDone = grouped.reduce((acc, [cat, tasks]) => {
    const done = CATEGORY_REVIEWERS[cat]
      ? reviewDoneMap(reviewChecks, cat, activeLocation)
      : siteDone;
    return acc + tasks.filter((t) => done[t.id]).length;
  }, 0);
  const pct = totalVisible > 0 ? Math.round((totalDone / totalVisible) * 100) : 0;

  const visibleGroups = grouped.filter(([category, tasks]) => {
    const q = query.trim().toLowerCase();
    if (q && !category.toLowerCase().includes(q) && !tasks.some((t) => t.name.toLowerCase().includes(q))) {
      return false;
    }
    const done = CATEGORY_REVIEWERS[category]
      ? reviewDoneMap(reviewChecks, category, activeLocation)
      : siteDone;
    const doneCount = tasks.filter((t) => done[t.id]).length;
    if (chip === "pending") return doneCount < tasks.length;
    if (chip === "completed") return doneCount === tasks.length && tasks.length > 0;
    return true;
  });

  return (
    <section>
      {tab === "tasks" && (
        <>
      {isCM && managedLocations.length > 1 && (
        <div className={styles.locSwitcher}>
          {managedLocations.map((loc) => {
            const sel = loc === activeLocation;
            const locTeam = getCentreTeam(employee, users, loc);
            const locScore = computeCentreScore(locTeam, completions);
            return (
              <button key={loc} type="button" className={`${styles.locTab} ${sel ? styles.locTabActive : ""}`} onClick={() => setSelectedLoc(loc)}>
                <span className={styles.locName}>📍 {loc.split(",")[0]}</span>
                <span className={styles.locScore}>{locScore.scorePct}% ({locScore.uniqueDoneCount}/{locScore.totalTasks})</span>
              </button>
            );
          })}
        </div>
      )}
      <div className={styles.summaryCard}>
        <div className={styles.summaryText}>
          <h1 className={styles.summaryHeading}>
            {reviewer ? reviewLocation : (activeLocation || employee.location || "Tasks")}
          </h1>
          <p className={styles.summaryMeta}>
            {totalDone} of {totalVisible} completed · {pct}% Done
          </p>
          {isCM && managedLocations.length > 1 && cmStats && (
            <span className={styles.cmBadge}>Overall CM Score: {cmStats.scorePct}% ({cmStats.uniqueDoneCount}/{cmStats.totalTasks} tasks)</span>
          )}
        </div>
        <div className={styles.ring} style={{"--pct": pct}}>
          <span style={{color: pct === 100 ? "var(--ok)" : "var(--text)"}}>{pct}%</span>
        </div>
      </div>
      <label className="search-bar">
        <span aria-hidden="true">⌕</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks, category…"
        />
      </label>
      <div className="chip-row" role="tablist" aria-label="Filter tasks">
        {["all", "pending", "completed"].map((id) => (
          <button
            key={id}
            type="button"
            className={`chip-filter ${chip === id ? "active" : ""}`}
            onClick={() => setChip(id)}
          >
            {id[0].toUpperCase() + id.slice(1)}
          </button>
        ))}
      </div>
        </>
      )}
      {tab === "issues" && (
        <div className="page-head page-head-stack">
          <div>
            <h1>Issues</h1>
            <p className="muted">Report and track site issues</p>
          </div>
        </div>
      )}
      {tab === "visitors" && (
        <div className="page-head page-head-stack">
          <div>
            <h1>VAS</h1>
            <p className="muted">Value added services</p>
          </div>
        </div>
      )}

      {tab === "tasks" ? (
        <div className="stack">
          {reviewer && (
            <label className="unit-filter review-centre">
              <span className="muted small">Centre</span>
              <select value={reviewLocation} onChange={(e) => setReviewLocation(e.target.value)}>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          )}
          {visibleGroups.map(([category, tasks]) => {
            const owned = CATEGORY_REVIEWERS[category];
            const done = owned
              ? reviewDoneMap(reviewChecks, category, activeLocation)
              : siteDone;
            return (
              <CategoryAccordion
                key={category}
                category={category}
                tasks={tasks}
                done={done}
                employeeId={currentEmployeeId}
                toggleTask={(id, taskId) => toggleTask(id, taskId, activeLocation)}
                centreTeam={centreTeam}
                activeLocation={activeLocation}
                allPhotos={checklistPhotos}
                photos={(checklistPhotos[currentEmployeeId] || {})[category] || []}
                onAddPhoto={addChecklistPhoto}
                onRemovePhoto={removeChecklistPhoto}
              />
            );
          })}
          {pendingReviewGroups.map(([category, tasks, owner]) => {
            const done = reviewDoneMap(reviewChecks, category, activeLocation);
            return (
              <CategoryAccordion
                key={category}
                category={category}
                tasks={tasks}
                done={done}
                employeeId={currentEmployeeId}
                toggleTask={toggleTask}
                photos={[]}
                readOnly
                pendingNote={`Pending — this checklist is reviewed by ${owner.name}`}
              />
            );
          })}
        </div>
      ) : tab === "visitors" ? (
        <div className="stack">
          <VisitorForm employeeId={currentEmployeeId} />
          <div className={styles.card}>
            <div className="card-title">Value added services logged today</div>
            {myVisitors.length === 0 ? (
              <p className="muted empty">No entries logged yet.</p>
            ) : (
              <ul className="issue-list">
                {myVisitors.map((v) => (
                  <li key={v.id} className="issue-item">
                    <div className="issue-top">
                      <span className="muted small">{v.location}</span>
                      {v.facilityType && <span className={`tag tag-common-areas`}>{v.facilityType}</span>}
                      <span className="muted small right">{v.date}</span>
                    </div>
                    <p className="issue-desc"><strong>{v.guestName}</strong></p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      <span className="muted small">
                        📍 {v.source === "Direct" ? "Direct" : `${v.source || "Aggregator"}${v.aggregator && v.aggregator !== "NA" ? ` (${v.aggregator})` : ""}`} · {v.payment || "Cash"}
                      </span>
                      {v.invoiceTechMonk != null && (
                        <span style={{ background: v.invoiceTechMonk === "Yes" ? "color-mix(in srgb, var(--ok) 15%, transparent)" : "#fff3cd", color: v.invoiceTechMonk === "Yes" ? "var(--ok)" : "#9a6700", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 5 }}>
                          TM: {v.invoiceTechMonk}
                        </span>
                      )}
                    </div>
                    {(v.amountReceived != null || v.paymentAmount != null) && (
                      <span style={{ color: "var(--ok)", fontWeight: 700, fontSize: 12, marginTop: 2 }}>
                        💰 ₹{Number(v.amountReceived ?? v.paymentAmount ?? 0).toLocaleString("en-IN")}
                      </span>
                    )}
                    <div className="issue-foot">
                      <span className="muted small">
                        {v.arrivalTime && `In: ${v.arrivalTime}`}{v.punchOutTime && ` · Out: ${v.punchOutTime}`}{v.seats && ` · ${v.seats} seat${v.seats > 1 ? "s" : ""}`}
                      </span>
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
        </div>
      ) : (
        <div className="stack">
          <IssueForm employeeId={currentEmployeeId} />
          <div className={styles.card}>
            <div className="card-title">Your reported issues today</div>
            {myIssues.length === 0 ? (
              <p className="muted empty">No issues reported yet.</p>
            ) : (
              <ul className="issue-list">
                {myIssues.map((i) => (
                  <IssueItem key={i.id} issue={i} isCM={isCM} isManager={false} onUpdateProgress={updateIssueProgress} onStatusChange={setIssueStatus} onDelete={canDeleteIssue(i) ? deleteIssue : null} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function CategoryAccordion({
  category,
  tasks,
  done,
  employeeId,
  toggleTask,
  centreTeam,
  activeLocation,
  allPhotos,
  photos = [],
  onAddPhoto,
  onRemovePhoto,
  readOnly = false,
  pendingNote,
}) {
  const doneCount = tasks.filter((t) => done[t.id]).length;
  const [open, setOpen] = useState(false);
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const gate = !readOnly && CHECKLIST_PHOTO_GATES[category];
  const teamPhotoReady = useMemo(() => {
    if (!gate || readOnly) return true;
    if (centreTeam && allPhotos) {
      for (const emp of centreTeam) {
        const locKey = activeLocation ? `${emp.id}@${activeLocation}` : null;
        const locPhotos = locKey ? allPhotos[locKey]?.[category] : null;
        const plainPhotos = allPhotos[emp.id]?.[category];
        if (checklistPhotosReady(category, locPhotos || plainPhotos)) return true;
      }
      return false;
    }
    return checklistPhotosReady(category, photos);
  }, [gate, readOnly, centreTeam, allPhotos, activeLocation, category, photos]);
  const locked = readOnly || (gate && !teamPhotoReady);

  return (
    <div className={`${styles.card} ${styles.accordionCard}`}>
      <button
        className={styles.header}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
      <div className={styles.cardTop}>
        <span className={styles.title}>{category}</span>
        <span className={styles.catCount}>{doneCount}/{tasks.length}</span>
      </div>
      <div className="progress-track" aria-hidden="true">
        <span className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      </button>
      {open && (
        <div className={styles.body}>
          {pendingNote && <p className="muted small review-note">{pendingNote}</p>}
          {gate && (
            <ChecklistPhotoGate
              category={category}
              gate={gate}
              employeeId={employeeId}
              photos={photos}
              onAdd={onAddPhoto}
              onRemove={onRemovePhoto}
              photosLocked={tasks.some((t) => frequencyOf(t) === "daily" && done[t.id])}
            />
          )}
          <ul className={styles.taskList}>
            {tasks.map((t) => {
              const ts = done[t.id];
              return (
                <li key={t.id} className={`${styles.task}${ts ? ` ${styles.done}` : ""}${locked && !ts ? ` ${styles.locked}` : ""}`}>
                  <button
                    className={styles.check}
                    aria-label={
                      ts
                        ? "Completed"
                        : readOnly
                          ? pendingNote || "Awaiting reviewer"
                          : locked
                            ? `Upload ${gate.label} photo first`
                            : "Mark done"
                    }
                    disabled={!!ts || locked}
                    onClick={() => {
                      if (readOnly) return;
                      const result = toggleTask(employeeId, t.id);
                      if (result && !result.ok) window.alert(result.error);
                    }}
                  >
                    {ts ? "✓" : ""}
                  </button>
                  <div className={styles.taskBody}>
                    <span className={styles.name}>{t.name}</span>
                    {ts && (
                      <span className={styles.time}>
                        done at{" "}
                        {new Date(ts).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function ChecklistPhotoGate({ category, gate, employeeId, photos, onAdd, onRemove, photosLocked }) {
  const remaining = gate.max - photos.length;
  const caption = category;

  async function onFile(e) {
    const files = [...(e.target.files || [])].slice(0, remaining);
    e.target.value = "";
    for (const file of files) {
      try {
        const dataUrl = await readImageAsDataUrl(file);
        const result = onAdd(employeeId, category, dataUrl);
        if (result && !result.ok) {
          window.alert(result.error);
          break;
        }
      } catch {
        window.alert("Could not read that photo. Try another image.");
        break;
      }
    }
  }

  return (
    <div className={styles.gate}>
      <p className="muted small">{gate.hint}</p>
      {photos.length > 0 && (
        <div className={styles.photoGrid}>
          {photos.map((src, i) => (
            <div key={`${i}-${src.slice(-12)}`} className={styles.photoSlot}>
              <IssuePhoto src={src} caption={`${caption} ${i + 1}`} />
              {!photosLocked && (
                <button
                  type="button"
                  className={`btn-delete ${styles.photoRemove}`}
                  onClick={() => {
                    const result = onRemove(employeeId, category, i);
                    if (result && !result.ok) window.alert(result.error);
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {remaining > 0 && (
        <label className="field">
          <span>
            Add {gate.label} photo ({photos.length}/{gate.max}
            {gate.min > 1 ? `, min ${gate.min}` : ""})
          </span>
          <input type="file" accept="image/*" capture="environment" multiple onChange={onFile} />
        </label>
      )}
    </div>
  );
}

function readImageAsDataUrl(file, maxW = 1600, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / Math.max(img.width, 1));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function slug(s) {
  return s.toLowerCase().replace(/\s+/g, "-");
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function IssueItem({ issue, isCM, isManager, onUpdateProgress, onStatusChange, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(issue.status);
  const [progressNote, setProgressNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const i = issue;
  const canEdit = isManager || isCM;
  const history = i.progressHistory || [];
  const isOverdue = i.status !== "Resolved" && (i.escalationSent || Date.now() - new Date(i.createdAt).getTime() >= 259200000);

  async function handleSaveProgress() {
    setSubmitting(true);
    await onUpdateProgress(i.id, { status: selectedStatus, progressNote: progressNote.trim() || undefined });
    setProgressNote("");
    setSubmitting(false);
    setShowModal(false);
  }

  return (
    <>
      <li className={`issue-item issue-${slug(i.status)}`} style={isOverdue ? { borderLeft: "3.5px solid var(--warn, #f59e0b)" } : undefined}>
        <div className="issue-top">
          <span className="muted small">{i.location}</span>
          <span className={`tag tag-${slug(i.category)}`}>{i.category}</span>
          <span className="muted small right">{new Date(i.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        {isOverdue && <div className={styles.escalationBadge}>🚨 Escalated (3+ Days Unresolved)</div>}
        <p className="issue-desc">{i.notes || i.description}</p>
        {i.photo && <IssuePhoto src={i.photo} caption={`${i.category} · ${i.location}`} />}
        {i.progressNote && (
          <div className={styles.progressLast}>
            <span className="muted small">Last update: <strong>{i.progressUpdatedBy}</strong> ({i.progressUpdatedByRole})</span>
            <p className={styles.progressText}>[{i.status}] {i.progressNote}</p>
          </div>
        )}
        {history.length > 0 && (
          <details className={styles.historyBlock}>
            <summary className="muted small">Progress History ({history.length})</summary>
            <ul className={styles.historyList}>
              {history.map((h) => (
                <li key={h.id} className={styles.historyItem}>
                  <div className={styles.historyMeta}>
                    <span className="muted small">{h.updatedByName} {h.updatedByRole ? `(${h.updatedByRole})` : ""}</span>
                    <span className="muted small">{formatTimeAgo(h.updatedAt)}</span>
                  </div>
                  <p className={styles.historyNote}><strong style={{ color: "var(--brand)" }}>[{h.status}]</strong> {h.note}</p>
                </li>
              ))}
            </ul>
          </details>
        )}
        <div className="issue-foot">
          <label className="issue-status-set">
            <span className="muted small">Status</span>
            <select value={i.status} onChange={(e) => onStatusChange(i.id, e.target.value)}>
              {ISSUE_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </label>
          {canEdit && (
            <button type="button" className={styles.progressBtn} onClick={() => { setSelectedStatus(i.status); setProgressNote(""); setShowModal(true); }}>
              ✏️ {i.progressNote ? "Update Progress" : "Add Note"}
            </button>
          )}
          {onDelete && (
            <button type="button" className="btn-delete" onClick={() => { if (window.confirm("Delete this issue?")) onDelete(i.id); }}>Delete</button>
          )}
        </div>
      </li>
      {showModal && (
        <div className="modal-wrap" role="dialog" aria-modal="true" aria-label="Update issue progress">
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
              <div className={styles.progressPills}>
                {ISSUE_STATUSES.map((s) => (
                  <button key={s} type="button" className={`chip-filter ${selectedStatus === s ? "active" : ""}`} onClick={() => setSelectedStatus(s)}>{s}</button>
                ))}
              </div>
            </div>
            <label className="field">
              <span>Progress Note</span>
              <textarea rows={3} value={progressNote} onChange={(e) => setProgressNote(e.target.value)} placeholder="Describe what was done, next steps…" />
            </label>
            {history.length > 0 && (
              <div className={styles.modalHistory}>
                <span className="muted small" style={{ fontWeight: 700 }}>Previous Updates</span>
                {history.slice(-5).reverse().map((h) => (
                  <div key={h.id} className={styles.historyItem}>
                    <div className={styles.historyMeta}>
                      <span className="muted small">{h.updatedByName} ({h.updatedByRole})</span>
                      <span className="muted small">{formatTimeAgo(h.updatedAt)}</span>
                    </div>
                    <p className={styles.historyNote}><strong style={{ color: "var(--brand)" }}>[{h.status}]</strong> {h.note}</p>
                  </div>
                ))}
              </div>
            )}
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
