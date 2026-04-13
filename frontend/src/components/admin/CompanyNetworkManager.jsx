import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowsClockwise,
  Globe,
  PencilSimple,
  Plus,
  ShieldCheck,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import API_BASE_URL from "../../config/api.js";

const REQUEST_TIMEOUT_MS = 8000;
const blankForm = {
  officeName: "",
  publicIP: "",
  description: "",
  isActive: true,
};

const CompanyNetworkManager = () => {
  const [networks, setNetworks] = useState([]);
  const [flaggedRecords, setFlaggedRecords] = useState([]);
  const [currentIP, setCurrentIP] = useState("");
  const [isCurrentIpAllowed, setIsCurrentIpAllowed] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` }),
    []
  );

  const showError = (err, fallback) => {
    setError(
      err?.code === "ECONNABORTED"
        ? "Network request timed out. Please retry."
        : err?.response?.data?.message || err?.message || fallback
    );
  };

  const loadNetworks = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${API_BASE_URL}/api/company-network`, {
        headers,
        timeout: REQUEST_TIMEOUT_MS,
      });
      const flaggedResponse = await axios.get(`${API_BASE_URL}/api/attendance/flagged`, {
        headers,
        timeout: REQUEST_TIMEOUT_MS,
      });
      setNetworks(response.data.networks || []);
      setFlaggedRecords(flaggedResponse.data.records || []);
      setCurrentIP(response.data.currentIP || "");
      setIsCurrentIpAllowed(Boolean(response.data.isCurrentIpAllowed));
    } catch (err) {
      showError(err, "Unable to load approved networks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNetworks();
  }, []);

  const resetForm = () => {
    setEditingId("");
    setForm(blankForm);
  };

  const saveNetwork = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        ...form,
        officeName: form.officeName.trim(),
        publicIP: form.publicIP.trim(),
        description: form.description.trim(),
      };

      if (editingId) {
        await axios.put(`${API_BASE_URL}/api/company-network/${editingId}`, payload, {
          headers,
          timeout: REQUEST_TIMEOUT_MS,
        });
        setSuccess("Approved network updated.");
      } else {
        await axios.post(`${API_BASE_URL}/api/company-network`, payload, {
          headers,
          timeout: REQUEST_TIMEOUT_MS,
        });
        setSuccess("Approved network added.");
      }

      resetForm();
      await loadNetworks();
    } catch (err) {
      showError(err, "Unable to save approved network.");
    } finally {
      setSaving(false);
    }
  };

  const addCurrentNetworkIp = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await axios.post(
        `${API_BASE_URL}/api/company-network/add-current`,
        {
          officeName: form.officeName.trim() || "Current Network",
          description: form.description.trim(),
        },
        { headers, timeout: REQUEST_TIMEOUT_MS }
      );
      setSuccess("Your current network IP was added to the whitelist.");
      resetForm();
      await loadNetworks();
    } catch (err) {
      showError(err, "Unable to add your current network IP.");
    } finally {
      setSaving(false);
    }
  };

  const editNetwork = (network) => {
    setEditingId(network._id);
    setForm({
      officeName: network.officeName || "",
      publicIP: network.publicIP || "",
      description: network.description || "",
      isActive: network.isActive !== false,
    });
  };

  const removeNetwork = async (id) => {
    if (!window.confirm("Remove this approved network?")) return;
    setError("");
    setSuccess("");
    try {
      await axios.delete(`${API_BASE_URL}/api/company-network/${id}`, {
        headers,
        timeout: REQUEST_TIMEOUT_MS,
      });
      setSuccess("Approved network removed.");
      await loadNetworks();
    } catch (err) {
      showError(err, "Unable to remove approved network.");
    }
  };

  const activeCount = networks.filter((network) => network.isActive).length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Approved Attendance Networks</h1>
        <p className="text-sm text-slate-500 mt-1">
          Whitelist office WiFi and approved hotspot public IPs. Unlisted check-ins are allowed but flagged for HR review.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 h-fit">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800">
              {editingId ? "Edit Network" : "Add Network"}
            </h2>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-xs text-slate-500 hover:text-slate-900">
                Cancel edit
              </button>
            )}
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Network Name</span>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={form.officeName}
                onChange={(e) => setForm({ ...form, officeName: e.target.value.slice(0, 80) })}
                placeholder="Head Office WiFi"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Public IP</span>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={form.publicIP}
                onChange={(e) => setForm({ ...form, publicIP: e.target.value })}
                placeholder="203.0.113.10"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Description</span>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value.slice(0, 160) })}
                placeholder="Optional note"
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active whitelist entry
            </label>

            <button
              type="button"
              onClick={saveNetwork}
              disabled={saving || !form.officeName.trim() || !form.publicIP.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {saving ? <ArrowsClockwise className="animate-spin" size={16} /> : <Plus size={16} />}
              {editingId ? "Save Changes" : "Add Approved IP"}
            </button>

            <button
              type="button"
              onClick={addCurrentNetworkIp}
              disabled={saving || !currentIP}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 disabled:opacity-60"
            >
              <ShieldCheck size={16} />
              Add My Current Network IP
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Current Public IP</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Globe size={18} className="text-indigo-600" />
                  {currentIP || "Unavailable"}
                </p>
              </div>
              <div className={`px-3 py-2 rounded-lg text-sm font-semibold border ${isCurrentIpAllowed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                {isCurrentIpAllowed ? "Current IP approved" : "Current IP not approved"}
              </div>
              <button
                type="button"
                onClick={loadNetworks}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
              >
                <ArrowsClockwise size={16} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {success && (
            <div className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
              <ShieldCheck size={16} />
              {success}
            </div>
          )}
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <WarningCircle size={16} />
              {error}
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Whitelisted IPs</h2>
                <p className="text-xs text-slate-500 mt-1">{activeCount} active of {networks.length} total</p>
              </div>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-slate-500 flex items-center gap-2">
                <ArrowsClockwise className="animate-spin" size={16} />
                Loading approved networks...
              </div>
            ) : networks.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No approved networks yet. Add the office WiFi public IP to begin.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {networks.map((network) => (
                  <div key={network._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{network.officeName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${network.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                          {network.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mt-1">{network.publicIP}</p>
                      {network.description && <p className="text-xs text-slate-500 mt-1">{network.description}</p>}
                      {network.lastMatchedAt && (
                        <p className="text-xs text-slate-400 mt-1">
                          Last matched {new Date(network.lastMatchedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => editNetwork(network)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                      >
                        <PencilSimple size={15} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeNetwork(network._id)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100"
                      >
                        <Trash size={15} />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-800">Flagged Attendance Review</h2>
              <p className="text-xs text-slate-500 mt-1">
                Recent check-ins from unapproved or undetected networks.
              </p>
            </div>

            {flaggedRecords.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">No flagged check-ins found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {flaggedRecords.map((record) => (
                  <div key={record._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {record.employee?.name || "Unknown Employee"}
                        {record.employee?.employeeId ? ` (${record.employee.employeeId})` : ""}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {record.date} at {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "unknown time"}
                      </p>
                    </div>
                    <div className="text-sm md:text-right">
                      <p className="font-semibold text-amber-700">{record.flagReason || "Unapproved network"}</p>
                      <p className="text-xs text-slate-500 mt-1">IP: {record.deviceIP || "Unavailable"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Mobile hotspots and ISP connections can change public IPs. Add only approved temporary hotspot IPs, review flagged check-ins regularly, and remove stale entries when a hotspot rotates.
      </div>
    </div>
  );
};

export default CompanyNetworkManager;
