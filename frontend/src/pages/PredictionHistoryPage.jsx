import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
  ScanLine,
  Search,
  AlertTriangle,
  X,
} from "lucide-react";
import { apiClient } from "../api/client";
import { EmptyState, ErrorBanner, LoadingState, PageHeader } from "../components/common/StateViews";

const PAGE_SIZE = 10;

export default function PredictionHistoryPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [healthFilter, setHealthFilter] = useState("all"); // all, healthy, diseased
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedScan, setSelectedScan] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { limit: PAGE_SIZE, offset };
      if (search.trim()) params.search = search.trim();
      if (healthFilter === "healthy") params.is_healthy = true;
      if (healthFilter === "diseased") params.is_healthy = false;

      const res = await apiClient.get("/predictions", { params });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [offset, search, healthFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleFilterChange = (newFilter) => {
    setHealthFilter(newFilter);
    setOffset(0);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setOffset(0);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prediction History"
        subtitle="Searchable archive of all uploaded leaf scans, MobileNetV2 versions, and confidence scores"
        action={
          <Link
            to="/disease-detection"
            className="inline-flex items-center gap-1.5 rounded-xl bg-forest-800 px-4 py-2 text-xs font-semibold text-white hover:bg-forest-900"
          >
            <ScanLine className="h-3.5 w-3.5" />
            New Scan
          </Link>
        }
      />

      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-forest-100 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Filter by disease or crop label..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm text-slate-800 focus:border-forest-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { id: "all", label: "All Scans" },
            { id: "healthy", label: "Healthy" },
            { id: "diseased", label: "Diseased" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleFilterChange(tab.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                healthFilter === tab.id
                  ? "bg-forest-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchHistory} />}

      {loading ? (
        <LoadingState message="Loading stored leaf diagnosis history..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon={History}
          title="No matching scan records found"
          description="Try clearing your search filters or upload a leaf image in the Disease Scanner."
          action={
            <Link
              to="/disease-detection"
              className="rounded-xl bg-forest-800 px-4 py-2 text-xs font-semibold text-white hover:bg-forest-900"
            >
              Scan Leaf Image
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-forest-100 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Leaf Image</th>
                  <th className="px-5 py-3.5">Predicted Diagnosis</th>
                  <th className="px-5 py-3.5">Confidence</th>
                  <th className="px-5 py-3.5">Linked Crop</th>
                  <th className="px-5 py-3.5">Model</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((scan) => (
                  <tr key={scan.id} className="hover:bg-forest-50/40">
                    <td className="px-5 py-3.5">
                      <img
                        src={scan.image_url}
                        alt={scan.predicted_label}
                        className="h-12 w-12 rounded-xl border border-slate-200 object-cover"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          scan.is_healthy
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {scan.is_healthy ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        )}
                        {scan.predicted_label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {(scan.confidence_score * 100).toFixed(1)}%
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {scan.crop_name || "Unassigned"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
                        {scan.model_version}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {new Date(scan.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedScan(scan)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-forest-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 text-xs text-slate-500">
            <span>
              Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total} records
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              <button
                type="button"
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset(offset + PAGE_SIZE)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Detail Modal */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Diagnostic Scan Record</h3>
              <button
                type="button"
                onClick={() => setSelectedScan(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <img
                src={selectedScan.image_url}
                alt={selectedScan.predicted_label}
                className="max-h-56 w-full rounded-xl border border-slate-200 bg-slate-900 object-contain"
              />

              <div>
                <p className="text-lg font-bold text-slate-900">{selectedScan.predicted_label}</p>
                <p className="text-xs text-slate-500">
                  SHA-256: <span className="font-mono">{selectedScan.image_hash.slice(0, 16)}...</span> •{" "}
                  {new Date(selectedScan.created_at).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Top-3 Confidence Scores
                </p>
                {(selectedScan.top_predictions || []).map((tp, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2 text-xs"
                  >
                    <span className="font-medium text-slate-800">{tp.label}</span>
                    <span className="font-bold text-forest-800">
                      {(tp.confidence * 100).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}