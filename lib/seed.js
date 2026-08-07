// Static configuration for Onward Workspaces.
// In the real system this is set up once and rarely changes.

import USERS from "./credentials.json";

// Operating units.
export const LOCATIONS = ["Noida", "Gurgaon", "Okhla"];

export const OPS_EMAIL = "operations@onwardworkspaces.com";

// The daily task catalogue, grouped by category.
export const TASKS = [
  { id: "t1", category: "Bathroom", name: "Clean toilets & urinals" },
  { id: "t2", category: "Bathroom", name: "Restock soap & tissue" },
  { id: "t3", category: "Bathroom", name: "Mop bathroom floors" },
  { id: "t4", category: "Kitchen", name: "Wipe down counters" },
  { id: "t5", category: "Kitchen", name: "Empty & reline bins" },
  { id: "t6", category: "Kitchen", name: "Refill coffee & supplies" },
  { id: "t7", category: "Common Areas", name: "Vacuum floors" },
  { id: "t8", category: "Common Areas", name: "Sanitize desks & tables" },
  { id: "t9", category: "Common Areas", name: "Water the plants" },
  { id: "t10", category: "Reception", name: "Tidy lobby & seating" },
  { id: "t11", category: "Reception", name: "Check & sort mail" },
];

export const CATEGORIES = ["Bathroom", "Kitchen", "Common Areas", "Reception"];

// An issue starts unattended and is moved along by the manager.
export const ISSUE_STATUSES = ["Unattended", "In progress", "Resolved"];
export const DEFAULT_STATUS = ISSUE_STATUSES[0];

// Single source of truth: users come from credentials.json.
export const ALL_USERS = USERS;
export const EMPLOYEES = USERS.filter((u) => u.role === "employee");
export const MANAGER = USERS.find((u) => u.role === "manager");

export function authenticate(username, password) {
  const u = username.trim().toLowerCase();
  const found = USERS.find(
    (x) => x.username.toLowerCase() === u && x.password === password
  );
  if (!found) return null;
  // Never expose the password beyond the check.
  const { password: _pw, ...safe } = found;
  return safe;
}

// Stand-in "photo" for the demo data — a real report carries a camera JPEG.
const DEMO_PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640">
      <rect width="960" height="640" fill="#123a63"/>
      <rect x="60" y="60" width="840" height="520" rx="18" fill="#0d2b4a" stroke="#2f6df4" stroke-width="3"/>
      <text x="480" y="300" fill="#e8eef7" font-family="sans-serif" font-size="44" text-anchor="middle">Sample photo</text>
      <text x="480" y="360" fill="#8ea6c4" font-family="sans-serif" font-size="26" text-anchor="middle">attached by the reporter</text>
    </svg>`
  );

// Demo issues so the manager's Issues tab isn't empty on a fresh day.
// Times are given as hours-ago so they always read as "today".
const DEMO_ISSUES = [
  {
    employeeId: "e1",
    location: "Noida",
    category: "Bathroom",
    description: "Second-floor urinal is leaking, floor stays wet all morning.",
    hoursAgo: 1,
    photo: DEMO_PHOTO,
  },
  {
    employeeId: "e2",
    location: "Noida",
    category: "Kitchen",
    description: "Coffee machine keeps showing a descale warning and won't brew.",
    hoursAgo: 3,
    status: "In progress",
  },
  {
    employeeId: "e3",
    location: "Gurgaon",
    category: "Common Areas",
    description: "Vacuum cleaner belt snapped — carpets by the pods not done.",
    hoursAgo: 2,
    photo: DEMO_PHOTO,
  },
  {
    employeeId: "e4",
    location: "Gurgaon",
    category: "Reception",
    description: "Lobby couch has a large stain, needs deep cleaning.",
    hoursAgo: 5,
    status: "Resolved",
  },
  {
    employeeId: "e5",
    location: "Okhla",
    category: "Bathroom",
    description: "Out of hand soap refills in both washrooms since yesterday.",
    hoursAgo: 4,
    status: "In progress",
  },
  {
    employeeId: "e6",
    location: "Okhla",
    category: "Common Areas",
    description: "Plants near the window are drying out, tap on that side is dry.",
    hoursAgo: 6,
  },
];

// Built fresh each call so the timestamps track the current day.
export function demoIssues() {
  const now = Date.now();
  return DEMO_ISSUES.map((d, idx) => {
    const emp = EMPLOYEES.find((e) => e.id === d.employeeId);
    return {
      id: `demo-${idx}`,
      employeeId: d.employeeId,
      employeeName: emp?.name || "Unknown",
      location: d.location,
      category: d.category,
      description: d.description,
      photo: d.photo || null,
      status: d.status || DEFAULT_STATUS,
      createdAt: new Date(now - d.hoursAgo * 3600 * 1000).toISOString(),
      notifiedEmail: OPS_EMAIL,
    };
    // newest first, matching how addIssue prepends
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function taskById(id) {
  return TASKS.find((t) => t.id === id);
}

export function employeeById(id) {
  return EMPLOYEES.find((e) => e.id === id);
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}
