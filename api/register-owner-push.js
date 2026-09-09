const { adminServices, sendJson, hashId } = require("./_firebaseAdmin");

module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "Method not allowed" });
  try {
    
    const installationId = String(req.body?.installationId || "").trim();
    if (!installationId) return sendJson(res, 400, { ok: false, error: "Missing installationId" });
    const { db } = adminServices();
    const key = hashId(installationId);
    await db.ref(`AdeyBonda/pushTokens/owner/${key}`).set({
      installationId,
      updatedAt: Date.now(),
      platform: "web"
    });
    return sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error("register-owner-push:", error);
    return sendJson(res, 500, { ok: false, error: "Failed to register owner push installation" });
  }
};
