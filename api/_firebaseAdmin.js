const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getDatabase } = require("firebase-admin/database");
const { getMessaging } = require("firebase-admin/messaging");
const crypto = require("crypto");

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const projectId = "adey-bonda";
  const clientEmail = "firebase-adminsdk-fbsvc@adey-bonda.iam.gserviceaccount.com";
  const privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDWFBcEtmuTWDnR\nuV7zBGXBpjY3bL2H+MjhkfBz5niMIF8eI84mzgTrD5SWbAdbooEqweAgHmLUKGaX\nThapCl7+bLJwlp2+OmR57/R61xRlaa0nAmQGIErNyIe4NoBHl7D4QgCbxOw1VxhQ\n6mMJKVnggJt7j5cI9vFY7ze4pTvriQlQ2YnHpY9dZUsZEfzh8Fna/0ae+3Z6/Hrb\nn/melFQIRFHX/Kmm8cNvKUNI7TGiwI56FsxZb1H776NqiL58d2r8TiW2lxOfC+iQ\nSyr9YLySWAjy+L313zC190m4zx4EMw6V54D26iOCtLkGJ6H65F3C0JsonBSLSEeW\nNzD5GmWNAgMBAAECggEAXRJR6ZoXjfE6/fuOFLByPu0wwAr2IaHfT/ZfaDwoZ5+B\nSvy9GTDTgZB+BKHF1yiA6KJuevhK9jr0U06/WlGoeAuwznMk9Hm1ii/xBeDxPJ/j\niESpUOKEMxA+NS/4uGdyKJSlaBOGsDAD4dXtJaQFL64qKt+EBgE6b3RdMNkhgmX/\nZeYyCYJ196Ygcnw4BeaZj9+x3IMebmS9gH5Gpa4dF2XjtoFuOzbKORfq555PkJRm\no6qmv0mVH5xPDVVGsKHb7owkiSRnx4mhVBJv4TMtadPOXauQyir3MXPqOdWQdUv8\nNFkkhFs2R2PG9BIzFIJr+D9Egy5zpPBo6/5sXXgUzwKBgQDyzmUphyh7/2O0wXwS\n11wbA3pFQm8JGOduNUpK7N1Z5XnruXd05ZU18azce2EpjsdcJU0rgU+3gBSRqR/r\nsNcAKIWTWfMQbIh9zetI0lU4h3i6KVdElcrXmiJY6Kt05pqed801TRGFqaB+064O\nx5Ti4D797nPD9TLgguEfvuWEmwKBgQDhthJQ9BKcN/DwAndm1bz98dsy9wCVY0/F\nSSRCl/5M94PxhQgHBXLEqsEz7jfmieZFyYd95x7irfppVEt7uEgoqM70ZtR6MVrp\nAM/qZsjXyRMRTNrMMf55zPwKf5ee3XwatHObG3UIOQud5gonI1ufiX7jMUNIx4kb\nHT5MmZuc9wKBgCxctXL+9NCi+s6dw1OV8Ygl/IMG/k6FNFOYfPhvionQOZRuEHtV\nLwvqGhE2oav8IESftBfMyonWZuuuINzpNH8c6Drh5l0L12xU4TYu588qQU6SGxW2\n4Ja/3KKt8BWtxHZLoTyp1he7xE0n09dzc6p4Gko+9PvKov8OKp+oOzsdAoGBAJ+p\nYqV/MZbt/3JX3EyTD0B3kD4p+XCzMp900MCGse2R/PSgzP/ie7/gphBtB3/9tjVR\njJWkIvXoacWOSmL3BZw1ZUf/YXgaZ5uA5pKCKLpz0xgezHs7Ni7EsNlgTkmjlQFy\n+oAS2SN67tu/+Rica1icM3TUySq3cyYJ9qLK2ggbAoGBAMMFn2DYIrEb/QJgjX6G\n09m9/xe1ef6mDffSzVHBgEggOaGiTl+Zyg8Dwf65OjYU8yb07buO6j2VbEwUozYo\nXTlexZDRI3K3u62yAM1+Stgn3iuc+HPlXsBH4IXzz9umJF0ww49frWI8AHfCARrO\nBTcXT+AjYRlPGu2LIUSQSVlf\n-----END PRIVATE KEY-----\n";
  const databaseURL = "https://adey-bonda-default-rtdb.firebaseio.com/";
//privateKey = privateKey.replace(/^['"]|['"]$/g, "").replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey || !databaseURL) {
    throw new Error("Missing Firebase Admin environment variables.");
  }
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), databaseURL });
}

function services() {
  const app = getAdminApp();
  return { auth: getAuth(app), db: getDatabase(app), messaging: getMessaging(app) };
}

function sendJson(res, status, body) { res.status(status).json(body); }
function bearer(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}
function b64url(value) {
  return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function b64decode(value) {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}
function hmac(data) {
  return b64url(crypto.createHmac("sha256", process.env.OWNER_JWT_SECRET).update(data).digest());
}
function signOwnerToken(payload) {
  if (!process.env.OWNER_JWT_SECRET) throw new Error("Missing OWNER_JWT_SECRET");
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  return `${header}.${body}.${hmac(`${header}.${body}`)}`;
}
function verifyOwnerToken(token) {
  if (!token || !process.env.OWNER_JWT_SECRET) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const expected = hmac(`${parts[0]}.${parts[1]}`);
  const a = Buffer.from(parts[2]);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const payload = JSON.parse(b64decode(parts[1]));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  if (payload.role !== "owner") return null;
  return payload;
}
function ownerFromReq(req) { return verifyOwnerToken(bearer(req)); }
function hashId(value) { return crypto.createHash("sha256").update(String(value)).digest("hex"); }

async function sendDataMessage(messaging, fids, payload) {
  const unique = [...new Set(fids.filter(Boolean))];
  let success = 0, failure = 0;
  const settled = await Promise.allSettled(unique.map((fid) => messaging.send({
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
  settled.forEach((result) => {
    if (result.status === "fulfilled") success++;
    else {
      failure++;
      console.error("FCM send failed:", result.reason?.code || result.reason?.message || result.reason);
    }
  });
  return { attempted: unique.length, success, failure };
}

module.exports = { services, sendJson, bearer, ownerFromReq, signOwnerToken, hashId, sendDataMessage };
