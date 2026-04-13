import net from "net";

const IPV4_LOOPBACK = "127.0.0.1";
const PRIVATE_RANGES = [
  /^10\./,
  /^127\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
];

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

function isPrivateIpv4(ip) {
  return PRIVATE_RANGES.some((rx) => rx.test(ip));
}

function shouldTrustForwardedHeaders(req) {
  // When behind trusted proxies, Express populates req.ips.
  // If not behind proxy, req.ips is usually empty and x-forwarded-for is spoofable.
  if (Array.isArray(req.ips) && req.ips.length > 0) return true;
  const remote = normalizeCandidate(req.socket?.remoteAddress || req.connection?.remoteAddress || "");
  return net.isIPv4(remote) ? isPrivateIpv4(remote) : false;
}

function parseForwardedCandidates(req) {
  if (!shouldTrustForwardedHeaders(req)) return [];
  const raw = req.headers["x-forwarded-for"];
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((p) => normalizeCandidate(p))
    .filter((ip) => net.isIPv4(ip));
}

export function extractClientIPv4(req) {
  const forwardedCandidates = parseForwardedCandidates(req);
  // Client is first in XFF chain if proxy is trusted.
  const xff = forwardedCandidates.length > 0 ? forwardedCandidates[0] : "";
  const candidates = [
    xff,
    req.headers["x-real-ip"],
    req.ip,
    req.socket?.remoteAddress,
    req.connection?.remoteAddress,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeCandidate(candidate);
    if (net.isIPv4(normalized)) return normalized;
  }

  return "";
}

export function attachClientIp(req, _res, next) {
  req.clientIP = extractClientIPv4(req);
  next();
}

