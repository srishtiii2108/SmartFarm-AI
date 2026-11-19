import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  CheckCircle2,
  Loader2,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { apiClient, getApiBaseUrl } from "../api/client";
import { EmptyState, ErrorBanner, LoadingState, PageHeader } from "../components/common/StateViews";

const DEFAULT_STATUSES = ["available", "reserved", "sold", "spoiled"];

function formatStatusLabel(status) {
  if (!status) return "";
  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function getStatusStyle(status) {
  const key = String(status || "").toLowerCase();
  if (["available", "in_storage", "in_stock", "stored"].includes(key)) {
    return "bg-forest-50 text-forest-800 border-forest-200";
  }
  if (key === "sold") {
    return "bg-sky-50 text-sky-800 border-sky-200";
  }
  if (key === "reserved") {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }
  if (["spoiled", "expired", "damaged"].includes(key)) {
    return "bg-red-50 text-red-800 border-red-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function extractAllowedStatuses(spec) {
  try {
    const schemas = spec?.components?.schemas || {};
    const createSchema =
      schemas.InventoryCreate ||
      schemas.ProduceInventoryCreate ||
      Object.values(schemas).find(
        (s) => s?.properties?.produce_name && s?.properties?.status
      );
    const statusProp = createSchema?.properties?.status;
    if (!statusProp) return null;

    let enumValues = statusProp.enum;
    if (!enumValues && statusProp.$ref) {
      const refName = statusProp.$ref.split("/").pop();
      enumValues = schemas[refName]?.enum;
    }
    if (!enumValues && Array.isArray(statusProp.anyOf)) {
      for (const branch of statusProp.anyOf) {
        if (Array.isArray(branch.enum)) {
          enumValues = branch.enum;
          break;
        }
        if (branch.$ref) {
          const refName = branch.$ref.split("/").pop();
          if (Array.isArray(schemas[refName]?.enum)) {
            enumValues = schemas[refName].enum;
            break;
          }
        }
      }
    }

    if (Array.isArray(enumValues) && enumValues.length > 0) {
      return {
        statuses: enumValues,
        defaultStatus:
          typeof statusProp.default === "string" && enumValues.includes(statusProp.default)
            ? statusProp.default
            : enumValues[0],
      };
    }
  } catch {
    // Fallback to DEFAULT_STATUSES
  }
  return null;
}

export default function InventoryPage() {
  const [allowedStatuses, setAllowedStatuses] = useState(DEFAULT_STATUSES);
  const [defaultStatus, setDefaultStatus] = useState("available");

  const [items, setItems] = useState([]);
  const [crops, setCrops] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    crop_id: "",
    produce_name: "",
    quantity: "",
    unit: "kg",
    harvest_date: new Date().toISOString().split("T")[0],
    status: "available",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  // Sync exact status enum values from backend OpenAPI schema
  useEffect(() => {
    let active = true;
    const openApiUrl = getApiBaseUrl().replace(/\/api\/v1\/?$/, "/openapi.json");
    axios
      .get(openApiUrl, { timeout: 5000 })
      .then((res) => {
        if (!active) return;
        const extracted = extractAllowedStatuses(res.data);
        if (extracted) {
          setAllowedStatuses(extracted.statuses);
          setDefaultStatus(extracted.defaultStatus);
          setForm((prev) => ({
            ...prev,
            status: extracted.statuses.includes(prev.status)
              ? prev.status
              : extracted.defaultStatus,
          }));
        }
      })
      .catch(() => {
        // Keep DEFAULT_STATUSES fallback
      });
    return () => {
      active = false;
    };
  }, []);

  const fetchInventoryAndCrops = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { limit: 100, offset: 0 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const [invRes, cropsRes] = await Promise.all([
        apiClient.get("/inventory", { params }),
        apiClient.get("/crops", { params: { limit: 100 } }),
      ]);

      setItems(invRes.data.items || []);
      setCrops(cropsRes.data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchInventoryAndCrops();
  }, [fetchInventoryAndCrops]);

  const resetForm = () => {
    setForm({
      crop_id: "",
      produce_name: "",
      quantity: "",
      unit: "kg",
      harvest_date: new Date().toISOString().split("T")[0],
      status: defaultStatus,
      notes: "",
    });
  };

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    if (!form.produce_name.trim() || !form.quantity) return;

    setSaving(true);
    setError("");
    try {
      const payload = {
        crop_id: form.crop_id || null,
        produce_name: form.produce_name.trim(),
        quantity: Number(form.quantity),
        unit: form.unit,
        harvest_date: form.harvest_date,
        status: form.status || defaultStatus,
        notes: form.notes.trim() || null,
      };

      await apiClient.post("/inventory", payload);
      setShowModal(false);
      resetForm();
      setNotice(`Recorded ${payload.quantity} ${payload.unit} of "${payload.produce_name}".`);
      await fetchInventoryAndCrops();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setError("");
    try {
      await apiClient.patch(`/inventory/${id}`, { status: newStatus });
      setNotice(`Inventory batch status updated to "${formatStatusLabel(newStatus)}".`);
      await fetchInventoryAndCrops();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete inventory batch "${item.produce_name}"?`)) return;
    setError("");
    try {
      await apiClient.delete(`/inventory/${item.id}`);
      setNotice(`Deleted inventory record "${item.produce_name}".`);
      await fetchInventoryAndCrops();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produce & Inventory Management"
        subtitle="Record harvested yields, link batches to source crops, and monitor post-harvest stock status"
        action={
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-forest-800 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-forest-900"
          >
            <Plus className="h-4 w-4" />
            Record Harvest Batch
          </button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={fetchInventoryAndCrops} />}

      {notice && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs font-medium text-emerald-900">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            {notice}
          </span>
          <button type="button" onClick={() => setNotice("")} className="text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-forest-100 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search produce batch name..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm text-slate-800 focus:border-forest-600 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "all"
                ? "bg-forest-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Batches
          </button>
          {allowedStatuses.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === st
                  ? "bg-forest-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {formatStatusLabel(st)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading harvested produce inventory..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No produce batches recorded yet"
          description="Log your harvested Tomato, Potato, or Bell Pepper yields to track cold-room stock and sales."
          action={
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="rounded-xl bg-forest-800 px-4 py-2 text-xs font-semibold text-white hover:bg-forest-900"
            >
              + Record First Harvest
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-forest-100 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Produce Batch</th>
                  <th className="px-5 py-3.5">Quantity</th>
                  <th className="px-5 py-3.5">Source Crop</th>
                  <th className="px-5 py-3.5">Harvest Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-forest-50/40">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{item.produce_name}</p>
                      {item.notes && <p className="text-xs text-slate-500">{item.notes}</p>}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-forest-800">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {item.crop_name || "General Harvest"}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{item.harvest_date}</td>
                    <td className="px-5 py-3.5">
                      <select
                        aria-label="Inventory status"
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className={`rounded-full border px-3 py-1 text-xs font-bold focus:outline-none ${getStatusStyle(
                          item.status
                        )}`}
                      >
                        {allowedStatuses.map((st) => (
                          <option key={st} value={st}>
                            {formatStatusLabel(st)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        title="Delete batch"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Harvest Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Record Harvested Produce</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="mt-4 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700">Produce Batch Name *</label>
                <input
                  type="text"
                  required
                  value={form.produce_name}
                  onChange={(e) => setForm({ ...form, produce_name: e.target.value })}
                  placeholder="e.g., Grade-A Roma Tomatoes"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-forest-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Link Source Crop (Optional)</label>
                <select
                  value={form.crop_id}
                  onChange={(e) => setForm({ ...form, crop_id: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-forest-600 focus:outline-none"
                >
                  <option value="">-- Unlinked Harvest --</option>
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.crop_category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="250"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-forest-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Unit *</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-forest-600 focus:outline-none"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="quintal">Quintal</option>
                    <option value="ton">Metric Ton</option>
                    <option value="crates">Crates</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Harvest Date *</label>
                  <input
                    type="date"
                    required
                    value={form.harvest_date}
                    onChange={(e) => setForm({ ...form, harvest_date: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-forest-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Storage Status *</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-forest-600 focus:outline-none"
                  >
                    {allowedStatuses.map((st) => (
                      <option key={st} value={st}>
                        {formatStatusLabel(st)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Storage Notes (Optional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g., Cold room #2 at 12°C, ventilated crates"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-forest-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-forest-800 px-5 py-2 text-xs font-semibold text-white hover:bg-forest-900 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Record Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}