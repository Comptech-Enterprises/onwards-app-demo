"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { CATEGORIES, LOCATIONS, OPS_EMAIL, employeeById } from "@/lib/seed";

export default function IssueForm({ employeeId }) {
  const { addIssue } = useApp();
  // Defaults to the reporter's own unit, but they can switch it.
  const [location, setLocation] = useState(
    () => employeeById(employeeId)?.location || LOCATIONS[0]
  );
  const [category, setCategory] = useState(CATEGORIES[0]);
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
        <span>Location</span>
        <select value={location} onChange={(e) => setLocation(e.target.value)}>
          {LOCATIONS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Category</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
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
