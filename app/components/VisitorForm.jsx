"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";

export default function VisitorForm({ employeeId }) {
  const { addVisitor } = useApp();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [flash, setFlash] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    addVisitor({ employeeId, name: name.trim(), phone: phone.trim(), email: email.trim(), companyName: companyName.trim(), amountPaid: amountPaid.trim() });
    setName("");
    setPhone("");
    setEmail("");
    setCompanyName("");
    setAmountPaid("");
    setFlash("Entry added.");
    setTimeout(() => setFlash(""), 3000);
  }

  return (
    <form className="card issue-form" onSubmit={submit}>
      <div className="card-title">Add entry</div>

      <label className="field">
        <span>Name</span>
        <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>

      <label className="field">
        <span>Phone</span>
        <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>

      <label className="field">
        <span>Email</span>
        <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>

      <label className="field">
        <span>Company name</span>
        <input type="text" placeholder="Company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
      </label>

      <label className="field">
        <span>Amount paid (₹)</span>
        <input type="number" placeholder="0" min="0" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
      </label>

      <button type="submit" className="btn-primary">Add entry</button>

      {flash && <div className="flash">{flash}</div>}
    </form>
  );
}
