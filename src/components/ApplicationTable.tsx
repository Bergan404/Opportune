import React, { useEffect, useMemo, useState } from "react";

type AppItem = {
  id: string;
  company: string;
  role: string;
  location: string | null;
  link: string | null;
  salaryRange: string | null;
  status: "Applied" | "Interview" | "Offer" | "Rejected";
  notes: string | null;
  dateApplied: string; // yyyy-mm-dd
};

export default function ApplicationTable() {
  const [items, setItems] = useState<AppItem[]>([]);
  const [status, setStatus] = useState<string>("All");
  const [q, setQ] = useState("");

  async function load() {
    const res = await fetch("/api/applications");
    const json = await res.json();
    if (res.ok) setItems(json.items || []);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const matchesStatus = status === "All" ? true : it.status === status;
      const text = `${it.company} ${it.role} ${it.location ?? ""}`.toLowerCase();
      const matchesQ = q.trim() ? text.includes(q.toLowerCase()) : true;
      return matchesStatus && matchesQ;
    });
  }, [items, status, q]);

  async function quickStatus(id: string, newStatus: AppItem["status"]) {
    const current = items.find((x) => x.id === id);
    if (!current) return;

    const res = await fetch(`/api/applications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...current, status: newStatus }),
    });
    if (res.ok) await load();
  }

  async function remove(id: string) {
    const ok = confirm("Delete this application?");
    if (!ok) return;
    const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <input
          placeholder="Search company / role / location…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 420 }}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 200 }}>
          <option>All</option>
          <option>Applied</option>
          <option>Interview</option>
          <option>Offer</option>
          <option>Rejected</option>
        </select>
        <button onClick={load}>Refresh</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Company</th>
            <th>Role</th>
            <th>Status</th>
            <th>Date</th>
            <th>Link</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((it) => (
            <tr key={it.id}>
              <td>{it.company}</td>
              <td>{it.role}</td>
              <td>{it.status}</td>
              <td>{it.dateApplied}</td>
              <td>
                {it.link ? (
                  <a href={it.link} target="_blank" rel="noreferrer">
                    Open
                  </a>
                ) : (
                  <span style={{ opacity: 0.6 }}>—</span>
                )}
              </td>
              <td>
                <div className="actions">
                  <select
                    value={it.status}
                    onChange={(e) => quickStatus(it.id, e.target.value as any)}
                    style={{ maxWidth: 140 }}
                  >
                    <option>Applied</option>
                    <option>Interview</option>
                    <option>Offer</option>
                    <option>Rejected</option>
                  </select>
                  <button onClick={() => remove(it.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}

          {!filtered.length ? (
            <tr>
              <td colSpan={6} style={{ opacity: 0.7 }}>
                No applications yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}