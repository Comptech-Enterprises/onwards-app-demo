export function notifyConfig() {
  return {
    timeZone: process.env.NEXT_PUBLIC_TZ || "Asia/Kolkata",
    noon: process.env.NEXT_PUBLIC_NOTIFY_NOON || "12:00",
    deadline: process.env.NEXT_PUBLIC_NOTIFY_DEADLINE || "12:30",
    summaryAt: process.env.NEXT_PUBLIC_SUMMARY_AT || "18:00",
  };
}

export function parseHm(value) {
  const match = String(value || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return 0;
  const hour = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2])));
  return hour * 60 + minute;
}

export function zonedClock(date = new Date(), timeZone = notifyConfig().timeZone) {
  const parts = {};
  for (const { type, value } of new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)) {
    if (type !== "literal") parts[type] = value;
  }
  const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  return { dateKey, minutes, hour: Number(parts.hour), minute: Number(parts.minute) };
}

export function completedByDeadline(iso, deadlineHm, timeZone, now = new Date()) {
  if (!iso) return false;
  const tick = new Date(iso);
  if (Number.isNaN(tick.getTime())) return false;
  const nowZ = zonedClock(now, timeZone);
  const tickZ = zonedClock(tick, timeZone);
  if (tickZ.dateKey !== nowZ.dateKey) return false;
  return tickZ.minutes <= parseHm(deadlineHm);
}
