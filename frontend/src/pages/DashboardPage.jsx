import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CloudRain,
  CloudSun,
  Droplets,
  Leaf,
  RefreshCw,
  ScanLine,
  Sprout,
  Thermometer,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiClient } from "../api/client";
import { EmptyState, ErrorBanner, LoadingState, PageHeader } from "../components/common/StateViews";

const STATUS_COLORS = {
  active: "#2d6f4b",
  harvested: "#0284c7",
  diseased: "#dc2626",
  archived: "#64748b",
};

function formatConditionLabel(label) {
  if (!label) return "Unknown";
  return label.replace(/___/g, " — ").replace(/_/g, " ");
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/analytics/dashboard");
      setData(res.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) return <LoadingState message="Loading your farm overview..." />;
  if (error) return <ErrorBanner message={error} onRetry={fetchDashboard} />;
  if (!data) return null;

  const {
    kpis,
    disease_distribution = [],
    prediction_trends = [],
    crop_health_stats = [],
    recent_detections = [],
    weather_summary,
  } = data;

  const formattedDistribution = disease_distribution.map((item) => ({
    ...item,
    displayLabel: formatConditionLabel(item.label),
  }));

  const kpiCards = [
    {
      label: "Total Leaf Scans",
      value: kpis.total_plant_scans,
      sub: `${kpis.healthy_rate_pct}% healthy crop rate`,
      icon: ScanLine,
      tone: "bg-forest-50 text-forest-800 ring-1 ring-forest-200/70",
    },
    {
      label: "Healthy Crops",
      value: kpis.healthy_predictions,
      sub: "Leaves checked and found healthy",
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70",
    },
    {
      label: "Needs Attention",
      value: kpis.diseased_predictions,
      sub: "Plants flagged for care or treatment",
      icon: AlertTriangle,
      tone: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/70",
    },
    {
      label: "Registered Crops",
      value: kpis.total_registered_crops,
      sub: `${kpis.active_crops} active plots • ${kpis.indexed_knowledge_docs} farming guides`,
      icon: Sprout,
      tone: "bg-sky-50 text-sky-700 ring-1 ring-sky-200/70",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Farm Overview"
        subtitle="Live summary of your registered crops, leaf health checks, and local weather"
        action={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchDashboard}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-forest-300 hover:bg-forest-50/50 hover:text-forest-900"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <Link
              to="/disease-detection"
              className="inline-flex items-center gap-1.5 rounded-xl bg-forest-800 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-forest-900"
            >
              <ScanLine className="h-3.5 w-3.5" />
              Scan Leaf
            </Link>
          </div>
        }
      />

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-forest-100 bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-forest-200 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.label}
                </span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{card.value}</p>
              <p className="mt-1 text-xs text-slate-500">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Weather Summary + Crop Health Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weather Snapshot Card */}
        <div className="rounded-2xl border border-forest-100 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
                <CloudSun className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Local Farm Weather</h2>
            </div>
            <Link
              to="/weather"
              className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 transition hover:text-forest-900"
            >
              View Weather & Risk
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {weather_summary ? (
            <div className="mt-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    {weather_summary.location_name || "Your Farm Location"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {weather_summary.condition} • Updated{" "}
                    {new Date(weather_summary.observed_at).toLocaleString()}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-forest-200/70 bg-forest-50 px-3 py-1 text-xs font-semibold text-forest-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live Weather Sync
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Thermometer className="h-3.5 w-3.5 text-amber-600" />
                    Temperature
                  </div>
                  <p className="mt-1.5 text-xl font-bold text-slate-900">
                    {weather_summary.temperature_c ?? "—"}°C
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Droplets className="h-3.5 w-3.5 text-sky-600" />
                    Humidity
                  </div>
                  <p className="mt-1.5 text-xl font-bold text-slate-900">
                    {weather_summary.relative_humidity_pct ?? "—"}%
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <CloudRain className="h-3.5 w-3.5 text-forest-700" />
                    Rainfall
                  </div>
                  <p className="mt-1.5 text-xl font-bold text-slate-900">
                    {weather_summary.precipitation_mm ?? 0} mm
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={CloudSun}
                title="No weather updates yet"
                description="Sync your farm location in Weather & Risk to track local temperature, humidity, and crop risk alerts."
                action={
                  <Link
                    to="/weather"
                    className="rounded-xl bg-forest-800 px-4 py-2 text-xs font-semibold text-white hover:bg-forest-900"
                  >
                    Sync Farm Weather
                  </Link>
                }
              />
            </div>
          )}
        </div>

        {/* Crop Status Statistics */}
        <div className="rounded-2xl border border-forest-100 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Crop Status Overview</h2>
            <Link
              to="/crops"
              className="text-xs font-semibold text-forest-700 transition hover:text-forest-900"
            >
              Manage
            </Link>
          </div>

          {crop_health_stats.length > 0 ? (
            <div className="mt-5 space-y-4">
              {crop_health_stats.map((item) => {
                const pct =
                  kpis.total_registered_crops > 0
                    ? Math.round((item.count / kpis.total_registered_crops) * 100)
                    : 0;
                const barColor = STATUS_COLORS[item.status] || "#2d6f4b";
                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="capitalize text-slate-700">{item.status}</span>
                      <span className="font-semibold text-slate-600">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={Sprout}
                title="No crops registered"
                description="Add Tomato, Potato, or Bell Pepper plots to track planting dates and link leaf scans."
                action={
                  <Link
                    to="/crops"
                    className="rounded-xl bg-forest-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-forest-900"
                  >
                    Add First Crop
                  </Link>
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Charts Row: Plant Health Breakdown & Scan Trends */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Plant Health Breakdown Chart */}
        <div className="rounded-2xl border border-forest-100 bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900">Plant Health Breakdown</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Summary of healthy leaves and detected diseases across your scans
          </p>

          {formattedDistribution.length > 0 ? (
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formattedDistribution}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis
                    type="category"
                    dataKey="displayLabel"
                    width={150}
                    tick={{ fontSize: 11, fill: "#334155" }}
                    tickFormatter={(val) => (val.length > 22 ? `${val.slice(0, 22)}...` : val)}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #d1e5d8",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" name="Scans" radius={[0, 6, 6, 0]}>
                    {formattedDistribution.map((entry, idx) => (
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
                icon={Leaf}
                title="No scan data to show yet"
                description="Scan your first plant leaf to see a breakdown of healthy and affected crops."
              />
            </div>
          )}
        </div>

        {/* Leaf Scan Trends */}
        <div className="rounded-2xl border border-forest-100 bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900">Leaf Scan Trends</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Daily count of healthy vs. affected leaf checks
          </p>

          {prediction_trends.length > 0 ? (
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={prediction_trends} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #d1e5d8",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="healthy"
                    stackId="1"
                    stroke="#2d6f4b"
                    fill="#96c7a8"
                    name="Healthy"
                  />
                  <Area
                    type="monotone"
                    dataKey="diseased"
                    stackId="1"
                    stroke="#dc2626"
                    fill="#fca5a5"
                    name="Needs Care"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={Leaf}
                title="No scan trends yet"
                description="Daily trends will appear automatically as you scan more leaves."
              />
            </div>
          )}
        </div>
      </div>

      {/* Recent Leaf Scans Feed */}
      <div className="rounded-2xl border border-forest-100 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Leaf Scans</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Your latest plant leaf health checks and confidence scores
            </p>
          </div>
          <Link
            to="/predictions"
            className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 transition hover:text-forest-900"
          >
            View All History
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recent_detections.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="pb-3 pr-4">Leaf Photo</th>
                  <th className="pb-3 pr-4">Condition Found</th>
                  <th className="pb-3 pr-4">Crop Plot</th>
                  <th className="pb-3 pr-4">Confidence</th>
                  <th className="pb-3">Scanned On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent_detections.map((item) => (
                  <tr key={item.id} className="transition hover:bg-forest-50/40">
                    <td className="py-3 pr-4">
                      <img
                        src={item.image_url}
                        alt={formatConditionLabel(item.predicted_label)}
                        className="h-11 w-11 rounded-xl border border-slate-200 object-cover"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.is_healthy
                            ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/70"
                            : "bg-amber-50 text-amber-800 ring-1 ring-amber-200/70"
                        }`}
                      >
                        {item.is_healthy ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        )}
                        {formatConditionLabel(item.predicted_label)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs font-medium text-slate-600">
                      {item.crop_name || "General Plot"}
                    </td>
                    <td className="py-3 pr-4 text-xs font-semibold text-slate-800">
                      {(item.confidence_score * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 text-xs text-slate-500">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              icon={ScanLine}
              title="No leaf scans recorded yet"
              description="Upload a Tomato, Potato, or Bell Pepper leaf image in the Disease Scanner to get started."
              action={
                <Link
                  to="/disease-detection"
                  className="rounded-xl bg-forest-800 px-4 py-2 text-xs font-semibold text-white hover:bg-forest-900"
                >
                  Scan Leaf Now
                </Link>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}