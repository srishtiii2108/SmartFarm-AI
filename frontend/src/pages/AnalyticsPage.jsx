import React, { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  CloudSun,
  Download,
  FileSpreadsheet,
  Loader2,
  Package,
  RefreshCw,
  ScanLine,
  Sprout,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiClient } from "../api/client";
import { EmptyState, ErrorBanner, LoadingState, PageHeader } from "../components/common/StateViews";

const PIE_COLORS = ["#2d6f4b", "#0284c7", "#d97706", "#64748b", "#7c3aed"];

const EXPORT_TARGETS = [
  {
    key: "predictions",
    title: "Disease Predictions CSV",
    desc: "All MobileNetV2 scans, labels, confidence scores & image URLs",
    icon: ScanLine,
  },
  {
    key: "crops",
    title: "Registered Crops CSV",
    desc: "Plot names, categories, planting/harvest dates & coordinates",
    icon: Sprout,
  },
  {
    key: "inventory",
    title: "Produce Inventory CSV",
    desc: "Harvested yield quantities, units, storage status & notes",
    icon: Package,
  },
  {
    key: "weather",
    title: "Weather Observations CSV",
    desc: "Persisted Open-Meteo temperature, humidity & rainfall logs",
    icon: CloudSun,
  },
];

export default function AnalyticsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingKey, setDownloadingKey] = useState("");
  const [downloadNotice, setDownloadNotice] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/analytics/reports");
      setReport(res.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleDownloadCsv = async (datasetType) => {
    setDownloadingKey(datasetType);
    setError("");
    setDownloadNotice("");
    try {
      const res = await apiClient.get(`/analytics/export/${datasetType}`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `smartfarm_${datasetType}_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setDownloadNotice(`Exported "${datasetType}" report as CSV.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloadingKey("");
    }
  };

  if (loading) return <LoadingState message="Compiling cross-module farm intelligence reports..." />;
  if (error && !report) return <ErrorBanner message={error} onRetry={fetchReport} />;
  if (!report) return null;

  const {
    kpis,
    crops_by_category = [],
    disease_distribution = [],
    inventory_summary = [],
  } = report;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & CSV Reporting Suite"
        subtitle="Cross-module agricultural aggregations and streaming CSV exports from live PostgreSQL tables"
        action={
          <button
            type="button"
            onClick={fetchReport}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Report
          </button>
        }
      />

      {error && <ErrorBanner message={error} />}

      {downloadNotice && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs font-medium text-emerald-900">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            {downloadNotice}
          </span>
          <button
            type="button"
            onClick={() => setDownloadNotice("")}
            className="text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Streaming CSV Export Hub */}
      <div className="rounded-2xl border border-forest-100 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-forest-700" />
          <h2 className="text-base font-bold text-slate-900">Streaming CSV Data Exports</h2>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Download auditable datasets directly from PostgreSQL for external spreadsheet or agronomy review
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {EXPORT_TARGETS.map((item) => {
            const Icon = item.icon;
            const isDownloading = downloadingKey === item.key;
            return (
              <div
                key={item.key}
                className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
              >
                <div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-100 text-forest-800">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
                </div>

                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={() => handleDownloadCsv(item.key)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-forest-800 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-forest-900 disabled:opacity-50"
                >
                  {isDownloading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Download CSV
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Crops by Category Pie Chart */}
        <div className="rounded-2xl border border-forest-100 bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900">Registered Crops by Category</h2>
          <p className="text-xs text-slate-500">
            Total active & historical plots: {kpis.total_registered_crops}
          </p>

          {crops_by_category.length > 0 ? (
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={crops_by_category}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label={({ category, count }) => `${category}: ${count}`}
                  >
                    {crops_by_category.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={Sprout}
                title="No crop category data yet"
                description="Register crops in Crop Management to view category distribution."
              />
            </div>
          )}
        </div>

        {/* Disease Frequency Chart */}
        <div className="rounded-2xl border border-forest-100 bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900">Diagnostic Frequency Breakdown</h2>
          <p className="text-xs text-slate-500">
            Healthy Rate: {kpis.healthy_rate_pct}% across {kpis.total_plant_scans} total scans
          </p>

          {disease_distribution.length > 0 ? (
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={disease_distribution} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Scans" fill="#2d6f4b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={BarChart3}
                title="No diagnostic scan counts yet"
                description="Run leaf scans in Disease Scanner to generate diagnostic charts."
              />
            </div>
          )}
        </div>
      </div>

      {/* Inventory Stock Aggregation Summary */}
      <div className="rounded-2xl border border-forest-100 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">Produce Inventory Stock Summary</h2>
        <p className="text-xs text-slate-500">Aggregated yield quantities grouped by storage status and unit</p>

        {inventory_summary.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Package}
              title="No inventory stock aggregations yet"
              description="Record harvested batches in Produce Inventory to view aggregated yield totals."
            />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {inventory_summary.map((row, idx) => (
              <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
                  {row.status.replace("_", " ")}
                </span>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                  {row.total_quantity} <span className="text-sm font-semibold text-slate-500">{row.unit}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">Across {row.batches} recorded batch(es)</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}