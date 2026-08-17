# Onward Workspaces — Daily Task Management & Issue Reporting

A responsive **Next.js 14** web app that replaces spreadsheet-based daily operations for Onward Workspaces. Employees mark off their assigned tasks and report issues from their phone; a manager sees live completion stats and reported issues across all locations from a single dashboard.

Built by **Comptech Enterprises**.

---

## Features

- **Role-based login** — manager accounts + individual employee accounts (hardcoded credentials for this prototype).
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

---

## Login credentials

| Role | Name | Username | Password | Centre |
|------|------|----------|----------|--------|
| **Manager** | Ops Manager | `manager` | `Manager@123` | All centres |
| **Manager** | Mannat Jain | `mannat` | `Mannat@123` | All centres |
| **Manager** | Anil Purdhani | `anil` | `Anil@123` | All centres |
| Employee | Anubhav | `anubhav` | `Anubhav@123` | Okhla Phase 2 |
| Employee | Arpit Tanwar | `arpit` | `Arpit@123` | Okhla Phase 3 |
| Employee | Amit | `amit` | `Amit@123` | Okhla Phase 3 |
| Employee | Mukund | `mukund` | `Mukund@123` | Okhla Phase 3 |
| Employee | Kamal Khanna | `kamal` | `Kamal@123` | Noida Sector 126 |
| Employee | Abhishek Dalal | `abhishek` | `Abhishek@123` | Udyog Vihar Phase 4 |
| Employee | Sourabh | `sourabh` | `Sourabh@123` | Udyog Vihar Phase 4 |
| Employee | Sameer | `sameer` | `Sameer@123` | Emaar Capital |
| Employee | Harish | `harish` | `Harish@123` | 151, Okhla Phase 3 |
| Employee | Akansha | `akansha` | `Akansha@123` | ECE House, Connaught Place |
| Employee | Sameer | `sameer.ece` | `Sameer@123` | ECE House, Connaught Place |

Mohan Cooperative is in the centre list with no staff login yet.

---

## Project structure

```
app/
  layout.js              # wraps the app in AppProvider
  page.js                # login gating + role-based routing
  globals.css            # responsive design system (light/dark)
  components/
    Login.jsx            # login screen
    Header.jsx           # signed-in user + logout
    EmployeeView.jsx     # Tasks / Issues tabs
    IssueForm.jsx        # report issue with optional photo
    ManagerView.jsx      # dashboard: stats, per-employee bars, issues
lib/
  credentials.json       # single source of truth for users/logins
  seed.js                # centres, tasks, assignments, auth helper
  store.jsx              # React context + localStorage + daily reset
```

## Configuration

Edit `lib/credentials.json` to change users, passwords, centres, and per-employee task assignments. Task catalogue and categories live in `lib/seed.js`. Centres live in `LOCATIONS` in `lib/seed.js`.

---

## Notes / limitations

This is a **prototype**. Passwords are hardcoded and bundled into the client, and all data lives in the browser's `localStorage`. For production you'd want server-side authentication (hashed passwords + an API route), a database, and real transactional email (e.g. Resend/Nodemailer) for issue notifications. The daily reset is triggered on load when the calendar day changes, not by a fixed-time scheduled job.

---

© Comptech Enterprises · Technology · Innovation · Integrity
