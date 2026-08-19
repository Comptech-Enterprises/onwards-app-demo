import {
  CATEGORY_REVIEWERS,
  LOCATIONS,
  REVIEW_CATEGORIES,
  frequencyOf,
  isDedicatedReviewer,
  liveDoneMap,
  reviewDoneMap,
  taskById,
  tasksForCategory,
  visibleTasks,
} from "./seed";
import { completedByDeadline, notifyConfig } from "./notifyConfig";

function ownerCats(employee) {
  return REVIEW_CATEGORIES.filter((category) => {
    const owner = CATEGORY_REVIEWERS[category];
    return (
      (employee.username || "").toLowerCase() === owner.username.toLowerCase() ||
      (employee.name || "").toLowerCase() === owner.name.toLowerCase()
    );
  });
}

function dailyOf(tasks) {
  return (tasks || []).filter((t) => frequencyOf(t) === "daily");
}

function tally(tasks, doneMap, deadlineHm, timeZone, now) {
  let done = 0;
  let onTime = true;
  for (const task of tasks) {
    const iso = doneMap[task.id];
    if (!iso) {
      onTime = false;
      continue;
    }
    done += 1;
    if (!completedByDeadline(iso, deadlineHm, timeZone, now)) onTime = false;
  }
  if (tasks.length === 0) onTime = false;
  const total = tasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { done, total, pct, onTime, openDaily: done < total };
}

export function employeeDailyRow(employee, completions, reviewChecks, now = new Date()) {
  const { deadline, timeZone } = notifyConfig();
  if (isDedicatedReviewer(employee)) {
    const tasks = [];
    const doneMap = {};
    for (const loc of LOCATIONS) {
      for (const cat of ownerCats(employee)) {
        const locDone = reviewDoneMap(reviewChecks, cat, loc);
        const visible = dailyOf(visibleTasks(tasksForCategory(cat), locDone, now));
        for (const task of visible) {
          const key = `${loc}:${task.id}`;
          tasks.push({ id: key });
          if (locDone[task.id]) doneMap[key] = locDone[task.id];
        }
      }
    }
    const stats = tally(tasks, doneMap, deadline, timeZone, now);
    return {
      name: employee.name,
      location: employee.location || "All centres",
      ...stats,
    };
  }

  const assigned = dailyOf(
    visibleTasks(
      (employee.taskIds || []).map(taskById).filter(Boolean),
      liveDoneMap(completions[employee.id] || {}, now),
      now
    )
  );
  const doneMap = liveDoneMap(completions[employee.id] || {}, now);
  const stats = tally(assigned, doneMap, deadline, timeZone, now);
  return {
    name: employee.name,
    location: employee.location || "—",
    ...stats,
  };
}

export function employeeOpenDaily(employee, completions, reviewChecks, now = new Date()) {
  return employeeDailyRow(employee, completions, reviewChecks, now).openDaily;
}

export function summaryRows(employees, completions, reviewChecks, now = new Date()) {
  return (employees || [])
    .filter((u) => u.role === "employee")
    .map((u) => employeeDailyRow(u, completions, reviewChecks, now));
}
