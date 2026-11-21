import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  History,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Package,
  ScanLine,
  Sparkles,
  Sprout,
  X,
} from "lucide-react";
import { apiClient } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Farm Overview", icon: LayoutDashboard, end: true },
  { to: "/disease-detection", label: "Leaf Scanner", icon: ScanLine },
  { to: "/predictions", label: "Scan History", icon: History },
  { to: "/weather", label: "Weather & Alerts", icon: CloudSun },
  { to: "/assistant", label: "Crop Advisor", icon: Bot },
  { to: "/crops", label: "My Crop Plots", icon: Sprout },
  { to: "/inventory", label: "Harvest Stock", icon: Package },
  { to: "/analytics", label: "Reports & Exports", icon: BarChart3 },
];

export default function SidebarLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
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

  // Close mobile drawer automatically on route change or Escape key
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const isHealthy = health?.status === "healthy";

  const activeNav =
    NAV_ITEMS.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
    ) || NAV_ITEMS[0];

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

  const renderNavLinks = (isCollapsed = false, onClickCallback) => (
    <nav
      className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4 scrollbar-none"
      aria-label="Main Navigation"
    >
      {!isCollapsed && (
        <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Farm Workspace
        </p>
      )}
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={isCollapsed ? item.label : undefined}
            onClick={onClickCallback}
            className={({ isActive }) =>
              `group relative flex items-center ${
                isCollapsed ? "justify-center px-2.5" : "justify-between px-3.5"
              } rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-forest-800 to-forest-700 text-white shadow-md shadow-forest-900/15"
                  : "text-slate-600 hover:bg-forest-50/90 hover:text-forest-900"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105 ${
                      isActive
                        ? "bg-white/15 text-white"
                        : "bg-slate-100/80 text-slate-500 group-hover:bg-forest-100 group-hover:text-forest-800"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {!isCollapsed && (
                    <span className="truncate transition-transform duration-200 group-hover:translate-x-0.5">
                      {item.label}
                    </span>
                  )}
                </div>

                {!isCollapsed && isActive && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300 shadow-xs" />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  const renderSidebarFooter = (isCollapsed = false) => (
    <div className="shrink-0 space-y-2.5 border-t border-forest-100/80 bg-gradient-to-b from-white to-forest-50/30 p-3.5">
      {/* Farm Services Status Pill */}
      {isCollapsed ? (
        <div
          title={isHealthy ? "Farm Services Online" : "Checking Connection"}
          className="flex items-center justify-center rounded-xl border border-forest-100 bg-forest-50/80 py-2.5"
        >
          <span className="relative flex h-2.5 w-2.5">
            {isHealthy && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                isHealthy ? "bg-emerald-600" : "bg-amber-500"
              }`}
            />
          </span>
        </div>
      ) : (
        <div className="rounded-xl border border-forest-100/80 bg-forest-50/70 px-3 py-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-forest-700" />
              Farm Services
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                isHealthy ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              <span className="relative flex h-1.5 w-1.5">
                {isHealthy && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                )}
                <span
                  className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                    isHealthy ? "bg-emerald-600" : "bg-amber-500"
                  }`}
                />
              </span>
              {isHealthy ? "Online" : "Checking"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Leaf Scanner, Weather & Advisor ready
          </p>
        </div>
      )}

      {/* Pinned Farmer Profile & Sign Out */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              title={`${user?.full_name || "Farmer"} • ${user?.farm_name || "My Farm"}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-forest-800 to-forest-700 text-xs font-bold text-white shadow-xs"
            >
              {userInitials}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50/80 text-red-600 transition hover:bg-red-100"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-forest-800 to-forest-700 text-xs font-bold text-white shadow-xs">
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
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200/80 bg-red-50/70 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f6faf7]">
      {/* Desktop Sticky Full-Height Sidebar */}
      <aside
        className={`hidden shrink-0 flex-col border-r border-forest-100 bg-white transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:flex lg:h-screen ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        {/* Brand Header + Collapse Toggle */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-forest-100 px-4">
          <Link
            to="/"
            className={`flex items-center gap-2.5 overflow-hidden rounded-xl py-1 transition hover:opacity-90 ${
              collapsed ? "mx-auto" : ""
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-forest-800 to-forest-700 text-white shadow-sm">
              <Leaf className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="block truncate text-base font-bold tracking-tight text-slate-900">
                  SmartFarm AI
                </span>
                <span className="block truncate text-[11px] font-medium text-forest-700">
                  Smart Crop Care
                </span>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              title="Collapse sidebar"
              className="rounded-lg border border-slate-200/80 p-1.5 text-slate-400 transition hover:border-forest-200 hover:bg-forest-50 hover:text-forest-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            title="Expand sidebar"
            className="mx-auto mt-2.5 flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-500 transition hover:border-forest-200 hover:bg-forest-50 hover:text-forest-800"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}

        {renderNavLinks(collapsed, undefined)}
        {renderSidebarFooter(collapsed)}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      <div
        className={`fixed inset-0 z-50 flex transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div
          className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={`relative z-10 flex h-full w-72 max-w-[82vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-forest-100 px-5">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-forest-800 to-forest-700 text-white shadow-xs">
                <Leaf className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-base font-bold text-slate-900">SmartFarm AI</span>
                <span className="block text-[10px] font-medium text-forest-700">
                  Smart Crop Care
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {renderNavLinks(false, () => setMobileOpen(false))}
          {renderSidebarFooter(false)}
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-forest-100/90 bg-white/85 px-4 backdrop-blur-md sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-2xs transition hover:border-forest-300 hover:bg-forest-50 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex min-w-0 items-center gap-2 text-xs">
              <span className="hidden truncate rounded-lg bg-forest-50 px-2.5 py-1 font-semibold text-forest-800 sm:inline-block">
                {user?.farm_name || "My Farm"}
              </span>
              <span className="hidden text-slate-300 sm:inline">/</span>
              <span className="truncate font-bold text-slate-800">{activeNav.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden items-center gap-1.5 rounded-full border border-forest-200/70 bg-forest-50/80 px-3 py-1 text-xs font-semibold text-forest-800 md:inline-flex">
              <Sparkles className="h-3.5 w-3.5 text-forest-700" />
              Smart Farm Assistant
            </span>
            <Link
              to="/disease-detection"
              className="inline-flex items-center gap-1.5 rounded-xl bg-forest-800 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-forest-900"
            >
              <ScanLine className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Quick Scan</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}