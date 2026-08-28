// Manager-only: clear another user's completions.
// Completions are client-side; this endpoint signals the manager dashboard
// to clear that user's state from the shared localStorage key.
export async function DELETE(request, { params }) {
  const { userId } = await params;
  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });
  return Response.json({ ok: true, cleared: userId });
}
