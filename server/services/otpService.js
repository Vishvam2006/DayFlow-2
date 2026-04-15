import crypto from "crypto";
import EmailOtp from "../models/EmailOtp.js";
import { sendOTP } from "./email/emailService.js";

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_PURPOSE_LOGIN = "login";

function hashOtp(email, otp) {
  return crypto
    .createHash("sha256")
    .update(`${String(email).trim().toLowerCase()}:${String(otp)}`)
    .digest("hex");
}

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function createAndSendLoginOtp(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  const existing = await EmailOtp.findOne({
    email: normalizedEmail,
    purpose: OTP_PURPOSE_LOGIN,
  });

  if (existing?.lastSentAt && Date.now() - existing.lastSentAt.getTime() < OTP_COOLDOWN_MS) {
    return { throttled: true };
  }

  const otp = generateOtp();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  await EmailOtp.findOneAndUpdate(
    { email: normalizedEmail, purpose: OTP_PURPOSE_LOGIN },
    {
      $set: {
        otpHash: hashOtp(normalizedEmail, otp),
        expiresAt,
        attempts: 0,
        maxAttempts: OTP_MAX_ATTEMPTS,
        lastSentAt: now,
      },
      $inc: {
        resendCount: existing ? 1 : 0,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    }
  );

  await sendOTP({
    email: normalizedEmail,
    otp,
    expiresInMinutes: Math.floor(OTP_TTL_MS / 60000),
  });

  return {
    throttled: false,
    expiresAt,
  };
}

export async function verifyLoginOtp(email, otp) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedOtp = String(otp || "").trim();

  if (!normalizedEmail || !normalizedOtp) {
    return { ok: false, statusCode: 400, message: "Email and OTP are required" };
  }

  const record = await EmailOtp.findOne({
    email: normalizedEmail,
    purpose: OTP_PURPOSE_LOGIN,
  });

  if (!record) {
    return { ok: false, statusCode: 400, message: "No OTP found" };
  }

  if (record.attempts >= record.maxAttempts) {
    await EmailOtp.deleteOne({ _id: record._id });
    return { ok: false, statusCode: 429, message: "Too many attempts. Try again." };
  }

  if (Date.now() > record.expiresAt.getTime()) {
    await EmailOtp.deleteOne({ _id: record._id });
    return { ok: false, statusCode: 400, message: "OTP expired" };
  }

  record.attempts += 1;
  await record.save();

  if (record.otpHash !== hashOtp(normalizedEmail, normalizedOtp)) {
    return { ok: false, statusCode: 400, message: "Invalid OTP" };
  }

  await EmailOtp.deleteOne({ _id: record._id });
  return { ok: true };
}
