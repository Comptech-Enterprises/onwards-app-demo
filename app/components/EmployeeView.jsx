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
  tasksForCategory,
  visibleTasks,
} from "@/lib/seed";
import IssueForm from "./IssueForm";
import VisitorForm from "./VisitorForm";
import { IssuePhoto } from "./PhotoLightbox";
import styles from "./EmployeeView.module.css";

export default function EmployeeView() {
  const { user, users, completions, reviewChecks, checklistPhotos, issues, visitors, toggleTask, addChecklistPhoto, removeChecklistPhoto, setIssueStatus, deleteIssue, deleteVisitor, view } = useApp();
  const tab = view === "issues" || view === "visitors" ? view : "tasks";
  const [reviewLocation, setReviewLocation] = useState(LOCATIONS[0]);
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState("all");

  const currentEmployeeId = user.id;
  const employee = users.find((u) => u.id === currentEmployeeId) || user;
  const reviewer = isDedicatedReviewer(employee);
  const homeLocation = employee.location && employee.location !== "All centres" ? employee.location : null;
  const activeLocation = reviewer ? reviewLocation : homeLocation;
  const siteDone = liveDoneMap(completions[currentEmployeeId] || {});

  const myTasks = useMemo(() => {
    const assigned = (employee.taskIds || []).map(taskById).filter(Boolean);
    if (reviewer) {
      return assigned.filter((t) => {
        const done = reviewDoneMap(reviewChecks, t.category, activeLocation);
        return taskIsVisible(t, done[t.id]);
      });
    }
    return visibleTasks(assigned, siteDone);
  }, [employee.taskIds, reviewer, reviewChecks, activeLocation, siteDone]);
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

  const myIssues = issues.filter((i) => i.employeeId === currentEmployeeId);
  const myVisitors = visitors.filter((v) => v.employeeId === currentEmployeeId);

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
      <div className="page-head page-head-stack">
        <div>
          <h1>Tasks</h1>
          <p className="muted">
            {reviewer
              ? `${reviewLocation} · Infra & Safety review`
              : `${employee.location} · manage your assigned work`}
          </p>
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
                    <p className="issue-desc"><strong>{v.guestName}</strong>{v.aggregator ? ` · ${v.aggregator}` : ""}</p>
                    <div className="issue-foot">
                      <span className="muted small">
                        {v.arrivalTime && `In: ${v.arrivalTime}`}{v.punchOutTime && ` · Out: ${v.punchOutTime}`}{v.seats && ` · ${v.seats} seat${v.seats > 1 ? "s" : ""}`}
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
                  <li key={i.id} className={`issue-item issue-${slug(i.status)}`}>
                    <div className="issue-top">
                      <span className="muted small">{i.location}</span>
                      <span className={`tag tag-${slug(i.category)}`}>
                        {i.category}
                      </span>
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
                        caption={`${i.category} · ${i.location}`}
                      />
                    )}
                    <div className="issue-foot">
                      <label className="issue-status-set">
                        <span className="muted small">Status</span>
                        <select
                          value={i.status}
                          onChange={(e) => setIssueStatus(i.id, e.target.value)}
                        >
                          {ISSUE_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </label>
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
  const locked = readOnly || (gate && !checklistPhotosReady(category, photos));

  return (
    <div className={`${styles.card} ${styles.accordionCard}`}>
      <button
        className={styles.header}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
      <div className={styles.cardTop}>
        <span className={styles.title}>{category}</span>
        <span className={`status-chip ${pct === 100 ? "chip-ok-tag" : "chip-pending-tag"}`}>
          {pct === 100 ? "Complete" : "Pending"}
        </span>
      </div>
      <div className={styles.cardMeta}>
        <span className="muted small">{doneCount}/{tasks.length} tasks</span>
        <span className={`muted small ${styles.details}`}>View details</span>
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
