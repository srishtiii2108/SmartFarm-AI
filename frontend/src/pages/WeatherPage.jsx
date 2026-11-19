import React, { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  CloudRain,
  CloudSun,
  Compass,
  Droplets,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Thermometer,
} from "lucide-react";
import { apiClient } from "../api/client";
import { EmptyState, ErrorBanner, LoadingState, PageHeader } from "../components/common/StateViews";

const RISK_BADGE_STYLES = {
  high: "border-red-200 bg-red-50 text-red-800",
  moderate: "border-amber-200 bg-amber-50 text-amber-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

const QUICK_CITIES = [
  { name: "Nashik", latitude: 19.9975, longitude: 73.7898, admin1: "Maharashtra", country: "India" },
  { name: "Jalgaon", latitude: 21.0077, longitude: 75.5626, admin1: "Maharashtra", country: "India" },
  { name: "Pune", latitude: 18.5204, longitude: 73.8567, admin1: "Maharashtra", country: "India" },
  { name: "Nagpur", latitude: 21.1458, longitude: 79.0882, admin1: "Maharashtra", country: "India" },
];

export default function WeatherPage() {
  const [searchQuery, setSearchQuery] = useState("Jalgaon");
  const [locations, setLocations] = useState([]);
  const [searchingLoc, setSearchingLoc] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState(QUICK_CITIES[0]);

  const [syncing, setSyncing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [syncNotice, setSyncNotice] = useState("");

  const [riskData, setRiskData] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);

  const loadWeatherAndRisk = useCallback(async (loc) => {
    setLoadingData(true);
    setError("");
    try {
      const riskParams = loc
        ? {
            latitude: loc.latitude,
            longitude: loc.longitude,
            location_name: loc.name,
          }
        : {};

      const [riskRes, histRes] = await Promise.allSettled([
        apiClient.get("/weather/risk-analysis", { params: riskParams }),
        apiClient.get("/weather/history", { params: { limit: 15, offset: 0 } }),
      ]);

      if (riskRes.status === "fulfilled") {
        const rawRisk = riskRes.value.data?.data || riskRes.value.data;
        setRiskData(rawRisk);
      } else {
        setRiskData(null);
      }

      if (histRes.status === "fulfilled") {
        const hPayload = histRes.value.data;
        setHistoryItems(hPayload.items || hPayload.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadWeatherAndRisk(selectedLocation);
  }, [loadWeatherAndRisk, selectedLocation]);

  const handleSearchLocations = async (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q.length < 2) return;

    setSearchingLoc(true);
    setError("");
    try {
      const res = await apiClient.get("/weather/locations", {
        params: { query: q },
      });
      const payload = res.data;
      const list =
        payload?.items ||
        payload?.locations ||
        payload?.results ||
        payload?.data?.items ||
        payload?.data?.results ||
        (Array.isArray(payload?.data) ? payload.data : null) ||
        (Array.isArray(payload) ? payload : []);

      setLocations(list);
      if (list.length === 0) {
        setError(`No coordinates found for "${q}". Try a nearby city or district.`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSearchingLoc(false);
    }
  };

  const handleSyncLocation = async (loc) => {
    const target = loc || selectedLocation;
    if (!target) return;

    setSelectedLocation(target);
    setLocations([]);
    setSyncing(true);
    setError("");
    setSyncNotice("");

    try {
      const res = await apiClient.post("/weather/sync", {
        location_name: target.name,
        latitude: Number(target.latitude),
        longitude: Number(target.longitude),
      });
      const msg = res.data?.message || `Weather telemetry synced for ${target.name}.`;
      setSyncNotice(msg);
      await loadWeatherAndRisk(target);
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Match latest observation from riskData OR fallback to stored history for selected city
  const matchingHistory =
    historyItems.find(
      (h) =>
        h.location_name &&
        selectedLocation?.name &&
        h.location_name.toLowerCase() === selectedLocation.name.toLowerCase() &&
        h.record_type === "current"
    ) ||
    historyItems.find(
      (h) =>
        h.location_name &&
        selectedLocation?.name &&
        h.location_name.toLowerCase() === selectedLocation.name.toLowerCase()
    ) ||
    historyItems[0] ||
    null;

  const currentWeather =
    riskData?.current_weather ||
    riskData?.current_observation ||
    riskData?.weather ||
    riskData?.latest_observation ||
    matchingHistory;

  const riskIndicators =
    riskData?.risk_indicators ||
    riskData?.risk_assessments ||
    riskData?.risks ||
    riskData?.alerts ||
    [];

  const overallRisk = (
    riskData?.overall_risk_level ||
    riskData?.overall_risk ||
    (riskIndicators.some((r) => ["high", "severe"].includes((r.level || r.risk_level || "").toLowerCase()))
      ? "high"
      : riskIndicators.some((r) => ["moderate", "medium"].includes((r.level || r.risk_level || "").toLowerCase()))
      ? "moderate"
      : "low")
  ).toLowerCase();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weather & Environmental Risk Intelligence"
        subtitle="Open-Meteo geocoding, historical/forecast persistence, and transparent heuristic crop risk scoring"
        action={
          <button
            type="button"
            disabled={syncing}
            onClick={() => handleSyncLocation(selectedLocation)}
            className="inline-flex items-center gap-2 rounded-xl bg-forest-800 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-forest-900 disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Sync {selectedLocation?.name || "Farm"} Weather
          </button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={() => loadWeatherAndRisk(selectedLocation)} />}

      {syncNotice && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs font-medium text-emerald-900">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            {syncNotice}
          </span>
          <button
            type="button"
            onClick={() => setSyncNotice("")}
            className="text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Location Search & Quick City Chips */}
      <div className="space-y-3 rounded-2xl border border-forest-100 bg-white p-5 shadow-xs">
        <form onSubmit={handleSearchLocations} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-700" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any city, taluka, or district (e.g., Jalgaon, Satara, Solapur, Indore)..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-forest-600 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={searchingLoc}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-forest-200 bg-forest-50 px-5 py-2.5 text-sm font-semibold text-forest-900 transition hover:bg-forest-100 disabled:opacity-50"
          >
            {searchingLoc ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Find Coordinates
          </button>
        </form>

        {/* 1-Click Agricultural Hub Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-slate-400">Quick Select:</span>
          {QUICK_CITIES.map((city) => (
            <button
              key={city.name}
              type="button"
              onClick={() => {
                setSearchQuery(city.name);
                handleSyncLocation(city);
              }}
              className={`rounded-lg border px-2.5 py-1 font-medium transition ${
                selectedLocation?.name === city.name
                  ? "border-forest-700 bg-forest-800 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-forest-50"
              }`}
            >
              {city.name}
            </button>
          ))}
        </div>

        {/* Geocoding Results Dropdown List */}
        {locations.length > 0 && (
          <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-forest-100 bg-forest-50/40">
            {locations.map((loc, idx) => (
              <div
                key={`${loc.latitude}-${loc.longitude}-${idx}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">{loc.name}</span>
                  <span className="ml-2 text-slate-500">
                    {[loc.admin1, loc.country].filter(Boolean).join(", ")} (
                    {Number(loc.latitude).toFixed(3)}, {Number(loc.longitude).toFixed(3)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSyncLocation(loc)}
                  className="rounded-lg bg-forest-800 px-3 py-1.5 font-semibold text-white hover:bg-forest-900"
                >
                  Select & Sync Weather
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {loadingData ? (
        <LoadingState message="Evaluating environmental telemetry & crop disease risk rules..." />
      ) : (
        <>
          {/* Current Weather + Overall Heuristic Risk Summary */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="rounded-2xl border border-forest-100 bg-white p-6 shadow-xs lg:col-span-5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest-800">
                  <Compass className="h-4 w-4" />
                  Active Farm Coordinates
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] text-slate-600">
                  {Number(selectedLocation.latitude).toFixed(2)}°N,{" "}
                  {Number(selectedLocation.longitude).toFixed(2)}°E
                </span>
              </div>

              <h2 className="mt-3 text-2xl font-bold text-slate-900">
                {currentWeather?.location_name || selectedLocation.name}
              </h2>
              <p className="text-xs text-slate-500">
                {currentWeather?.weather_description ||
                  currentWeather?.condition ||
                  "Open-Meteo Environmental Feed"}
              </p>

              {currentWeather ? (
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-amber-50/70 p-3.5">
                    <div className="flex items-center gap-1 text-xs font-medium text-amber-800">
                      <Thermometer className="h-3.5 w-3.5" />
                      Temp
                    </div>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {currentWeather.temperature_c ?? "—"}°C
                    </p>
                  </div>

                  <div className="rounded-xl bg-sky-50/70 p-3.5">
                    <div className="flex items-center gap-1 text-xs font-medium text-sky-800">
                      <Droplets className="h-3.5 w-3.5" />
                      Humidity
                    </div>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {currentWeather.relative_humidity_pct ?? "—"}%
                    </p>
                  </div>

                  <div className="rounded-xl bg-forest-50 p-3.5">
                    <div className="flex items-center gap-1 text-xs font-medium text-forest-800">
                      <CloudRain className="h-3.5 w-3.5" />
                      Rain
                    </div>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {currentWeather.precipitation_mm ?? 0} mm
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-600">
                  Click <strong>Sync Weather</strong> above to fetch and store live telemetry for this location.
                </p>
              )}
            </div>

            {/* Heuristic Crop Environmental Risk Panel */}
            <div className="rounded-2xl border border-forest-100 bg-white p-6 shadow-xs lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-forest-700" />
                  <h2 className="text-base font-bold text-slate-900">
                    Heuristic Crop Environmental Risk Indicators
                  </h2>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${
                    RISK_BADGE_STYLES[overallRisk] || RISK_BADGE_STYLES.low
                  }`}
                >
                  Overall Risk: {overallRisk}
                </span>
              </div>

              {riskIndicators.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {riskIndicators.map((risk, idx) => {
                    const lvl = (risk.level || risk.severity || risk.risk_level || "low").toLowerCase();
                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {risk.name || risk.category || risk.factor || "Environmental Factor"}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                              RISK_BADGE_STYLES[lvl] || RISK_BADGE_STYLES.low
                            }`}
                          >
                            {lvl}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-600">
                          {risk.reason || risk.description || risk.message}
                        </p>
                        {risk.recommendation && (
                          <p className="mt-1.5 text-xs font-medium text-forest-800">
                            Action: {risk.recommendation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-forest-200 bg-forest-50/30 p-5 text-xs text-slate-600">
                  {riskData?.summary ||
                    "Sync weather telemetry for your farm location to evaluate fungal blight humidity thresholds, heat stress, and rainfall risks."}
                </div>
              )}
            </div>
          </div>

          {/* Stored Weather Observations Table */}
          <div className="rounded-2xl border border-forest-100 bg-white p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">Stored Weather History</h2>
            <p className="text-xs text-slate-500">
              Persisted PostgreSQL snapshots (30-minute read-through cache active)
            </p>

            {historyItems.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={CloudSun}
                  title="No historical weather records yet"
                  description="Search any city above and click Select & Sync Weather to populate PostgreSQL weather logs."
                />
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="pb-3 pr-4">Location</th>
                      <th className="pb-3 pr-4">Type</th>
                      <th className="pb-3 pr-4">Temp (°C)</th>
                      <th className="pb-3 pr-4">Humidity</th>
                      <th className="pb-3 pr-4">Rain (mm)</th>
                      <th className="pb-3 pr-4">Condition</th>
                      <th className="pb-3">Observed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {historyItems.map((row) => (
                      <tr key={row.id} className="hover:bg-forest-50/40">
                        <td className="py-3 pr-4 font-semibold text-slate-900">
                          {row.location_name || "Custom Coords"}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium capitalize text-slate-700">
                            {row.record_type}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-semibold text-slate-800">
                          {row.temperature_c ?? "—"}°C
                        </td>
                        <td className="py-3 pr-4 text-slate-600">
                          {row.relative_humidity_pct ?? "—"}%
                        </td>
                        <td className="py-3 pr-4 text-slate-600">{row.precipitation_mm ?? 0} mm</td>
                        <td className="py-3 pr-4 text-slate-600">{row.weather_description || "—"}</td>
                        <td className="py-3 text-slate-500">
                          {new Date(row.observed_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}