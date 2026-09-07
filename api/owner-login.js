const { services, sendJson, signOwnerToken } = require("./_firebaseAdmin");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return sendJson(res, 405, {
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    console.log("OWNER LOGIN: function started");

    const { db } = services();

    console.log("OWNER LOGIN: Firebase Admin initialized");

    const id = String(req.body?.id || "").trim();
    const password = String(req.body?.password || "");

    if (!id || !password) {
      return sendJson(res, 400, {
        ok: false,
        error: "Owner ID and password are required"
      });
    }

    console.log("OWNER LOGIN: reading owner credentials");

    const [idSnap, passSnap] = await Promise.all([
      db.ref("AdeyBonda/Owner/Id").once("value"),
      db.ref("AdeyBonda/Owner/Password").once("value")
    ]);

    console.log("OWNER LOGIN: Firebase read successful");

    const correctId = String(idSnap.val() ?? "");
    const correctPassword = String(passSnap.val() ?? "");

    if (id !== correctId || password !== correctPassword) {
      return sendJson(res, 401, {
        ok: false,
        error: "Invalid Owner ID or password"
      });
    }

    console.log("OWNER LOGIN: credentials correct");

    const token = signOwnerToken({
      role: "owner",
      sub: "Bonda",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    });

    console.log("OWNER LOGIN: token created");

    return sendJson(res, 200, {
      ok: true,
      token
    });

  } catch (error) {
    console.error("OWNER LOGIN ERROR:", error);

    return sendJson(res, 500, {
      ok: false,
      error: "Owner login service failed",
      diagnostic: error?.message || String(error)
    });
  }
};