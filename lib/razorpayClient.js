import Razorpay from "razorpay";

let client;
let lastKeyFingerprint;

export function trimEnv(name) {
  const v = process.env[name];
  if (v == null || v === "") return "";
  return String(v).trim().replace(/^["']|["']$/g, "");
}

export function getRazorpayClient() {
  const key_id = trimEnv("RAZORPAY_KEY_ID");
  const key_secret = trimEnv("RAZORPAY_KEY_SECRET");
  if (!key_id || !key_secret) {
    throw new Error("Missing RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET env vars");
  }
  const fp = `${key_id}:${key_secret}`;
  if (!client || lastKeyFingerprint !== fp) {
    client = new Razorpay({ key_id, key_secret });
    lastKeyFingerprint = fp;
  }
  return client;
}

