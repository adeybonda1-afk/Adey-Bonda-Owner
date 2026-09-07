const { services, sendJson, ownerFromReq, sendDataMessage } = require("./_firebaseAdmin");

module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "Method not allowed" });
  try {
    if (!ownerFromReq(req)) return sendJson(res, 401, { ok: false, error: "Invalid owner session" });

    const body = req.body || {};
    const userId = String(body.userId || "").trim();
    const event = String(body.event || "").trim();
    if (!userId || event !== "owner_message") {
      return sendJson(res, 400, { ok: false, error: "Invalid notification request" });
    }

    const servicesRef = services();
    const snapshot = await servicesRef.db.ref(`AdeyBonda/pushTokens/customers/${userId}`).once("value");
    const tokens = snapshot.val() || {};
    const fids = Object.values(tokens).map((item) => item?.installationId).filter(Boolean);
    const message = String(body.message || "New message from the owner").trim();

    const result = await sendDataMessage(servicesRef.messaging, fids, {
      title: "New message from Adey Bonda",
      body: message.slice(0, 180),
      type: "owner_message",
      url: "Message.html",
      tag: `owner-message-${userId}`
    });

    return sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    console.error("notify-user:", error);
    return sendJson(res, 500, { ok: false, error: "Failed to send customer notification" });
  }
};
