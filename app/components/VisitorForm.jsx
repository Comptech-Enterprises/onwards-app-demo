"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { LOCATIONS } from "@/lib/seed";
import styles from "./VisitorForm.module.css";

const FACILITY_TYPES = ["Meeting Room", "Day Pass", "Virtual Office", "Shooting"];
const AGGREGATORS = ["myHQ", "Qdesq", "SimplyWork", "Cofynd", "SpaceN", "Stylework", "EasyDesq", "InstantOffice", "Lease Circle", "Direct / Other"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function VisitorForm({ employeeId }) {
  const { addVisitor, users } = useApp();
  const emp = users.find((u) => u.id === employeeId);

  const [date, setDate] = useState(today());
  const [facilityType, setFacilityType] = useState(FACILITY_TYPES[0]);
  const [aggregator, setAggregator] = useState(AGGREGATORS[0]);
  const [arrivalTime, setArrivalTime] = useState("");
  const [punchOutTime, setPunchOutTime] = useState("");
  const [guestName, setGuestName] = useState("");
  const [location, setLocation] = useState(emp?.location || LOCATIONS[0]);
  const [seats, setSeats] = useState("");
  const [payment, setPayment] = useState("");
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!guestName.trim() || !arrivalTime || !seats) return;

    setLoading(true);
    try {
      const res = await addVisitor({
        employeeId,
        date,
        facilityType,
        aggregator,
        arrivalTime,
        punchOutTime,
        guestName: guestName.trim(),
        location,
        seats,
        payment,
      });

      if (res?.ok !== false) {
        setDate(today());
        setFacilityType(FACILITY_TYPES[0]);
        setAggregator(AGGREGATORS[0]);
        setArrivalTime("");
        setPunchOutTime("");
        setGuestName("");
        setSeats("");
        setPayment("");
        setFlash("Entry added.");
        setTimeout(() => setFlash(""), 3000);
      } else {
        setFlash(res.error || "Failed to log entry.");
        setTimeout(() => setFlash(""), 3000);
      }
    } catch {
      setFlash("Could not save entry.");
      setTimeout(() => setFlash(""), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.card} onSubmit={submit}>
      <div className="card-title">Add entry</div>

      <div className="form-row">
        <label className="field">
          <span>Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required disabled={loading} />
        </label>
        <label className="field">
          <span>Facility type</span>
          <select value={facilityType} onChange={(e) => setFacilityType(e.target.value)} disabled={loading}>
            {FACILITY_TYPES.map((f) => <option key={f}>{f}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Aggregator</span>
          <select value={aggregator} onChange={(e) => setAggregator(e.target.value)} disabled={loading}>
            {AGGREGATORS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label className="field">
          <span>Arrival time</span>
          <input type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} required disabled={loading} />
        </label>
        <label className="field">
          <span>Punch-out time</span>
          <input type="time" value={punchOutTime} onChange={(e) => setPunchOutTime(e.target.value)} disabled={loading} />
        </label>
        <label className="field">
          <span>Guest name</span>
          <input type="text" placeholder="e.g. Rohan Mehta" value={guestName} onChange={(e) => setGuestName(e.target.value)} required disabled={loading} />
        </label>
      </div>

      <div className="form-row">
        <label className="field">
          <span>Property / centre</span>
          <select value={location} onChange={(e) => setLocation(e.target.value)} disabled={loading}>
            {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        <label className="field">
          <span>No. of seats / people</span>
          <input type="number" placeholder="e.g. 6" min="1" value={seats} onChange={(e) => setSeats(e.target.value)} required disabled={loading} />
        </label>
        <label className="field">
          <span>Payment (₹) — excluding GST</span>
          <input type="number" placeholder="e.g. 560" min="0" value={payment} onChange={(e) => setPayment(e.target.value)} disabled={loading} />
        </label>
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Adding…" : "Add entry"}
      </button>

      {flash && <div className="flash">{flash}</div>}
    </form>
  );
}
