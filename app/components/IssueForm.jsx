"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { ISSUE_CATEGORIES, LOCATIONS, OPS_EMAIL } from "@/lib/seed";

export default function IssueForm({ employeeId }) {
  const { addIssue, users } = useApp();
  // Defaults to the reporter's own unit, but they can switch it.
  const [location, setLocation] = useState(
    () => users.find((u) => u.id === employeeId)?.location || LOCATIONS[0]
  );
  const [category, setCategory] = useState(ISSUE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [flash, setFlash] = useState("");

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return setPhoto(null);
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  function submit(e) {
    e.preventDefault();
    if (!description.trim()) return;
    addIssue({
      employeeId,
      location,
      category,
      description: description.trim(),
      photo,
    });
    setDescription("");
    setPhoto(null);
    setFlash(`Reported. Email sent to ${OPS_EMAIL}.`);
    setTimeout(() => setFlash(""), 3500);
  }

  return (
    <form className="card issue-form" onSubmit={submit}>
      <div className="card-title">Report an issue</div>

      <label className="field">
        <span>Centre</span>
        <select value={location} onChange={(e) => setLocation(e.target.value)}>
          {LOCATIONS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Category</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {ISSUE_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>What's the problem?</span>
        <textarea
          rows={3}
          placeholder="e.g. Coffee machine in the kitchen isn't working"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <label className="field">
        <span>Photo (optional)</span>
        <input type="file" accept="image/*" onChange={onFile} />
      </label>

      {photo && <img className="issue-photo preview" src={photo} alt="preview" />}

      <button type="submit" className="btn-primary">
        Submit issue
      </button>

      {flash && <div className="flash">{flash}</div>}
    </form>
  );
}
