// Completions are stored client-side in localStorage.
// This endpoint is the signal — the client clears its own state on 200.
export async function DELETE() {
  return Response.json({ ok: true, cleared: "own" });
}
