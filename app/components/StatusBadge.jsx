"use client";

// Where an issue sits in its lifecycle: Unattended → In progress → Resolved.
export default function StatusBadge({ status }) {
  const slug = String(status).toLowerCase().replace(/\s+/g, "-");
  return <span className={`status-badge status-${slug}`}>{status}</span>;
}
