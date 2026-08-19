# Daily reminders + evening summary email

Date: 2026-08-19

## Goal

In-app reminders for employees around the daily-task deadline. One HTML summary email in the evening to ops inboxes. Times live in env so they can be moved for testing.

## Decisions

- No SMS. No per-employee email.
- In-app banners for `role === "employee"` only.
- Evening mail to `SUMMARY_TO` (default `paawanpurdhani@gmail.com` and `dnegicomptech@gmail.com`).
- From Gmail SMTP (`SMTP_USER` / `SMTP_PASS` in `.env.local`, never git).
- Fire only if a signed-in tab is open. Data is that browser’s localStorage.
- “On time” = every **daily** task complete with tick timestamp at or before `NEXT_PUBLIC_NOTIFY_DEADLINE` in `NEXT_PUBLIC_TZ`.
- Times configurable via env (restart `next dev` after change).

## Env

| Name | Default | Who reads |
|------|---------|-----------|
| `NEXT_PUBLIC_TZ` | `Asia/Kolkata` | client |
| `NEXT_PUBLIC_NOTIFY_NOON` | `12:00` | client — “30 min left” |
| `NEXT_PUBLIC_NOTIFY_DEADLINE` | `12:30` | client — still incomplete |
| `NEXT_PUBLIC_SUMMARY_AT` | `18:00` | client — POST snapshot |
| `SMTP_USER` | — | server |
| `SMTP_PASS` | — | server |
| `SUMMARY_TO` | the two inboxes above | server |

Format for times: `HH:mm` 24h.

## Client

`TaskReminder` + 15s clock check.

- After noon, before deadline: banner if any **daily** task still open. Once per IST date (`noon`).
- At/after deadline: stronger banner if still open. Once per date (`deadline`). Deadline banner wins if both would apply.
- At/after summary time: POST `/api/summary-email` once per IST date.

Dismiss hides until next day.

## API

`POST /api/summary-email` with `{ date, rows[] }`. nodemailer Gmail. HTML table: CM, Property, Done, Total, Progress, On time.

## Out of scope

SMS, server-side cron without an open tab, per-user mail, storing SMTP in git.
