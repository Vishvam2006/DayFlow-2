import net from "net";

const IPV4_LOOPBACK = "127.0.0.1";
const IPV6_LOOPBACK = "::1";

function stripPort(value) {
  if (!value) return "";
  const v = String(value).trim();
  // IPv4 with port: 1.2.3.4:5678
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(v)) return v.split(":")[0];
  return v;
}

function normalizeCandidate(raw) {
  const value = stripPort(raw).replace(/^"(.*)"$/, "$1").trim();
  if (!value) return "";
  if (value === "::1") return IPV4_LOOPBACK;
  if (value.startsWith("::ffff:")) return value.slice(7);
  return value;
}

function shouldTrustForwardedHeaders(req) {
  const trustProxySetting = req.app?.get?.("trust proxy");
  return Boolean(trustProxySetting) && trustProxySetting !== false;
}

function parseForwardedCandidates(req) {
  if (!shouldTrustForwardedHeaders(req)) return [];
  const raw = req.headers["x-forwarded-for"];
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((p) => normalizeCandidate(p))
    .filter((ip) => net.isIP(ip));
}

export function extractClientIP(req) {
  const trustForwardedHeaders = shouldTrustForwardedHeaders(req);
  const forwardedCandidates = parseForwardedCandidates(req);

  const candidates = trustForwardedHeaders
    ? [
        forwardedCandidates[0],
        req.headers["x-real-ip"],
        req.headers["cf-connecting-ip"],
        req.ip,
        req.socket?.remoteAddress,
        req.connection?.remoteAddress,
      ]
    : [req.socket?.remoteAddress, req.connection?.remoteAddress, req.ip];

  for (const candidate of candidates) {
    const normalized = normalizeCandidate(candidate);
    if (net.isIP(normalized)) return normalized === IPV6_LOOPBACK ? IPV4_LOOPBACK : normalized;
  }

  return "";
}

export const extractClientIPv4 = extractClientIP;

export function attachClientIp(req, _res, next) {
  req.clientIP = extractClientIP(req);
  next();
}

