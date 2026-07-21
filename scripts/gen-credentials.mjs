// Generates public/credentials.xlsx from lib/credentials.json.
// Run with: npm run gen:creds
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const users = JSON.parse(
  fs.readFileSync(path.join(root, "lib", "credentials.json"), "utf8")
);

const rows = users.map((u) => ({
  Name: u.name,
  Role: u.role === "manager" ? "Manager" : "Employee",
  Username: u.username,
  Password: u.password,
  Location: u.location || "All locations",
}));

const ws = XLSX.utils.json_to_sheet(rows, {
  header: ["Name", "Role", "Username", "Password", "Location"],
});

// Column widths for readability.
ws["!cols"] = [
  { wch: 18 },
  { wch: 10 },
  { wch: 14 },
  { wch: 16 },
  { wch: 16 },
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Credentials");

const outDir = path.join(root, "public");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "credentials.xlsx");
XLSX.writeFile(wb, outFile);

console.log(`Wrote ${rows.length} credentials to ${outFile}`);
