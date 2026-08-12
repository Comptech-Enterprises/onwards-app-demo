"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { LOCATIONS, employeeById } from "@/lib/seed";

const FACILITY_TYPES = ["Meeting Room", "Day Pass", "Virtual Office", "Shooting"];
const AGGREGATORS = ["myHQ", "Qdesq", "SimplyWork", "Cofynd", "SpaceN", "Stylework", "EasyDesq", "InstantOffice", "Lease Circle", "Direct / Other"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function VisitorForm({ employeeId }) {
  const { addVisitor } = useApp();
  const emp = employeeById(employeeId);

  const [date, setDate] = useState(today());
  const [facilityType, setFacilityType] = useState(FACILITY_TYPES[0]);
  const [aggregator, setAggregator] = useState(AGGREGATORS[0]);
  const [arrivalTime, setArrivalTime] = useState("");
  const [punchOutTime, setPunchOutTime] = useState("");
  const [guestName, setGuestName] = useState("");
  const [location, setLocation] = useState(emp?.location || LOCATIONS[0]);
  const [seats, setSeats] = useState("");
  const [payment, setPayment] = useState("");
  const [flash, setFlash] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!guestName.trim() || !arrivalTime || !seats) return;
    addVisitor({ employeeId, date, facilityType, aggregator, arrivalTime, punchOutTime, guestName: guestName.trim(), location, seats, payment });
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
  }

  return (
    <form className="card issue-form" onSubmit={submit}>
      <div className="card-title">Add entry</div>

      <div className="form-row">
        <label className="field">
          <span>Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className="field">
          <span>Facility type</span>
          <select value={facilityType} onChange={(e) => setFacilityType(e.target.value)}>
            {FACILITY_TYPES.map((f) => <option key={f}>{f}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Aggregator</span>
          <select value={aggregator} onChange={(e) => setAggregator(e.target.value)}>
            {AGGREGATORS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label className="field">
          <span>Arrival time</span>
          <input type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} required />
        </label>
        <label className="field">
          <span>Punch-out time</span>
          <input type="time" value={punchOutTime} onChange={(e) => setPunchOutTime(e.target.value)} />
        </label>
        <label className="field">
          <span>Guest name</span>
          <input type="text" placeholder="e.g. Rohan Mehta" value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
        </label>
      </div>

      <div className="form-row">
        <label className="field">
          <span>Property / centre</span>
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        <label className="field">
          <span>No. of seats / people</span>
          <input type="number" placeholder="e.g. 6" min="1" value={seats} onChange={(e) => setSeats(e.target.value)} required />
        </label>
        <label className="field">
          <span>Payment (₹) — optional</span>
          <input type="number" placeholder="e.g. 560" min="0" value={payment} onChange={(e) => setPayment(e.target.value)} />
        </label>
      </div>

      <button type="submit" className="btn-primary">Add entry</button>

      {flash && <div className="flash">{flash}</div>}
    </form>
  );
}
