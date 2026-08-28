import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

// Body: { urls: ["https://pub-....r2.dev/issues/xxx.jpg", ...] }
export async function DELETE(request) {
  try {
    const { urls = [] } = await request.json();
    if (!urls.length) return Response.json({ ok: true, deleted: 0 });

    const base = process.env.R2_PUBLIC_URL;
    const keys = urls
      .filter((u) => u.startsWith(base))
      .map((u) => ({ Key: u.replace(`${base}/`, "") }));

    if (keys.length) {
      await r2.send(
        new DeleteObjectsCommand({
          Bucket: process.env.R2_BUCKET,
          Delete: { Objects: keys, Quiet: true },
        })
      );
    }

    return Response.json({ ok: true, deleted: keys.length });
  } catch (err) {
    console.error("R2 delete error:", err);
    return Response.json({ error: "Delete failed" }, { status: 500 });
  }
}
