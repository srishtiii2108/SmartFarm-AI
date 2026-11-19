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

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  harvested: "bg-sky-50 text-sky-800 border-sky-200",
  diseased: "bg-red-50 text-red-800 border-red-200",
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
      setNotice(`Registered crop "${payload.name}" in PostgreSQL.`);
      await fetchCrops();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (cropId, newStatus) => {
    setUpdatingId(cropId);
    setError("");
    try {
      await apiClient.patch(`/crops/${cropId}`, { status: newStatus });
      setNotice(`Updated crop lifecycle status to "${newStatus}".`);
      await fetchCrops();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteCrop = async (crop) => {
    if (!window.confirm(`Delete "${crop.name}"? Linked scans will remain unassigned.`)) return;
    setError("");
    try {
      await apiClient.delete(`/crops/${crop.id}`);
      setNotice(`Removed "${crop.name}" from active farm records.`);
      await fetchCrops();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crop Management"
        subtitle="Register active farm plots, track planting-to-harvest timelines, and link leaf disease scans"
        action={
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-forest-800 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-forest-900"
          >
            <Plus className="h-4 w-4" />
            Register Crop Plot
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
          <button type="button" onClick={() => setNotice("")} className="text-emerald-700 hover:underline">
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
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm text-slate-800 focus:border-forest-600 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {["all", "active", "harvested", "diseased", "archived"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition ${
                statusFilter === st
                  ? "bg-forest-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading registered farm crops..." />
      ) : crops.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="No crops registered yet"
          description="Register your Tomato, Potato, or Bell Pepper plots to track harvest timelines and link disease diagnostics."
          action={
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="rounded-xl bg-forest-800 px-4 py-2 text-xs font-semibold text-white hover:bg-forest-900"
            >
              + Add First Crop
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {crops.map((crop) => (
            <div
              key={crop.id}
              className="flex flex-col justify-between rounded-2xl border border-forest-100 bg-white p-5 shadow-xs transition hover:border-forest-200"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block rounded-lg bg-forest-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-forest-800">
                      {crop.crop_category.replace("_", " ")}
                    </span>
                    <h3 className="mt-2 text-base font-bold text-slate-900">{crop.name}</h3>
                    {crop.variety && (
                      <p className="text-xs font-medium text-slate-500">Variety: {crop.variety}</p>
                    )}
                  </div>

                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                      STATUS_STYLES[crop.status] || STATUS_STYLES.active
                    }`}
                  >
                    {crop.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-forest-700" />
                    <span>
                      Planted: <strong>{crop.planting_date}</strong>
                      {crop.expected_harvest_date ? ` • Harvest: ${crop.expected_harvest_date}` : ""}
                    </span>
                  </div>
                  {crop.location_name && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-forest-700" />
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
                  onChange={(e) => handleStatusUpdate(crop.id, e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-forest-600 focus:outline-none"
                >
                  <option value="active">Status: Active</option>
                  <option value="harvested">Status: Harvested</option>
                  <option value="diseased">Status: Diseased</option>
                  <option value="archived">Status: Archived</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleDeleteCrop(crop)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  title="Delete crop"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 0 && (
        <p className="text-right text-xs text-slate-400">Showing {crops.length} of {total} registered plots</p>
      )}

      {/* Register Crop Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Register New Crop Plot</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCrop} className="mt-4 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700">Crop / Plot Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Field A - Roma Tomato"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-forest-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Crop Category *</label>
                  <select
                    value={form.crop_category}
                    onChange={(e) => setForm({ ...form, crop_category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-forest-600 focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Variety (Optional)</label>
                  <input
                    type="text"
                    value={form.variety}
                    onChange={(e) => setForm({ ...form, variety: e.target.value })}
                    placeholder="e.g., Kufri Jyoti / California Wonder"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-forest-600 focus:outline-none"
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
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-forest-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Expected Harvest</label>
                  <input
                    type="date"
                    value={form.expected_harvest_date}
                    onChange={(e) => setForm({ ...form, expected_harvest_date: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-forest-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Farm Location Name</label>
                <input
                  type="text"
                  value={form.location_name}
                  onChange={(e) => setForm({ ...form, location_name: e.target.value })}
                  placeholder="e.g., Nashik, Maharashtra"
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
                  Save Crop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}