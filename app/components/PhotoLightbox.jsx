"use client";

import { useEffect, useState } from "react";
import styles from "./PhotoLightbox.module.css";

// A tappable issue photo. Opens the full image over the page — the thumbnails
// are cropped to a fixed height, so detail is only readable enlarged.
export function IssuePhoto({ src, caption }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`${styles.btn} issue-photo-btn`}
        onClick={() => setOpen(true)}
        aria-label="View photo full size"
      >
        <img className="issue-photo" src={src} alt="attachment" />
        <span className={styles.hint}>Tap to enlarge</span>
      </button>
      {open && (
        <PhotoLightbox src={src} caption={caption} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

// Multi-image lightbox for receipts / bills (swipe through pages)
export function PhotoViewer({ srcs, onClose }) {
  const [idx, setIdx] = useState(0);
  const total = srcs.length;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && idx < total - 1) setIdx((i) => i + 1);
      if (e.key === "ArrowLeft" && idx > 0) setIdx((i) => i - 1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, idx, total]);

  return (
    <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label="Receipt photos">
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />
      <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>
      {total > 1 && idx > 0 && (
        <button className={styles.navBtn} style={{ left: 12 }} onClick={() => setIdx((i) => i - 1)} aria-label="Previous">‹</button>
      )}
      {total > 1 && idx < total - 1 && (
        <button className={styles.navBtn} style={{ right: 12 }} onClick={() => setIdx((i) => i + 1)} aria-label="Next">›</button>
      )}
      <figure className={styles.figure}>
        <img src={srcs[idx]} alt={`Page ${idx + 1} of ${total}`} />
        {total > 1 && <figcaption>Page {idx + 1} of {total}</figcaption>}
      </figure>
    </div>
  );
}

function PhotoLightbox({ src, caption, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label="Issue photo">
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />
      <button className={styles.close} onClick={onClose} aria-label="Close">
        ✕
      </button>
      <figure className={styles.figure}>
        <img src={src} alt="Issue attachment, full size" />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    </div>
  );
}
