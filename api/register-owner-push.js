module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
    const { services, hashId } = require("./_firebaseAdmin");
    const installationId = String(req.body?.installationId || "").trim();
    if (!installationId) return res.status(400).json({ ok: false, error: "Missing installationId" });

    const { db } = services();
    const key = hashId(installationId);
    await db.ref(`AdeyBonda/pushTokens/owner/${key}`).set({
      installationId,
      updatedAt: Date.now(),
      platform: "web"
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("register-owner-push:", error);
    return res.status(500).json({ ok: false, error: error?.message || String(error), code: error?.code || undefined });
  }
};
