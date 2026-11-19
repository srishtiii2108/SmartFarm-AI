import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bot,
  CloudSun,
  History,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Package,
  ScanLine,
  Sprout,
  X,
} from "lucide-react";
import { apiClient } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Smart Dashboard", icon: LayoutDashboard, end: true },
  { to: "/disease-detection", label: "Disease Scanner", icon: ScanLine },
  { to: "/predictions", label: "Prediction History", icon: History },
  { to: "/weather", label: "Weather & Risk Intel", icon: CloudSun },
  { to: "/assistant", label: "AI Farming Assistant", icon: Bot },
  { to: "/crops", label: "Crop Management", icon: Sprout },
  { to: "/inventory", label: "Produce Inventory", icon: Package },
  { to: "/analytics", label: "Analytics & Reports", icon: BarChart3 },
];

export default function SidebarLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    let mounted = true;
    apiClient
      .get("/health")
      .then((res) => {
        if (mounted) setHealth(res.data);
      })
      .catch(() => {
        if (mounted) setHealth({ status: "offline" });
      });
    return () => {
      mounted = false;
    };
  }, []);

  const isHealthy = health?.status === "healthy";

  const userInitials = (user?.full_name || "FM")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  const renderNavLinks = (onClickCallback) => (
    <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main Navigation">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClickCallback}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-forest-800 text-white shadow-sm"
                  : "text-slate-600 hover:bg-forest-50 hover:text-forest-900"
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  const renderSidebarFooter = () => (
    <div className="space-y-3 border-t border-forest-100 p-4">
      {/* System Health Card */}
      <div className="rounded-xl bg-forest-50/80 p-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-forest-700" />
            System Status
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              isHealthy ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isHealthy ? "bg-emerald-600" : "bg-amber-500"
              }`}
            />
            {isHealthy ? "Online" : "Checking"}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          ML: {health?.components?.ml_model_version || "mobilenetv2-v1.0"}
        </p>
      </div>

      {/* Authenticated Farmer Profile & Logout */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest-800 text-xs font-bold text-white">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900">
              {user?.full_name || "Farmer Account"}
            </p>
            <p className="truncate text-[11px] font-medium text-forest-700">
              {user?.farm_name || "SmartFarm Workspace"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50/70 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f7faf8]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-forest-100 bg-white lg:flex">
        <Link
          to="/"
          className="flex h-16 items-center gap-2.5 border-b border-forest-100 px-5 transition hover:bg-forest-50/40"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-800 text-white shadow-sm">
            <Leaf className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-base font-bold tracking-tight text-slate-900">
              SmartFarm AI
            </span>
            <span className="block text-[11px] font-medium text-forest-700">
              AgriTech Intelligence
            </span>
          </div>
        </Link>

        {renderNavLinks(undefined)}
        {renderSidebarFooter()}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-forest-100 px-5">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-forest-800 text-white">
                  <Leaf className="h-4 w-4" />
                </div>
                <span className="text-base font-bold text-slate-900">SmartFarm AI</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNavLinks(() => setMobileOpen(false))}
            {renderSidebarFooter()}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-forest-100 bg-white/90 px-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-forest-50 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <p className="hidden text-xs font-medium text-slate-500 sm:block">
              Workspace: <span className="font-bold text-slate-800">{user?.farm_name}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-lg bg-forest-50 px-2.5 py-1 text-xs font-medium text-forest-800 md:inline-block">
              Cohere RAG + MobileNetV2 + Open-Meteo
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}