"use client";

import { useMemo, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { LOCATIONS } from "@/lib/seed";
import { PhotoViewer } from "./PhotoLightbox";
import styles from "./BillsView.module.css";

const DATE_PRESETS = ["All", "Today", "This week", "This month", "Last month", "Custom"];

function rangeForPreset(preset) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === "Today") {
    return { start: today, end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999) };
  }
  if (preset === "This week") {
    const diff = today.getDay() === 0 ? -6 : 1 - today.getDay();
    const mon = new Date(today);
    mon.setDate(today.getDate() + diff);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    sun.setHours(23, 59, 59, 999);
    return { start: mon, end: sun };
  }
  if (preset === "This month") {
    return {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }
  if (preset === "Last month") {
    return {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999),
    };
  }
  return { start: null, end: null };
}

function shortDate(d) {
  return d ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function billUrls(bill) {
  if (Array.isArray(bill?.fileUrls) && bill.fileUrls.length > 0) return bill.fileUrls;
  return bill?.fileUrl ? [bill.fileUrl] : [];
}

export default function BillsView() {
  const { user, bills, deleteBill } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [viewUrls, setViewUrls] = useState([]);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");
  const [preset, setPreset] = useState("All");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [flash, setFlash] = useState("");

  const isManager = user?.role === "manager";
  const isCM = user?.designation === "cm";

  const { start, end } = useMemo(() => {
    if (preset !== "Custom") return rangeForPreset(preset);
    const s = customStart ? new Date(`${customStart}T00:00:00`) : null;
    const e = customEnd ? new Date(`${customEnd}T23:59:59.999`) : null;
    return { start: s, end: e };
  }, [preset, customStart, customEnd]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (bills || [])
      .filter((b) => {
        if (isManager) {
          if (locationFilter !== "All" && b.location !== locationFilter) return false;
        } else if (isCM) {
          if (user?.location && b.location && b.location !== user.location) return false;
        } else if (b.userId !== user?.id && b.employeeId !== user?.id) {
          return false;
        }

        if (start || end) {
          const d = new Date(b.createdAt);
          if (!b.createdAt || Number.isNaN(d.getTime())) return false;
          if (start && d < start) return false;
          if (end && d > end) return false;
        }

        if (q) {
          const hay = [b.employeeName, b.itemName, b.remark, b.location, b.designation];
          if (!hay.some((v) => (v || "").toLowerCase().includes(q))) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [bills, isManager, isCM, user, locationFilter, start, end, search]);

  function notify(msg) {
    setFlash(msg);
    setTimeout(() => setFlash(""), 3500);
  }

  function openReceipt(bill) {
    const urls = billUrls(bill);
    if (urls.length) setViewUrls(urls);
    else notify("No receipt photo available.");
  }

  async function remove(bill) {
    if (!window.confirm(`Delete bill for "${bill.itemName}"?`)) return;
    const res = await deleteBill(bill.id);
    notify(res.ok ? "Bill removed." : res.error);
  }

  const subtitle = isManager
    ? "Review bills submitted across centres"
    : isCM
      ? `${user?.location || "Centre"} · Upload bills`
      : "Upload purchase bills & receipts";

  const summary = [
    `${filtered.length} ${filtered.length === 1 ? "bill" : "bills"}`,
    preset !== "All" &&
      (preset === "Custom" ? `${shortDate(start)} – ${shortDate(end || start)}` : preset),
    isManager && locationFilter !== "All" && locationFilter,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Bills &amp; Purchases</h1>
          <p className="muted small">{subtitle}</p>
        </div>
        <button type="button" className={styles.addBtn} onClick={() => setShowForm(true)}>
          + Add Bill
        </button>
      </div>

      <div className={styles.filters}>
        <label className="search-bar">
          <span aria-hidden="true">⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isManager ? "Search employee, item, location…" : "Search bills, items, remarks…"}
          />
        </label>

        {isManager && (
          <div className={styles.chipScroll}>
            {["All", ...LOCATIONS].map((l) => (
              <button
                key={l}
                type="button"
                className={`chip-filter ${locationFilter === l ? "active" : ""}`}
                onClick={() => setLocationFilter(l)}
              >
                {l}
              </button>
            ))}
          </div>
        )}

        <div className={styles.chipScroll}>
          {DATE_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={`chip-filter ${preset === p ? "active" : ""}`}
              onClick={() => setPreset(p)}
            >
              {p === "All" ? "All Dates" : p}
            </button>
          ))}
        </div>

        {preset === "Custom" && (
          <div className={styles.dateRow}>
            <input type="date" value={customStart} max={customEnd || undefined} onChange={(e) => setCustomStart(e.target.value)} aria-label="Start date" />
            <span className="muted small">to</span>
            <input type="date" value={customEnd} min={customStart || undefined} onChange={(e) => setCustomEnd(e.target.value)} aria-label="End date" />
          </div>
        )}
      </div>

      <p className={styles.summary}>{summary}</p>
      {flash && <div className="flash" style={{ marginBottom: 12 }}>{flash}</div>}

      {filtered.length === 0 ? (
        <div className={styles.card}>
          <p className="muted empty" style={{ textAlign: "center" }}>
            {isManager
              ? "No bills match the selected filters."
              : isCM
                ? `No bills uploaded for ${user?.location || "your centre"} yet. Tap "+ Add Bill" to upload.`
                : 'You have not submitted any bills yet. Tap "+ Add Bill" to upload your first bill.'}
          </p>
        </div>
      ) : (
        <div className="stack">
          {filtered.map((bill) => {
            const pages = billUrls(bill).length;
            return (
              <div key={bill.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isManager && (
                      <div className={styles.emp}>
                        <span className={styles.avatar}>{bill.employeeName?.charAt(0)?.toUpperCase() || "E"}</span>
                        <div>
                          <div className={styles.empName}>{bill.employeeName || "Unknown Employee"}</div>
                          <div className={styles.tags}>
                            <span className={styles.tagBrand}>{bill.designation || "Staff"}</span>
                            <span className={styles.tag}>📍 {bill.location || "Centre"}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className={styles.item}>{bill.itemName}</div>
                    {!!bill.remark && <div className={styles.remark}>💬 {bill.remark}</div>}
                    {bill.amount ? <div className={styles.amount}>₹{bill.amount}</div> : null}
                  </div>
                  <span className={styles.when}>{formatDate(bill.createdAt)}</span>
                </div>
                <div className={styles.foot}>
                  <button type="button" className={styles.viewBtn} onClick={() => openReceipt(bill)}>
                    <svg viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    {pages > 1 ? `View Receipt (${pages} pages)` : "View Receipt"}
                  </button>
                  {isManager && (
                    <button type="button" className="btn-delete" onClick={() => remove(bill)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <AddBillModal
          user={user}
          onClose={() => setShowForm(false)}
          onDone={() => {
            setShowForm(false);
            notify("Bill uploaded successfully.");
          }}
        />
      )}
      {viewUrls.length > 0 && <PhotoViewer srcs={viewUrls} onClose={() => setViewUrls([])} />}
    </section>
  );
}

function AddBillModal({ user, onClose, onDone }) {
  const { addBill } = useApp();
  const [itemName, setItemName] = useState("");
  const [remark, setRemark] = useState("");
  const [amount, setAmount] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  function onPick(e) {
    const picked = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    if (picked.length) {
      setError("");
      setFiles((prev) => [...prev, ...picked]);
    } else if (e.target.files?.length) {
      setError("Only photos/images are supported.");
    }
    e.target.value = "";
  }

  async function submit(e) {
    e.preventDefault();
    if (!itemName.trim()) return setError("Please enter the item name.");
    if (files.length === 0) return setError("Please take or upload at least one photo of the bill.");

    setError("");
    setLoading(true);
    const res = await addBill({
      itemName: itemName.trim(),
      remark: remark.trim(),
      amount: amount.trim() || undefined,
      location: user?.location,
      files,
    });
    setLoading(false);
    if (res.ok) onDone();
    else setError(res.error);
  }

  return (
    <div className="modal-wrap modal-wrap--form" role="dialog" aria-modal="true" aria-label="Submit purchase bill">
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />
      <form className="modal" onSubmit={submit}>
        <div className="modal-head">
          <div>
            <strong className="modal-title">Submit Purchase Bill</strong>
            <span className="muted small">
              {user?.name ? `${user.name} · ` : ""}
              {user?.location || "Centre"}
            </span>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="field">
          <span>Centre *</span>
          <div className={styles.fixed}>📍 {user?.location || "Assigned Centre"}</div>
        </div>

        <label className="field">
          <span>Item Name *</span>
          <input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g. Printer Cartridge, Coffee Beans, Cleaning Towels"
          />
        </label>

        <label className="field">
          <span>Remark / Purpose</span>
          <textarea
            rows={3}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="e.g. Purchased for 2nd floor conference room"
          />
        </label>

        <label className="field">
          <span>Amount (₹ Optional)</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 750"
          />
        </label>

        <div className="field">
          <span>
            Bill Photos * {files.length > 0 && `(${files.length} ${files.length === 1 ? "page" : "pages"})`}
          </span>
          {files.length > 0 && (
            <div className={styles.thumbs}>
              {previews.map((src, i) => (
                <div key={src} className={styles.thumb}>
                  <img src={src} alt={`Page ${i + 1}`} />
                  <span className={styles.thumbBadge}>Page {i + 1}</span>
                  <button
                    type="button"
                    className={styles.thumbDel}
                    aria-label={`Remove page ${i + 1}`}
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className={styles.pickRow}>
            <button type="button" className={styles.pickBtn} onClick={() => cameraRef.current?.click()}>
              📷 {files.length ? "+ Page" : "Take Photo"}
            </button>
            <button type="button" className={styles.pickBtn} onClick={() => galleryRef.current?.click()}>
              🖼️ {files.length ? "+ Gallery" : "Gallery Photos"}
            </button>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onPick} />
          <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={onPick} />
          <p className={styles.tip}>💡 Tip: You can upload 2 or 3+ photos for multi-page bills.</p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Submitting…" : files.length > 1 ? `Submit Bill (${files.length} pages)` : "Submit Bill"}
          </button>
        </div>
      </form>
    </div>
  );
}
