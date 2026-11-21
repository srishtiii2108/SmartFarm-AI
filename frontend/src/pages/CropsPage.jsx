import React, { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Loader2,
  MapPin,
  Plus,
  Search,
  Sprout,
  Trash2,
  X,
} from "lucide-react";
import { apiClient } from "../api/client";
import { EmptyState, ErrorBanner, LoadingState, PageHeader } from "../components/common/StateViews";

const CATEGORY_OPTIONS = [
  { value: "tomato", label: "Tomato" },
  { value: "potato", label: "Potato" },
  { value: "bell_pepper", label: "Bell Pepper" },
  { value: "other", label: "Other Crop" },
];

const STATUS_TABS = [
  { value: "all", label: "All Plots" },
  { value: "active", label: "Active" },
  { value: "harvested", label: "Harvested" },
  { value: "diseased", label: "Needs Care" },
  { value: "archived", label: "Archived" },
];

const STATUS_LABELS = {
  active: "Active",
  harvested: "Harvested",
  diseased: "Needs Care",
  archived: "Archived",
};

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  harvested: "bg-sky-50 text-sky-800 border-sky-200",
  diseased: "bg-amber-50 text-amber-800 border-amber-200",
  archived: "bg-slate-100 text-slate-700 border-slate-200",
};

const INITIAL_FORM = {
  name: "",
  variety: "",
  crop_category: "tomato",
  planting_date: new Date().toISOString().split("T")[0],
  expected_harvest_date: "",
  status: "active",
  location_name: "Nashik North Plot",
  latitude: "19.9975",
  longitude: "73.7898",
};

export default function CropsPage() {
  const [crops, setCrops] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchCrops = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { limit: 100, offset: 0 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await apiClient.get("/crops", { params });
      setCrops(res.data.items || []);
      setTotal(res.data.total ?? (res.data.items || []).length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  const handleCreateCrop = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.planting_date) return;

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        variety: form.variety.trim() || null,
        crop_category: form.crop_category,
        planting_date: form.planting_date,
        expected_harvest_date: form.expected_harvest_date || null,
        status: form.status,
        location_name: form.location_name.trim() || null,
        latitude: form.latitude !== "" ? Number(form.latitude) : null,
        longitude: form.longitude !== "" ? Number(form.longitude) : null,
      };

      await apiClient.post("/crops", payload);
      setShowModal(false);
      setForm(INITIAL_FORM);
      setNotice(`Added "${payload.name}" to your farm plots.`);
      await fetchCrops();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (cropId, newStatus, cropName) => {
    setUpdatingId(cropId);
    setError("");
    try {
      await apiClient.patch(`/crops/${cropId}`, { status: newStatus });
      const label = STATUS_LABELS[newStatus] || newStatus;
      setNotice(`Updated "${cropName}" status to "${label}".`);
      await fetchCrops();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteCrop = async (crop) => {
    if (!window.confirm(`Remove "${crop.name}" from your farm plots? Past leaf scans will still be saved.`)) {
      return;
    }
    setError("");
    try {
      await apiClient.delete(`/crops/${crop.id}`);
      setNotice(`Removed "${crop.name}" from your farm plots.`);
      await fetchCrops();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crop & Plot Management"
        subtitle="Add your farm plots, track planting-to-harvest dates, and link leaf health scans"
        action={
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-forest-800 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-forest-900"
          >
            <Plus className="h-4 w-4" />
            Add Crop Plot
          </button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={fetchCrops} />}

      {notice && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs font-medium text-emerald-900">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            {notice}
          </span>
          <button
            type="button"
            onClick={() => setNotice("")}
            className="text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Status Tabs */}
      <div className="flex flex-col gap-3 rounded-2xl border border-forest-100 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by crop name, variety, or plot location..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-forest-600 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === tab.value
                  ? "bg-forest-800 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading your farm plots..." />
      ) : crops.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="No crop plots added yet"
          description="Add your Tomato, Potato, or Bell Pepper plots to track harvest dates and link leaf health scans."
          action={
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="rounded-xl bg-forest-800 px-4 py-2 text-xs font-semibold text-white hover:bg-forest-900"
            >
              + Add First Crop Plot
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {crops.map((crop) => (
            <div
              key={crop.id}
              className="flex flex-col justify-between rounded-2xl border border-forest-100 bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-forest-200 hover:shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-forest-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-forest-800 ring-1 ring-forest-200/60">
                      <Sprout className="h-3 w-3 text-forest-700" />
                      {crop.crop_category.replace("_", " ")}
                    </span>
                    <h3 className="mt-2.5 text-base font-bold text-slate-900">{crop.name}</h3>
                    {crop.variety && (
                      <p className="mt-0.5 text-xs font-medium text-slate-500">
                        Variety: <span className="text-slate-700">{crop.variety}</span>
                      </p>
                    )}
                  </div>

                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                      STATUS_STYLES[crop.status] || STATUS_STYLES.active
                    }`}
                  >
                    {STATUS_LABELS[crop.status] || crop.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-forest-700" />
                    <span>
                      Planted: <strong className="text-slate-800">{crop.planting_date}</strong>
                      {crop.expected_harvest_date
                        ? ` • Harvest: ${crop.expected_harvest_date}`
                        : ""}
                    </span>
                  </div>
                  {crop.location_name && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-forest-700" />
                      <span>{crop.location_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Controls */}
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <select
                  aria-label="Update crop status"
                  disabled={updatingId === crop.id}
                  value={crop.status}
                  onChange={(e) => handleStatusUpdate(crop.id, e.target.value, crop.name)}
                  className="rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-forest-300 focus:border-forest-600 focus:outline-none"
                >
                  <option value="active">Status: Active</option>
                  <option value="harvested">Status: Harvested</option>
                  <option value="diseased">Status: Needs Care</option>
                  <option value="archived">Status: Archived</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleDeleteCrop(crop)}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  title="Remove crop plot"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 0 && (
        <p className="text-right text-xs text-slate-400">
          Showing {crops.length} of {total} crop {total === 1 ? "plot" : "plots"}
        </p>
      )}

      {/* Add Crop Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-forest-100 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add New Crop Plot</h3>
                <p className="text-xs text-slate-500">
                  Track growth timeline and connect leaf scans to this plot
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCrop} className="mt-4 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Crop / Plot Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Field A - Roma Tomato"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-forest-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Crop Type *</label>
                  <select
                    value={form.crop_category}
                    onChange={(e) => setForm({ ...form, crop_category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 focus:border-forest-600 focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Variety <span className="font-normal text-slate-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.variety}
                    onChange={(e) => setForm({ ...form, variety: e.target.value })}
                    placeholder="e.g., Kufri Jyoti / California Wonder"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-forest-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Planting Date *</label>
                  <input
                    type="date"
                    required
                    value={form.planting_date}
                    onChange={(e) => setForm({ ...form, planting_date: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-800 focus:border-forest-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Expected Harvest Date
                  </label>
                  <input
                    type="date"
                    value={form.expected_harvest_date}
                    onChange={(e) => setForm({ ...form, expected_harvest_date: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-800 focus:border-forest-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Field / Farm Location
                </label>
                <input
                  type="text"
                  value={form.location_name}
                  onChange={(e) => setForm({ ...form, location_name: e.target.value })}
                  placeholder="e.g., Nashik, Maharashtra"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-forest-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-forest-800 px-5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-forest-900 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Crop Plot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}