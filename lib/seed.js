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

export function taskById(id) {
  return TASKS.find((t) => t.id === id);
}

export function employeeById(id) {
  return EMPLOYEES.find((e) => e.id === id);
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}
