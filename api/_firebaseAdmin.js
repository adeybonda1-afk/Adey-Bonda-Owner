function getFirebaseAdmin() {
  const { cert, getApps, initializeApp } = require("firebase-admin/app");
  const { getAuth } = require("firebase-admin/auth");
  const { getDatabase } = require("firebase-admin/database");
  const { getMessaging } = require("firebase-admin/messaging");
  return { cert, getApps, initializeApp, getAuth, getDatabase, getMessaging };
}

function getAdminApp() {
  const { cert, getApps, initializeApp } = getFirebaseAdmin();
  if (getApps().length) return getApps()[0];

  const projectId = String(process.env.FIREBASE_PROJECT_ID || "").trim();
  const clientEmail = String(process.env.FIREBASE_CLIENT_EMAIL || "").trim();
  let privateKey = String(process.env.FIREBASE_PRIVATE_KEY || "").trim();
  const databaseURL = String(process.env.FIREBASE_DATABASE_URL || "").trim();

  privateKey = privateKey.replace(/^['"]|['"]$/g, "").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey || !databaseURL) {
    throw new Error("Missing Firebase Admin environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_DATABASE_URL");
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    databaseURL
  });
}

function services() {
  const { getAuth, getDatabase, getMessaging } = getFirebaseAdmin();
  const app = getAdminApp();
  return { auth: getAuth(app), db: getDatabase(app), messaging: getMessaging(app) };
}

function sendJson(res, status, body) { return res.status(status).json(body); }
function bearer(req) {
  const h = req.headers?.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}
function hashId(value) {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

async function sendDataMessage(messaging, fids, payload) {
  const unique = [...new Set((fids || []).filter(Boolean).map(String))];
  if (!unique.length) return { attempted: 0, success: 0, failure: 0, invalidFids: [] };

  let success = 0, failure = 0;
  const invalidFids = [];
  for (let i = 0; i < unique.length; i += 500) {
    const batch = unique.slice(i, i + 500);
    const settled = await Promise.allSettled(batch.map((fid) => messaging.send({
      fid,
      data: {
        title: String(payload.title || "Adey Bonda"),
        body: String(payload.body || "You have a new notification."),
        type: String(payload.type || "general"),
        url: String(payload.url || "home.html"),
        tag: String(payload.tag || payload.type || "adey-bonda")
      },
      webpush: { headers: { Urgency: "high", TTL: "2419200" } }
    })));
    settled.forEach((result, index) => {
      if (result.status === "fulfilled") success++;
      else {
        failure++;
        const code = String(result.reason?.code || "");
        if (code.includes("registration-token-not-registered") || code.includes("invalid-registration-token")) {
          invalidFids.push(batch[index]);
        }
        console.error("FCM send failed:", code, result.reason?.message || result.reason);
      }
    });
  }
  return { attempted: unique.length, success, failure, invalidFids };
}

module.exports = { services, sendJson, bearer, hashId, sendDataMessage };
