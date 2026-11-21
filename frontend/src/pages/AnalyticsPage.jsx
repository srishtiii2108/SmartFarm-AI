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
    title: "Leaf Scan Records",
    desc: "All scanned leaf photos, detected conditions, confidence scores & dates",
    icon: ScanLine,
  },
  {
    key: "crops",
    title: "Crop Plots List",
    desc: "Crop names, varieties, planting & harvest dates, and field locations",
    icon: Sprout,
  },
  {
    key: "inventory",
    title: "Harvest Stock Records",
    desc: "Harvested batch quantities, units, storage status & notes",
    icon: Package,
  },
  {
    key: "weather",
    title: "Farm Weather Logs",
    desc: "Recorded temperature, humidity, and rainfall updates for your farm",
    icon: CloudSun,
  },
];

function formatConditionLabel(label) {
  if (!label) return "Unknown";
  return label.replace(/___/g, " — ").replace(/_/g, " ");
}

function formatStatusLabel(status) {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ");
}

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
      const target = EXPORT_TARGETS.find((item) => item.key === datasetType);
      setDownloadNotice(`Downloaded "${target?.title || datasetType}" spreadsheet.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloadingKey("");
    }
  };

  if (loading) return <LoadingState message="Preparing your farm reports and summaries..." />;
  if (error && !report) return <ErrorBanner message={error} onRetry={fetchReport} />;
  if (!report) return null;

  const {
    kpis,
    crops_by_category = [],
    disease_distribution = [],
    inventory_summary = [],
  } = report;

  const formattedCategories = crops_by_category.map((item) => ({
    ...item,
    displayCategory: item.category
      ? item.category.charAt(0).toUpperCase() + item.category.slice(1).replace(/_/g, " ")
      : "Other",
  }));

  const formattedDiseases = disease_distribution.map((item) => ({
    ...item,
    displayLabel: formatConditionLabel(item.label),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Farm Reports & Exports"
        subtitle="Summary of your crops, leaf scans, harvest stock, and downloadable farm spreadsheets"
        action={
          <button
            type="button"
            onClick={fetchReport}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-forest-300 hover:bg-forest-50/50 hover:text-forest-900"
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

      {/* Spreadsheet Export Hub */}
      <div className="rounded-2xl border border-forest-100 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Download Farm Spreadsheets (CSV)</h2>
            <p className="text-xs text-slate-500">
              Save your farm records as spreadsheet files to view offline or share with your advisor
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {EXPORT_TARGETS.map((item) => {
            const Icon = item.icon;
            const isDownloading = downloadingKey === item.key;
            return (
              <div
                key={item.key}
                className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-forest-200 hover:bg-white hover:shadow-sm"
              >
                <div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-50 text-forest-800 ring-1 ring-forest-200/70">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.desc}</p>
                </div>

                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={() => handleDownloadCsv(item.key)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-forest-800 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-forest-900 disabled:opacity-50"
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
        {/* Crops by Type Pie Chart */}
        <div className="rounded-2xl border border-forest-100 bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900">Crops by Type</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Total active & past plots: {kpis.total_registered_crops}
          </p>

          {formattedCategories.length > 0 ? (
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formattedCategories}
                    dataKey="count"
                    nameKey="displayCategory"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label={({ displayCategory, count }) => `${displayCategory}: ${count}`}
                  >
                    {formattedCategories.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #d1e5d8",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={Sprout}
                title="No crop data to display yet"
                description="Add your crops in Crop Management to see a breakdown by crop type."
              />
            </div>
          )}
        </div>

        {/* Leaf Health & Disease Summary Chart */}
        <div className="rounded-2xl border border-forest-100 bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900">Leaf Health & Disease Summary</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Healthy crop rate: {kpis.healthy_rate_pct}% across {kpis.total_plant_scans} total scans
          </p>

          {formattedDiseases.length > 0 ? (
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formattedDiseases}
                  margin={{ top: 10, right: 20, left: 0, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="displayLabel"
                    tick={{ fontSize: 10, fill: "#334155" }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    tickFormatter={(val) => (val.length > 18 ? `${val.slice(0, 18)}...` : val)}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #d1e5d8",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" name="Scans" radius={[6, 6, 0, 0]}>
                    {formattedDiseases.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={entry.is_healthy ? "#2d6f4b" : "#d97706"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={BarChart3}
                title="No leaf scan counts yet"
                description="Scan plant leaves in Disease Scanner to see your crop health chart."
              />
            </div>
          )}
        </div>
      </div>

      {/* Harvest Stock Summary */}
      <div className="rounded-2xl border border-forest-100 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">Harvest Stock Summary</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Total harvested produce grouped by current storage status
        </p>

        {inventory_summary.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Package}
              title="No harvest stock recorded yet"
              description="Add harvested batches in Produce Inventory to track your total yield."
            />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {inventory_summary.map((row, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-forest-200 hover:bg-forest-50/30"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
                  {formatStatusLabel(row.status)}
                </span>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                  {row.total_quantity}{" "}
                  <span className="text-sm font-semibold text-slate-500">{row.unit}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Across {row.batches} recorded {row.batches === 1 ? "batch" : "batches"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}