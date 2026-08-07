"use client";

import { useEffect, useState } from "react";

// A tappable issue photo. Opens the full image over the page — the thumbnails
// are cropped to a fixed height, so detail is only readable enlarged.
export function IssuePhoto({ src, caption }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="issue-photo-btn"
        onClick={() => setOpen(true)}
        aria-label="View photo full size"
      >
        <img className="issue-photo" src={src} alt="attachment" />
        <span className="issue-photo-hint">Tap to enlarge</span>
      </button>
      {open && (
        <PhotoLightbox src={src} caption={caption} onClose={() => setOpen(false)} />
      )}
    </>
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
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Issue photo">
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />
      <button className="lightbox-close" onClick={onClose} aria-label="Close">
        ✕
      </button>
      <figure className="lightbox-figure">
        <img src={src} alt="Issue attachment, full size" />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    </div>
  );
}
