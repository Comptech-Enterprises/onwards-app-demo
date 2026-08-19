"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { employeeOpenDaily, summaryRows } from "@/lib/employeeDaily";
import { notifyConfig, parseHm, zonedClock } from "@/lib/notifyConfig";

const FLAG_KEY = "onward-notify-flags-v1";

function loadFlags(dateKey) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(FLAG_KEY) || "{}");
    if (parsed.dateKey !== dateKey) return { dateKey, noon: false, deadline: false, summary: false };
    return {
      dateKey,
      noon: !!parsed.noon,
      deadline: !!parsed.deadline,
      summary: !!parsed.summary,
    };
  } catch {
    return { dateKey, noon: false, deadline: false, summary: false };
  }
}

function saveFlags(flags) {
  window.localStorage.setItem(FLAG_KEY, JSON.stringify(flags));
}

export default function TaskReminder() {
  const { user, employees, completions, reviewChecks, addAlert } = useApp();

  useEffect(() => {
    if (!user) return undefined;

    async function tick() {
      const cfg = notifyConfig();
      const clock = zonedClock(new Date(), cfg.timeZone);
      const noonM = parseHm(cfg.noon);
      const deadlineM = parseHm(cfg.deadline);
      const summaryM = parseHm(cfg.summaryAt);
      const flags = loadFlags(clock.dateKey);
      const open =
        user.role === "employee" &&
        employeeOpenDaily(user, completions, reviewChecks);

      if (!flags.summary && clock.minutes >= summaryM) {
        flags.summary = true;
        saveFlags(flags);
        try {
          const res = await fetch("/api/summary-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: clock.dateKey,
              rows: summaryRows(employees, completions, reviewChecks),
            }),
          });
          if (!res.ok) {
            flags.summary = false;
            saveFlags(flags);
          }
        } catch {
          flags.summary = false;
          saveFlags(flags);
        }
      }

      if (user.role !== "employee" || !open) return;

      if (clock.minutes >= deadlineM && !flags.deadline) {
        flags.deadline = true;
        saveFlags(flags);
        addAlert({
          id: `deadline-${clock.dateKey}`,
          kind: "deadline",
          title: "Daily tasks still incomplete",
          body: `Deadline was ${cfg.deadline}. Finish remaining daily tasks.`,
          createdAt: new Date().toISOString(),
          read: false,
        });
        return;
      }

      if (clock.minutes >= noonM && clock.minutes < deadlineM && !flags.noon) {
        flags.noon = true;
        saveFlags(flags);
        addAlert({
          id: `noon-${clock.dateKey}`,
          kind: "noon",
          title: "30 minutes left for daily tasks",
          body: `Deadline ${cfg.deadline}.`,
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
    }

    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, [user, employees, completions, reviewChecks, addAlert]);

  return null;
}
