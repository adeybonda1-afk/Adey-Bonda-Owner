const { services, sendJson, signOwnerToken } = require("./_firebaseAdmin");

module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "Method not allowed" });
  try {
    const { db } = services();
    const id = String(req.body?.id || "").trim();
    const password = String(req.body?.password || "");
    if (!id || !password) return sendJson(res, 400, { ok: false, error: "Owner ID and password are required" });

    const [idSnap, passSnap] = await Promise.all([
      db.ref("AdeyBonda/Owner/Id").once("value"),
      db.ref("AdeyBonda/Owner/Password").once("value")
    ]);

    const correctId = String(idSnap.val() ?? "");
    const correctPassword = String(passSnap.val() ?? "");
    if (id !== correctId || password !== correctPassword) {
      return sendJson(res, 401, { ok: false, error: "Invalid Owner ID or password" });
    }

    const token = signOwnerToken({
      role: "owner",
      sub: "Bonda",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    });

    return sendJson(res, 200, { ok: true, token });
  } catch (error) {
    console.error("owner-login:", error);
    return sendJson(res, 500, { ok: false, error: "Owner login service failed" });
  }
};
