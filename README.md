# Onward Workspaces — Daily Operations & Task Management

A responsive **Next.js 14** web app for Onward Workspaces daily operations. Employees complete tasks, report issues, log visitors, and submit purchase bills from their phone; managers get a live dashboard with completion stats, issue tracking, billing oversight, and CM scoring across all centres.

Connected to a **live backend** with real-time WebSocket sync, JWT auth, and Cloudflare R2 photo storage.

Built by **Comptech Enterprises**.

---

## Features

### Employee View
- **Tasks** — daily checklist grouped by category, tap to complete with timestamp and live completion ring.
- **Team** — view team members and their progress at your centre.
- **Issues** — report issues with category, description, and optional photo; email sent to central ops.
- **Bills & Purchases** — submit purchase bills with item name, remark, amount, and multi-page receipt photos.
- **VAS (Visitor & Service)** — log visitor entries with details.
- **Alerts** — real-time notifications for task updates and issues.

### Manager Dashboard
- **Home** — stat tiles (completion %, tasks done, on-track count), per-employee progress bars sorted A–Z.
- **Scores** — CM scoring overview with cluster manager hierarchy.
- **Issues** — all issues across centres with status filters (Unattended / In progress / Resolved), location chips, and search.
- **Bills & Purchases** — review bills submitted across all centres with location filter, date range filter (Today / This week / This month / Last month / Custom), search, receipt viewer with multi-page navigation, and delete capability.
- **VAS** — visitor logs across centres.
- **CM** — centre manager view with team breakdowns.

### Shared
- **Role-based routing** — manager, CM, and employee views with appropriate permissions.
- **Real-time sync** — WebSocket connection for live task completions and bill updates.
- **Responsive design** — works on phone, tablet, and desktop with glassmorphic UI.
- **Photo lightbox** — full-screen image viewer with multi-page navigation (← →).

---

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (default: `https://app.onwardworkspaces.com/api`) |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL (default: `wss://app.onwardworkspaces.com/ws`) |

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |

---

## Project structure

```
app/
  layout.js                # wraps the app in AppProvider
  page.js                  # login gating + role-based view routing
  globals.css              # responsive design system (light/dark, glassmorphic)
  components/
    Login.jsx              # login screen
    Header.jsx             # logo, date/time, user greeting
    BottomNav.jsx           # bottom navigation with role-based tabs
    EmployeeView.jsx       # Tasks / Issues / VAS tabs
    ManagerView.jsx        # dashboard: stats, employee progress, issues, VAS
    BillsView.jsx          # Bills & Purchases: list, filters, add modal, receipt viewer
    CmView.jsx             # CM scoring and team breakdown
    TeamView.jsx           # team member progress view
    AlertsView.jsx         # notifications list
    ProfileView.jsx        # user profile
    IssueForm.jsx          # report issue with optional photo
    VisitorForm.jsx        # log visitor entry
    PhotoLightbox.jsx      # single + multi-image lightbox viewer
    TaskReminder.jsx       # pending task reminder banner
lib/
  api.js                   # API client with JWT auth
  credentials.json         # user seed data
  seed.js                  # centres, tasks, assignments, categories
  store.jsx                # React context, API integration, WebSocket sync
```

---

## Configuration

- **Users & credentials**: `lib/credentials.json`
- **Task catalogue & categories**: `lib/seed.js`
- **Centres / locations**: `LOCATIONS` in `lib/seed.js`

---

© Comptech Enterprises · Technology · Innovation · Integrity
