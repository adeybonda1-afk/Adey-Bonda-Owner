module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
    const { services, sendDataMessage } = require("./_firebaseAdmin");
    const body = req.body || {};
    const userId = String(body.userId || "").trim();
    const event = String(body.event || "").trim();
    if (!userId || event !== "owner_message") {
      return res.status(400).json({ ok: false, error: "Invalid notification request" });
    }

    const firebase = services();
    const snapshot = await firebase.db.ref(`AdeyBonda/pushTokens/customers/${userId}`).once("value");
    const tokens = snapshot.val() || {};
    const fids = Object.values(tokens).map((item) => item?.installationId).filter(Boolean);
    const message = String(body.message || "New message from the owner").trim();

    const result = await sendDataMessage(firebase.messaging, fids, {
      title: "New message from Adey Bonda",
      body: message.slice(0, 180),
      type: "owner_message",
      url: "Message.html",
      tag: `owner-message-${userId}`
    });

    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error("notify-user:", error);
    return res.status(500).json({ ok: false, error: error?.message || String(error), code: error?.code || undefined });
  }
};
