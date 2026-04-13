import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Globe, ShieldCheck, WarningCircle, ArrowsClockwise } from "@phosphor-icons/react";
import API_BASE_URL from "../../config/api.js";

const cardStyle = "bg-white border border-slate-200 rounded-2xl shadow-sm";
const REQUEST_TIMEOUT_MS = 8000;

const CompanyNetworkManager = () => {
  const [officeName, setOfficeName] = useState("Head Office");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` }),
    []
  );

  const loadNetwork = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${API_BASE_URL}/api/company-network/current`, {
        headers,
        timeout: REQUEST_TIMEOUT_MS,
      });
      if (!response.data?.success) throw new Error("Failed to load network settings.");
      setData(response.data);
      if (response.data?.configuredOffice?.officeName) {
        setOfficeName(response.data.configuredOffice.officeName);
      }
    } catch (err) {
      setError(
        err?.code === "ECONNABORTED"
          ? "Network request timed out. Please retry."
          : err?.response?.data?.message || err?.message || "Unable to load network settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNetwork();
  }, []);

  const handleSetCurrentIp = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/company-network/set-current`,
        { officeName: officeName.trim() || "Head Office" },
        { headers, timeout: REQUEST_TIMEOUT_MS }
      );
      if (!response.data?.success) throw new Error("Failed to update office IP.");
      setSuccess("Office IP updated successfully.");
      await loadNetwork();
    } catch (err) {
      setError(
        err?.code === "ECONNABORTED"
          ? "Network request timed out. Please retry."
          : err?.response?.data?.message || err?.message || "Unable to update office IP."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Office Network Access</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure which office public IP is allowed for attendance clock-in.
        </p>
      </div>

      <div className={`${cardStyle} p-6 space-y-5`}>
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <ArrowsClockwise className="animate-spin" size={18} />
            Loading network configuration...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Your Current Public IP</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Globe size={18} className="text-indigo-600" />
                  {data?.currentIP || "Unavailable"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Configured Office IP</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {data?.configuredOffice?.publicIP || "Not configured"}
                </p>
                {data?.configuredOffice?.officeName && (
                  <p className="text-sm text-slate-500 mt-1">{data.configuredOffice.officeName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="officeName">
                Office Name
              </label>
              <input
                id="officeName"
                className="w-full md:w-[360px] px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value.slice(0, 80))}
                placeholder="Head Office"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSetCurrentIp}
                disabled={saving || !data?.currentIP}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? <ArrowsClockwise className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                {saving ? "Saving..." : "Set as Current Office IP"}
              </button>
              <button
                type="button"
                onClick={loadNetwork}
                disabled={loading || saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
              >
                <ArrowsClockwise size={16} />
                Refresh
              </button>
            </div>

            {data?.isCurrentIpAllowed && (
              <p className="text-emerald-700 text-sm flex items-center gap-2">
                <ShieldCheck size={16} />
                Current IP is already authorized for attendance.
              </p>
            )}

            {success && (
              <p className="text-emerald-700 text-sm flex items-center gap-2">
                <ShieldCheck size={16} />
                {success}
              </p>
            )}
            {error && (
              <p className="text-red-600 text-sm flex items-center gap-2">
                <WarningCircle size={16} />
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CompanyNetworkManager;

