import API_BASE_URL from "../config/api.js";

const REQUEST_TIMEOUT_MS = 10000;
const CACHE_TTL_MS = 60 * 1000;

const listCache = new Map();
const detailCache = new Map();
const inflightRequests = new Map();

function nowMs() {
  return Date.now();
}

function isFresh(entry) {
  return Boolean(entry?.expiresAt && entry.expiresAt > nowMs());
}

function withTimeout(signal, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error("Request timeout")), timeoutMs);

  const abort = () => controller.abort(new Error("Request aborted"));
  if (signal) {
    if (signal.aborted) abort();
    signal.addEventListener("abort", abort, { once: true });
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener("abort", abort);
    },
  };
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function ensureArrayPayload(payload, fallbackMessage) {
  if (!Array.isArray(payload)) throw new Error(fallbackMessage);
  return payload;
}

function ensureObjectPayload(payload, fallbackMessage) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error(fallbackMessage);
  }
  return payload;
}

function buildAuthHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson(url, { token, signal, timeoutMs } = {}) {
  const { signal: timeoutSignal, cleanup } = withTimeout(signal, timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...buildAuthHeaders(token),
      },
      signal: timeoutSignal,
    });

    const payload = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error(payload?.message || "Failed to fetch analytics data.");
    }

    return payload;
  } finally {
    cleanup();
  }
}

function listCacheKey({ windowDays = 30, baselineDays = 90 }) {
  return `${windowDays}:${baselineDays}`;
}

function detailCacheKey({ employeeId, windowDays = 30, baselineDays = 90 }) {
  return `${employeeId}:${windowDays}:${baselineDays}`;
}

export async function fetchAnalyticsList(
  { token, windowDays = 30, baselineDays = 90, force = false, signal } = {}
) {
  const key = listCacheKey({ windowDays, baselineDays });
  const cached = listCache.get(key);
  if (!force && isFresh(cached)) return cached.value;

  const inflightKey = `list:${key}`;
  if (!force && inflightRequests.has(inflightKey)) return inflightRequests.get(inflightKey);

  const params = new URLSearchParams({
    windowDays: String(windowDays),
    baselineDays: String(baselineDays),
  });

  const request = fetchJson(`${API_BASE_URL}/api/analytics?${params.toString()}`, {
    token,
    signal,
  })
    .then((payload) => ensureArrayPayload(payload, "Invalid analytics list response."))
    .then((value) => {
      listCache.set(key, { value, expiresAt: nowMs() + CACHE_TTL_MS });
      return value;
    })
    .finally(() => {
      inflightRequests.delete(inflightKey);
    });

  inflightRequests.set(inflightKey, request);
  return request;
}

export async function fetchAnalyticsEmployee(
  { token, employeeId, windowDays = 30, baselineDays = 90, force = false, signal } = {}
) {
  if (!employeeId) throw new Error("Employee id is required.");

  const key = detailCacheKey({ employeeId, windowDays, baselineDays });
  const cached = detailCache.get(key);
  if (!force && isFresh(cached)) return cached.value;

  const inflightKey = `detail:${key}`;
  if (!force && inflightRequests.has(inflightKey)) return inflightRequests.get(inflightKey);

  const params = new URLSearchParams({
    windowDays: String(windowDays),
    baselineDays: String(baselineDays),
  });

  const request = fetchJson(
    `${API_BASE_URL}/api/analytics/employee/${encodeURIComponent(employeeId)}?${params.toString()}`,
    { token, signal }
  )
    .then((payload) => ensureObjectPayload(payload, "Invalid employee analytics response."))
    .then((value) => {
      detailCache.set(key, { value, expiresAt: nowMs() + CACHE_TTL_MS });
      return value;
    })
    .finally(() => {
      inflightRequests.delete(inflightKey);
    });

  inflightRequests.set(inflightKey, request);
  return request;
}

