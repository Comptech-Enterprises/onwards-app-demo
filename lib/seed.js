// Static configuration for Onward Workspaces.
// In the real system this is set up once and rarely changes.

import USERS from "./credentials.json";

// Operating units.
export const LOCATIONS = ["Noida", "Gurgaon", "Okhla"];

export const OPS_EMAIL = "operations@onwardworkspaces.com";

// The daily task catalogue, grouped by category.
export const TASKS = [
  { id: "t1", category: "Washroom", name: "WC / toilet pan clean, stain-free & odour-free — flush tested, no blockage" },
  { id: "t2", category: "Washroom", name: "Toilet seat & lid clean on both sides" },
  { id: "t3", category: "Washroom", name: "No blockage in WC drain" },
  { id: "t4", category: "Washroom", name: "Toilet roll holder has sufficient paper — replace if below 30%" },
  { id: "t5", category: "Washroom", name: "Health faucet functional — no leakage" },
  { id: "t6", category: "Washroom", name: "Urinal (male WC) — sensor functional & clean — N/A for female WC" },
  { id: "t7", category: "Washroom", name: "Dustbin placed at end of WC cabin (not blocking door)" },
  { id: "t8", category: "Washroom", name: "Floor mopped — dry, no water puddles" },
  { id: "t9", category: "Washroom", name: "Floor tiles clean — no stains, debris or marks" },
  { id: "t10", category: "Washroom", name: "Walls clean — no stains, marks or graffiti" },
  { id: "t11", category: "Washroom", name: "Ceiling — no cobwebs, no seepage/dampness visible" },
  { id: "t12", category: "Washroom", name: "Skirting tiles clean and aligned" },
  { id: "t13", category: "Washroom", name: "Wash basins clean and dry after use" },
  { id: "t14", category: "Washroom", name: "Taps functional — no dripping or leakage" },
  { id: "t15", category: "Washroom", name: "Mirror clean, streak-free and uncracked" },
  { id: "t16", category: "Washroom", name: "Soap dispenser filled & functional — refill if less than 25%" },
  { id: "t17", category: "Washroom", name: "Plumbing fittings — no visible leakage under sink" },
  { id: "t18", category: "Washroom", name: "All lights functional (no flickering or dead bulbs)" },
  { id: "t19", category: "Washroom", name: "Exhaust fan/vent operational — no foul smell" },
  { id: "t20", category: "Washroom", name: "Air freshener dispenser working and filled" },
  { id: "t21", category: "Washroom", name: "Dustbin: clean liner fitted, less than 50% full, odour-free" },
  { id: "t22", category: "Washroom", name: "Doors & locks functional — latches working" },
  { id: "t23", category: "Washroom", name: "Washroom signage (Male/Female) in place" },
  { id: "t24", category: "Pantry", name: "Floor clean, mopped and dry — no spills" },
  { id: "t25", category: "Pantry", name: "Countertops and surfaces clean, non-sticky, odour-free" },
  { id: "t26", category: "Pantry", name: "Walls clean — no stains or marks" },
  { id: "t27", category: "Pantry", name: "Sink clean and drain clear — no food residue" },
  { id: "t28", category: "Pantry", name: "Taps functional — no dripping or leakage" },
  { id: "t29", category: "Pantry", name: "Soap dispenser at sink filled and functional" },
  { id: "t30", category: "Pantry", name: "Coffee/Tea machine clean — no spillage underneath (dry)" },
  { id: "t31", category: "Pantry", name: "Coffee/Tea machine stocked — pods/bags/sachets available" },
  { id: "t32", category: "Pantry", name: "Mugs/cups clean, sanitised and neatly stacked" },
  { id: "t33", category: "Pantry", name: "Microwave clean inside — no food residue or odour" },
  { id: "t34", category: "Pantry", name: "Refrigerator clean — no spills, no expired items — check expiry dates daily" },
  { id: "t35", category: "Pantry", name: "Water dispenser area clean — standard mat in place (18in front, 3in sides)" },
  { id: "t36", category: "Pantry", name: "Water dispenser functional — hot/cold working" },
  { id: "t37", category: "Pantry", name: "Cutlery, crockery, glassware clean, sanitised and ready" },
  { id: "t38", category: "Pantry", name: "Tea/coffee/sugar/creamer supplies stocked — reorder below 20% stock" },
  { id: "t39", category: "Pantry", name: "Napkins/tissues available" },
  { id: "t40", category: "Pantry", name: "Dustbin has clean liner, less than 50% full, odour-free" },
  { id: "t41", category: "Pantry", name: "All lights functional" },
  { id: "t42", category: "Pantry", name: "No cleaning linen/cloth visible to members — stored out of sight" },
  { id: "t43", category: "Pantry", name: "Cleaning chemicals stored correctly — correct dilution" },
  { id: "t44", category: "Pantry", name: "No foul/food smell in pantry area" },
  { id: "t45", category: "Pantry", name: "Storage areas (shelves/cabinets) dirt-free and organised" },
  { id: "t46", category: "Common Areas", name: "Entrance facade clean — signage maintained, painted, no damage" },
  { id: "t47", category: "Common Areas", name: "Glass doors/windows at entrance clean and streak-free" },
  { id: "t48", category: "Common Areas", name: "Reception desk clean and organised" },
  { id: "t49", category: "Common Areas", name: "Floor mat at entrance clean and in position" },
  { id: "t50", category: "Common Areas", name: "Lobby floor clean, dry-mopped" },
  { id: "t51", category: "Common Areas", name: "All furniture clean and symmetrically arranged" },
  { id: "t52", category: "Common Areas", name: "Eating/dining area tables cleaned after every use — immediate clean after member use" },
  { id: "t53", category: "Common Areas", name: "Collab area organised — no personal items left behind" },
  { id: "t54", category: "Common Areas", name: "Dustbins clean, liner fitted, less than 50% full" },
  { id: "t55", category: "Common Areas", name: "No foul smell across centre" },
  { id: "t56", category: "Common Areas", name: "Corridor floor wet & dry mopped — every hour or as required" },
  { id: "t57", category: "Common Areas", name: "Floor surface maintained — no stripping, fading or misalignment" },
  { id: "t58", category: "Common Areas", name: "Skirting clean and aligned throughout centre" },
  { id: "t59", category: "Common Areas", name: "No cluttered/loose wiring on floors or ceilings" },
  { id: "t60", category: "Common Areas", name: "All glass surfaces clean, crack-free, handles intact" },
  { id: "t61", category: "Common Areas", name: "Televisions/screens clean and dust-free" },
  { id: "t62", category: "Common Areas", name: "Fire extinguishers clean, sealed and in place" },
  { id: "t63", category: "Common Areas", name: "Lights in all common areas functional" },
  { id: "t64", category: "Common Areas", name: "Pesto Flash (insect catcher) clean and operational" },
  { id: "t65", category: "Common Areas", name: "Blinds clean and functional in all areas" },
  { id: "t66", category: "Common Areas", name: "Walls and ceilings — no stains, cracks, tape marks, open fittings" },
  { id: "t67", category: "Common Areas", name: "Water dispenser has standard mat — 18in front, 3in sides" },
  { id: "t68", category: "Infra & Safety", name: "No loose or exposed wiring anywhere in centre — immediate escalation required" },
  { id: "t69", category: "Infra & Safety", name: "All switchboards clean, covers intact, no loose fittings" },
  { id: "t70", category: "Infra & Safety", name: "All light fixtures clean and dust-free" },
  { id: "t71", category: "Infra & Safety", name: "No flickering or dead bulbs in any area — log and replace same day" },
  { id: "t72", category: "Infra & Safety", name: "Junction boxes closed and properly fitted" },
  { id: "t73", category: "Infra & Safety", name: "Fire extinguishers in designated spots — seal intact" },
  { id: "t74", category: "Infra & Safety", name: "Emergency exit signage illuminated and unobstructed" },
  { id: "t75", category: "Infra & Safety", name: "No items blocking fire exits or emergency pathways" },
  { id: "t76", category: "Infra & Safety", name: "Smoke detectors visible — no physical damage" },
  { id: "t77", category: "Infra & Safety", name: "No pest sightings (cockroaches, rodents, ants) — log any sighting immediately" },
  { id: "t78", category: "Infra & Safety", name: "Pesto Flash (insect catcher) clean and light working" },
  { id: "t79", category: "Infra & Safety", name: "No standing water or food waste attracting pests" },
  { id: "t80", category: "Infra & Safety", name: "No seepage or damp patches on walls or ceilings" },
  { id: "t81", category: "Infra & Safety", name: "No water leakage from pipes, taps or fittings" },
  { id: "t82", category: "Infra & Safety", name: "No blockage in drains (washroom, pantry)" },
  { id: "t83", category: "Infra & Safety", name: "False ceiling grids intact — no water stains or cracks" },
  { id: "t84", category: "Infra & Safety", name: "Water dispenser drip tray clean and dry" },
  { id: "t85", category: "Soft Services", name: "Plants have clean, fresh-looking leaves (no yellowing/dead leaves)" },
  { id: "t86", category: "Soft Services", name: "Plants adequately watered — soil not dry or waterlogged" },
  { id: "t87", category: "Soft Services", name: "Plant pots clean — no dirt spillage around base" },
  { id: "t88", category: "Soft Services", name: "Decorative items / artwork clean and dust-free" },
  { id: "t89", category: "Soft Services", name: "All care staff in proper uniform — clean and presentable" },
  { id: "t90", category: "Soft Services", name: "Staff grooming standards met — hair, nails, hygiene" },
  { id: "t91", category: "Soft Services", name: "Staff are knowledgeable — know current task assignments" },
  { id: "t92", category: "Soft Services", name: "Cleaning linen/mops stored correctly — not visible to members" },
  { id: "t93", category: "Soft Services", name: "Cleaning chemicals diluted as per SOP — correct ratios" },
  { id: "t94", category: "Soft Services", name: "Chemical storage area clean, labelled, locked if required" },
  { id: "t95", category: "Soft Services", name: "Correct cleaning tools used for correct surfaces" },
  { id: "t96", category: "Soft Services", name: "Housekeeping log/register updated for the day" },
  { id: "t97", category: "Soft Services", name: "All dustbins emptied before reaching full" },
  { id: "t98", category: "Soft Services", name: "Dustbins clean, odour-free, swing flaps working" },
  { id: "t99", category: "Soft Services", name: "Segregated waste (if applicable) properly sorted" },
  { id: "t100", category: "Soft Services", name: "No waste bags/black bags visible in common areas" },
];

export const CATEGORIES = ["Washroom", "Pantry", "Common Areas", "Infra & Safety", "Soft Services"];

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
    category: "Washroom",
    description: "Second-floor urinal is leaking, floor stays wet all morning.",
    hoursAgo: 1,
    photo: DEMO_PHOTO,
  },
  {
    employeeId: "e2",
    location: "Noida",
    category: "Pantry",
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
    category: "Common Areas",
    description: "Lobby couch has a large stain, needs deep cleaning.",
    hoursAgo: 5,
    status: "Resolved",
  },
  {
    employeeId: "e5",
    location: "Okhla",
    category: "Washroom",
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
