"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { employeeById, taskById, CATEGORIES, ISSUE_STATUSES } from "@/lib/seed";
import IssueForm from "./IssueForm";
import VisitorForm from "./VisitorForm";
import { IssuePhoto } from "./PhotoLightbox";

export default function EmployeeView() {
  const { user, completions, issues, visitors, toggleTask, setIssueStatus } = useApp();
  const [tab, setTab] = useState("tasks");

  const currentEmployeeId = user.id;
  const employee = employeeById(currentEmployeeId) || user;
  const done = completions[currentEmployeeId] || {};

  const myTasks = employee.taskIds.map(taskById);
  const completedCount = myTasks.filter((t) => done[t.id]).length;
  const pct = myTasks.length
    ? Math.round((completedCount / myTasks.length) * 100)
    : 0;

  const grouped = useMemo(() => {
    const map = {};
    myTasks.forEach((t) => {
      (map[t.category] ||= []).push(t);
    });
    return CATEGORIES.filter((c) => map[c]).map((c) => [c, map[c]]);
  }, [myTasks]);

  const myIssues = issues.filter((i) => i.employeeId === currentEmployeeId);
  const myVisitors = visitors.filter((v) => v.employeeId === currentEmployeeId);

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Hi, {employee.name.split(" ")[0]} 👋</h1>
          <p className="muted">{employee.location} · your tasks for today</p>
        </div>
        <div className="ring" style={{ "--pct": pct }}>
          <span>{pct}%</span>
        </div>
      </div>

      <div className="tabs" role="tablist">
        <button
          role="tab"
          className={tab === "tasks" ? "active" : ""}
          onClick={() => setTab("tasks")}
        >
          Tasks
          <span className="pill">
            {completedCount}/{myTasks.length}
          </span>
        </button>
        <button
          role="tab"
          className={tab === "issues" ? "active" : ""}
          onClick={() => setTab("issues")}
        >
          Issues
          {myIssues.length > 0 && <span className="pill">{myIssues.length}</span>}
        </button>
        <button
          role="tab"
          className={tab === "visitors" ? "active" : ""}
          onClick={() => setTab("visitors")}
        >
          Value Added Services
          {myVisitors.length > 0 && <span className="pill">{myVisitors.length}</span>}
        </button>
      </div>

      {tab === "tasks" ? (
        <div className="stack">
          {grouped.map(([category, tasks]) => (
            <CategoryAccordion
              key={category}
              category={category}
              tasks={tasks}
              done={done}
              employeeId={currentEmployeeId}
              toggleTask={toggleTask}
            />
          ))}
        </div>
      ) : tab === "visitors" ? (
        <div className="stack">
          <VisitorForm employeeId={currentEmployeeId} />
          <div className="card">
            <div className="card-title">Value added services logged today</div>
            {myVisitors.length === 0 ? (
              <p className="muted empty">No entries logged yet.</p>
            ) : (
              <ul className="issue-list">
                {myVisitors.map((v) => (
                  <li key={v.id} className="issue-item">
                    <div className="issue-top">
                      <span className="muted small">{v.location}</span>
                      <span className="muted small right">
                        {new Date(v.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="issue-desc"><strong>{v.name}</strong>{v.companyName ? ` · ${v.companyName}` : ""}</p>
                    <div className="issue-foot">
                      <span className="muted small">
                        {v.phone && `${v.phone}`}{v.email && ` · ${v.email}`}
                      </span>
                      {v.amountPaid && <span className="chip chip-ok">₹{v.amountPaid}</span>}
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
          <div className="card">
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
                    <p className="issue-desc">{i.description}</p>
                    {i.photo && (
                      <IssuePhoto
                        src={i.photo}
                        caption={`${i.category} · ${i.location}`}
                      />
                    )}
                    <div className="issue-foot">
                      <span className="muted small">
                        ✉ notified {i.notifiedEmail}
                      </span>
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

function CategoryAccordion({ category, tasks, done, employeeId, toggleTask }) {
  const doneCount = tasks.filter((t) => done[t.id]).length;
  const [open, setOpen] = useState(false);

  return (
    <div className="card accordion-card">
      <button
        className="accordion-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="accordion-title">{category}</span>
        <span className="accordion-meta">
          <span className="pill">{doneCount}/{tasks.length}</span>
          <span className={`accordion-chevron${open ? " open" : ""}`}>▾</span>
        </span>
      </button>
      {open && (
        <ul className="task-list accordion-body">
          {tasks.map((t) => {
            const ts = done[t.id];
            return (
              <li key={t.id} className={ts ? "task done" : "task"}>
                <button
                  className="check"
                  aria-label={ts ? "Mark not done" : "Mark done"}
                  onClick={() => toggleTask(employeeId, t.id)}
                >
                  {ts ? "✓" : ""}
                </button>
                <div className="task-body">
                  <span className="task-name">{t.name}</span>
                  {ts && (
                    <span className="task-time">
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
      )}
    </div>
  );
}

function slug(s) {
  return s.toLowerCase().replace(/\s+/g, "-");
}
