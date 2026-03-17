import React, { useMemo, useState } from "react";

export default function ApplicationForm() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [form, setForm] = useState({
    company: "",
    role: "",
    location: "",
    link: "",
    salaryRange: "",
    status: "Applied",
    notes: "",
    dateApplied: today,
  });
  const [msg, setMsg] = useState("");

  function update(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    const payload = {
      ...form,
      location: form.location || null,
      link: form.link || null,
      salaryRange: form.salaryRange || null,
      notes: form.notes || null,
    };

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(json?.error?.formErrors?.join?.(", ") || json?.error || "Failed to create");
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={submit}>
      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <label className="muted">Company</label>
          <input value={form.company} onChange={(e) => update("company", e.target.value)} required />
        </div>
        <div>
          <label className="muted">Role</label>
          <input value={form.role} onChange={(e) => update("role", e.target.value)} required />
        </div>
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <label className="muted">Location</label>
          <input value={form.location} onChange={(e) => update("location", e.target.value)} />
        </div>
        <div>
          <label className="muted">Status</label>
          <select value={form.status} onChange={(e) => update("status", e.target.value)}>
            <option>Applied</option>
            <option>Interview</option>
            <option>Offer</option>
            <option>Rejected</option>
          </select>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <label className="muted">Job Link</label>
          <input value={form.link} onChange={(e) => update("link", e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <label className="muted">Date Applied</label>
          <input type="date" value={form.dateApplied} onChange={(e) => update("dateApplied", e.target.value)} />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label className="muted">Salary Range</label>
        <input value={form.salaryRange} onChange={(e) => update("salaryRange", e.target.value)} placeholder="$90k–$120k" />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label className="muted">Notes</label>
        <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={4} />
      </div>

      <div className="actions">
        <button type="submit">Save</button>
        <a href="/dashboard" className="muted" style={{ alignSelf: "center" }}>
          Cancel
        </a>
      </div>

      {msg ? <p className="muted" style={{ marginTop: 12 }}>{msg}</p> : null}
    </form>
  );
}