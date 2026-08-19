import nodemailer from "nodemailer";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseTo(raw) {
  return String(raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function POST(request) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = parseTo(process.env.SUMMARY_TO);
  if (!user || !pass || to.length === 0) {
    return Response.json({ ok: false, error: "SMTP not configured." }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const date = escapeHtml(body.date || "");
  const rows = Array.isArray(body.rows) ? body.rows : [];
  const tableRows = rows
    .map((r) => {
      const done = Number(r.done) || 0;
      const total = Number(r.total) || 0;
      const pct = Number(r.pct) || 0;
      const onTime = r.onTime ? "Yes" : "No";
      return `<tr>
        <td>${escapeHtml(r.name)}</td>
        <td>${escapeHtml(r.location)}</td>
        <td>${done}</td>
        <td>${total}</td>
        <td>${pct}%</td>
        <td>${onTime}</td>
      </tr>`;
    })
    .join("");

  const html = `
    <p>Daily task summary for <strong>${date}</strong>.</p>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      <thead>
        <tr>
          <th>CM</th>
          <th>Property</th>
          <th>Done</th>
          <th>Total</th>
          <th>Progress</th>
          <th>On time (${escapeHtml(process.env.NEXT_PUBLIC_NOTIFY_DEADLINE || "12:30")})</th>
        </tr>
      </thead>
      <tbody>${tableRows || `<tr><td colspan="6">No employees.</td></tr>`}</tbody>
    </table>
  `;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `Onward Tasks <${user}>`,
      to,
      subject: `Daily task summary — ${date}`,
      html,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed.";
    return Response.json({ ok: false, error: message }, { status: 502 });
  }

  return Response.json({ ok: true });
}
