"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { employeeById, taskById, CATEGORIES } from "@/lib/seed";
import IssueForm from "./IssueForm";

export default function EmployeeView() {
  const { user, completions, issues, toggleTask } = useApp();
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
      </div>

      {tab === "tasks" ? (
        <div className="stack">
          {grouped.map(([category, tasks]) => (
            <div key={category} className="card">
              <div className="card-title">{category}</div>
              <ul className="task-list">
                {tasks.map((t) => {
                  const ts = done[t.id];
                  return (
                    <li key={t.id} className={ts ? "task done" : "task"}>
                      <button
                        className="check"
                        aria-label={ts ? "Mark not done" : "Mark done"}
                        onClick={() => toggleTask(currentEmployeeId, t.id)}
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
            </div>
          ))}
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
                  <li key={i.id} className="issue-item">
                    <div className="issue-top">
                      <span className={`tag tag-${slug(i.category)}`}>
                        {i.category}
                      </span>
                      <span className="muted small">
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
                    <span className="muted small">
                      ✉ notified {i.notifiedEmail}
                    </span>
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

function slug(s) {
  return s.toLowerCase().replace(/\s+/g, "-");
}
