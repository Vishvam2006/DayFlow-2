import crypto from "crypto";

const BOT_SECRET_HEADER = "x-bot-secret-key";

const hashSecret = (secret) =>
  crypto.createHash("sha256").update(String(secret)).digest();

const botSecretMiddleware = (req, res, next) => {
  const expectedSecret =
    process.env.BOT_SECRET_KEY || process.env.HRMS_BOT_SECRET_KEY;
  const providedSecret = req.get(BOT_SECRET_HEADER);

  if (!expectedSecret) {
    return res.status(500).json({
      success: false,
      error: "Bot API secret is not configured.",
    });
  }

  if (!providedSecret) {
    return res.status(401).json({
      success: false,
      error: "Bot API secret is required.",
    });
  }

  const isValid = crypto.timingSafeEqual(
    hashSecret(providedSecret),
    hashSecret(expectedSecret),
  );

  if (!isValid) {
    return res.status(401).json({
      success: false,
      error: "Invalid bot API secret.",
    });
  }

  return next();
};

export default botSecretMiddleware;
