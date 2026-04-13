import net from "net";
import https from "https";

const IPV4_LOOPBACK = "127.0.0.1";
const IPV6_LOOPBACK = "::1";

// We fetch the public IP every time detection is needed (e.g., local dev)
// to ensure it updates instantly when switching WiFi networks.

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

function isPrivateOrLoopback(ip) {
  if (!ip) return true;
  if (ip === IPV4_LOOPBACK || ip === IPV6_LOOPBACK) return true;
  // Private ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x
  if (/^10\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[01])\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  return false;
}

function parseForwardedCandidates(req) {
  // Always check forwarded headers unconditionally 
  // It's the safest fallback for PaaS platforms.
  const raw = req.headers["x-forwarded-for"];
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((p) => normalizeCandidate(p))
    .filter((ip) => net.isIP(ip));
}

/**
 * Fetch the server's real public IP from ipify.
 * No caching so it updates instantly when network changes.
 */
async function fetchServerPublicIp() {
  try {
    let ip = "";

    if (typeof fetch !== "undefined") {
      // Node 18+ native fetch
      const res = await fetch("https://api.ipify.org?format=json", {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        ip = String(data.ip || "").trim();
      }
    } else {
      // Fallback using Node's built-in https module
      ip = await new Promise((resolve) => {
        const req = https.get("https://api.ipify.org?format=json", (res) => {
          let body = "";
          res.on("data", (chunk) => { body += chunk; });
          res.on("end", () => {
            try {
              resolve(JSON.parse(body).ip || "");
            } catch {
              resolve("");
            }
          });
        });
        req.on("error", () => resolve(""));
        req.setTimeout(4000, () => { req.destroy(); resolve(""); });
      });
    }

    if (ip && net.isIP(ip) && !isPrivateOrLoopback(ip)) {
      return ip;
    }
  } catch (err) {
    // Silently continue
  }

  return "";
}

export function extractClientIP(req) {
  const forwardedCandidates = parseForwardedCandidates(req);

  const candidates = [
    // X-Forwarded-For is always the primary source of truth when deployed
    forwardedCandidates[0],
    req.headers["x-real-ip"],
    req.headers["cf-connecting-ip"],
    req.ip,
    req.socket?.remoteAddress,
    req.connection?.remoteAddress,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeCandidate(candidate);
    if (net.isIP(normalized)) return normalized === IPV6_LOOPBACK ? IPV4_LOOPBACK : normalized;
  }

  return "";
}

export const extractClientIPv4 = extractClientIP;

/**
 * Middleware that attaches req.clientIP.
 *
 * If the detected IP is a loopback or private address (which happens when the
 * frontend and backend run on the same machine, or behind an internal reverse
 * proxy without trust-proxy configured), we fall back to fetching the real
 * public IP from ipify so that the whitelist comparison works correctly.
 *
 * In production (e.g., Render), we skip the fallback to avoid using the 
 * server's own IP as the client IP.
 */
export async function attachClientIp(req, _res, next) {
  const detected = extractClientIP(req);
  const isProd = process.env.NODE_ENV === "production" || process.env.RENDER === "true";

  if (detected && !isPrivateOrLoopback(detected)) {
    // Already a real public IP
    req.clientIP = detected;
    return next();
  }

  // If in production, we do NOT fetch the server's own public IP as it 
  // would be a Render/Cloud IP, not the employee's office WiFi IP.
  if (isProd) {
    req.clientIP = detected;
    return next();
  }

  // Local Development fallback:
  // If we got loopback/private, fetch the host's actual public IP from ipify.
  req.clientIP = await fetchServerPublicIp();
  next();
}
