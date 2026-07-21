# Onward Workspaces — Daily Task Management & Issue Reporting

A responsive **Next.js 14** web app that replaces spreadsheet-based daily operations for Onward Workspaces. Employees mark off their assigned tasks and report issues from their phone; a manager sees live completion stats and reported issues across all locations from a single dashboard.

Built by **Comptech Enterprises**.

---

## Features

- **Role-based login** — one manager account + individual employee accounts (hardcoded credentials for this prototype).
- **Employee view**
  - **Tasks tab** — only your own tasks for the day, grouped by category, tap to complete (records the time), with a live completion ring.
  - **Issues tab** — report an issue with category, description, and an optional photo; simulates an email to central operations, then lists your reported issues.
- **Manager dashboard**
  - Stat tiles: overall completion %, tasks done, employees on track, open issues.
  - Completion **per employee** with progress bars and percentages.
  - **Issues panel inline** in the dashboard (location, description, reporter, time, photo).
  - All-employees table showing each person's done vs. pending tasks (collapses to cards on mobile).
- **Daily auto-reset** — both task completions and issues clear on a new calendar day.
- **localStorage persistence** — all state is stored client-side; no backend required.
- **Credentials Excel** — a generated `.xlsx` of all logins, downloadable from the login screen.
- Fully responsive, light/dark aware.

---

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Other scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run gen:creds` | Regenerate `public/credentials.xlsx` from `lib/credentials.json` |

---

## Login credentials

| Role | Username | Password |
|------|----------|----------|
| **Manager** | `manager` | `Manager@123` |
| Amit Sharma | `amit` | `Amit@123` |
| Priya Nair | `priya` | `Priya@123` |
| Rahul Verma | `rahul` | `Rahul@123` |
| Sara Khan | `sara` | `Sara@123` |
| John Dsouza | `john` | `John@123` |
| Meera Iyer | `meera` | `Meera@123` |

The full list is also downloadable as an Excel sheet from the login screen.

---

## Project structure

```
app/
  layout.js              # wraps the app in AppProvider
  page.js                # login gating + role-based routing
  globals.css            # responsive design system (light/dark)
  components/
    Login.jsx            # login screen + credentials download
    Header.jsx           # signed-in user + logout
    EmployeeView.jsx     # Tasks / Issues tabs
    IssueForm.jsx        # report issue with optional photo
    ManagerView.jsx      # dashboard: stats, per-employee bars, issues
lib/
  credentials.json       # single source of truth for users/logins
  seed.js                # locations, tasks, assignments, auth helper
  store.jsx              # React context + localStorage + daily reset
scripts/
  gen-credentials.mjs    # builds public/credentials.xlsx
public/
  credentials.xlsx       # generated credentials sheet
```

## Configuration

Edit `lib/credentials.json` to change users, passwords, locations, and per-employee task assignments, then run `npm run gen:creds` to refresh the Excel sheet. Task catalogue and categories live in `lib/seed.js`.

---

## Notes / limitations

This is a **prototype**. Passwords are hardcoded and bundled into the client, and all data lives in the browser's `localStorage`. For production you'd want server-side authentication (hashed passwords + an API route), a database, and real transactional email (e.g. Resend/Nodemailer) for issue notifications. The daily reset is triggered on load when the calendar day changes, not by a fixed-time scheduled job.

---

© Comptech Enterprises · Technology · Innovation · Integrity
