import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  CheckCircle2,
  CloudRain,
  Cpu,
  Database,
  FileSpreadsheet,
  Layers,
  Lock,
  Menu,
  Package,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Sprout,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import RevealOnScroll from "../components/common/RevealOnScroll";

const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#architecture", label: "Architecture" },
  { href: "#security", label: "Security & Auth" },
  { href: "#workflow", label: "Workflow" },
];

const MARQUEE_TOP = [
  "Detect Early Blight",
  "Live Open-Meteo Telemetry",
  "Cohere RAG Agronomist",
  "Multi-Tenant Farm Isolation",
  "15-Class Leaf Vision",
  "Auditable CSV Exports",
];

const MARQUEE_BOTTOM = [
  "01 SCAN LEAF PATHOLOGY IN SECONDS",
  "02 TRACK PLOT MICROCLIMATE & RISKS",
  "03 QUERY CITED AGRONOMY GUIDES",
  "04 MONITOR COLD-ROOM HARVEST BATCHES",
];

const CAPABILITY_CARDS = [
  {
    num: "01 / COMPUTER VISION",
    title: "MobileNetV2 Leaf Disease Scanner",
    badge: "80.4% Test Accuracy",
    description:
      "Fine-tuned transfer learning model trained across 15 Solanaceae classes (Tomato, Potato, Bell Pepper). Returns top-3 confidence bars, calibrated low-confidence alerts, and verified Supabase Storage image logs.",
    icon: ScanSearch,
  },
  {
    num: "02 / SEMANTIC RAG",
    title: "Cohere Command-A Agronomist",
    badge: "pgvector + Citations",
    description:
      "Retrieval-Augmented Generation powered by Cohere embed-english-v3.0 and PostgreSQL pgvector cosine search. Every treatment answer cites indexed agricultural manuals with zero hallucinated dosages.",
    icon: Bot,
  },
  {
    num: "03 / TELEMETRY & RISK",
    title: "Open-Meteo Weather & Blight Alerts",
    badge: "30-Min DB Cache",
    description:
      "Search any global farming region to sync live temperature, relative humidity, rainfall, and 7-day forecasts—automatically cross-checked against heuristic fungal blight and heat-stress thresholds.",
    icon: CloudRain,
  },
  {
    num: "04 / PLOT REGISTRY",
    title: "Relational Crop & Field Management",
    badge: "GPS & Lifecycle",
    description:
      "Track active plots, crop varieties, sowing and expected harvest dates, and geographic coordinates as the parent entity linking every disease scan and harvest batch.",
    icon: Sprout,
  },
  {
    num: "05 / POST-HARVEST OPS",
    title: "Produce & Cold-Room Inventory",
    badge: "Batch Traceability",
    description:
      "Record harvested yields in kg, quintals, tons, or crates linked directly to source crops. Transition stock cleanly across Available, Reserved, Sold, and Spoiled statuses.",
    icon: Package,
  },
  {
    num: "06 / REPORTING SUITE",
    title: "Live KPIs & Streaming CSV Exports",
    badge: "PostgreSQL Aggregations",
    description:
      "Real-time Recharts visualizations of healthy vs. diseased trends and crop distributions, paired with instant one-click CSV dataset downloads for compliance and agronomy audits.",
    icon: BarChart3,
  },
];

const TECH_LAYERS = [
  {
    layer: "LAYER 01 • VISION ENGINE",
    title: "TensorFlow MobileNetV2",
    stack: "224×224 RGB • Softmax Top-3 • SHA-256 Deduplication",
    detail:
      "In-memory fail-fast tensor preprocessing validates leaf imagery before persisting verified files to Supabase Object Storage.",
    icon: Cpu,
  },
  {
    layer: "LAYER 02 • KNOWLEDGE RAG",
    title: "Cohere v3 + pgvector",
    stack: "1024-Dim Embeddings • Cosine Similarity • Command-A",
    detail:
      "Custom markdown, text, and PDF agronomic manuals are chunked, embedded, and indexed in PostgreSQL for grounded Q&A.",
    icon: Layers,
  },
  {
    layer: "LAYER 03 • BACKEND CORE",
    title: "FastAPI + SQLAlchemy",
    stack: "Async Open-Meteo • Pydantic v2 • Rate Limiting",
    detail:
      "Modular service-repository architecture with structured error envelopes, OpenAPI documentation, and streaming CSV responses.",
    icon: Database,
  },
  {
    layer: "LAYER 04 • TENANT SECURITY",
    title: "JWT + Bcrypt Isolation",
    stack: "HS256 Bearer • Bcrypt Rounds=12 • Row-Level Scoping",
    detail:
      "Every crop, scan, weather record, and inventory batch is scoped by authenticated user UUID to prevent cross-tenant access.",
    icon: ShieldCheck,
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Create Isolated Farm Workspace",
    description:
      "Register with strict password validation or launch the pre-populated demo farm in one click.",
  },
  {
    step: "02",
    title: "Register Plots & Sync Weather",
    description:
      "Add your active Tomato, Potato, or Bell Pepper plots and pull live Open-Meteo risk telemetry.",
  },
  {
    step: "03",
    title: "Diagnose Leaves & Consult RAG AI",
    description:
      "Scan leaf photos with MobileNetV2 and ask the Cohere RAG Agronomist for cited treatment protocols.",
  },
  {
    step: "04",
    title: "Log Harvests & Export Reports",
    description:
      "Record post-harvest inventory batches, monitor dashboard KPIs, and download auditable CSV reports.",
  },
];

function FloatingLeaf({ className }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <path
        d="M31 5C19 5 8 11.5 6.8 23.5C6.4 27.3 7.7 30.2 9.8 32C12 29.8 16.2 24.8 22.5 19C17.8 24.8 13.6 29.8 11.5 32.7C14.5 33.5 18.7 33 22.5 30.5C29.7 25.8 32.2 15.5 31 5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function LandingPage() {
  const { isAuthenticated, user, login } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleQuickDemo = async () => {
    if (isAuthenticated) {
      navigate("/dashboard");
      return;
    }
    setDemoLoading(true);
    try {
      await login("demo@smartfarm.ai", "Demo@1234");
      navigate("/dashboard");
    } catch {
      navigate("/login");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="font-sans-ui min-h-screen overflow-x-clip bg-[#F8FAF9] text-slate-900">
      {/* ==================== FLOATING GLASS PILL NAVBAR ==================== */}
      <div className="fixed inset-x-0 top-4 z-50 px-4 sm:px-6">
        <header className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/15 bg-[#0E2923]/85 px-4 py-2.5 text-white shadow-2xl shadow-black/25 backdrop-blur-xl sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-400/20 text-teal-300 ring-1 ring-teal-300/35">
              <Sprout className="h-4 w-4" />
            </div>
            <span className="font-editorial text-2xl tracking-tight text-white">
              Smart<span className="text-teal-300">Farm</span>
            </span>
          </Link>

          {/* Desktop Section Anchors */}
          <nav className="hidden items-center gap-7 text-xs font-medium text-slate-300 md:flex">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition hover:text-teal-300"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right Pill CTA */}
          <div className="hidden items-center gap-2.5 sm:flex">
            {!isAuthenticated && (
              <Link
                to="/login"
                className="rounded-full px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                Sign In
              </Link>
            )}
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#0B221D] shadow-sm transition hover:bg-teal-200"
            >
              {isAuthenticated ? `Open ${user?.farm_name || "Workspace"}` : "Enter Workspace"}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-full p-2 text-slate-200 hover:bg-white/10 md:hidden"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="mx-auto mt-2 max-w-6xl rounded-3xl border border-white/15 bg-[#0E2923]/95 p-5 text-white shadow-2xl backdrop-blur-xl md:hidden">
            <div className="flex flex-col space-y-3 text-sm font-medium text-slate-200">
              {NAV_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-3 py-2 hover:bg-white/10 hover:text-teal-300"
                >
                  {item.label}
                </a>
              ))}
              <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full border border-white/20 py-2.5 text-center text-xs font-bold text-white"
                >
                  Sign In
                </Link>
                <Link
                  to={isAuthenticated ? "/dashboard" : "/register"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full bg-white py-2.5 text-center text-xs font-bold text-[#0B221D]"
                >
                  {isAuthenticated ? "Open Dashboard" : "Create Farm Account"}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== HERO SECTION (DEEP BOTANICAL DARK) ==================== */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_38%,#164238_0%,#0B221D_58%,#071713_100%)] px-4 pt-32 pb-20 text-center text-white sm:px-6">
        {/* Drifting Botanical Leaves */}
        <FloatingLeaf className="animate-leaf-slow absolute top-32 left-[10%] h-6 w-6 text-teal-400/50" />
        <FloatingLeaf className="animate-leaf-reverse absolute top-44 right-[12%] h-7 w-7 text-emerald-300/40" />
        <FloatingLeaf className="animate-leaf-reverse absolute bottom-28 left-[16%] h-5 w-5 text-teal-300/45" />
        <FloatingLeaf className="animate-leaf-slow absolute right-[18%] bottom-24 h-6 w-6 text-amber-300/35" />

        {/* Concentric Sonar Rings & Botanical Emblem */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="animate-pulse-ring absolute h-44 w-44 rounded-full border border-teal-300/15" />
          <div className="animate-pulse-ring absolute h-64 w-64 rounded-full border border-teal-300/10" />
          <div className="animate-pulse-ring absolute h-88 w-88 rounded-full border border-teal-300/5" />

          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-teal-300/30 bg-white/5 shadow-2xl shadow-teal-950/60 backdrop-blur-md">
            <svg viewBox="0 0 64 64" fill="none" className="h-14 w-14">
              <path
                d="M48 15C33 15 19 23 17.5 38C17 43 18.6 46.8 21.2 49C23.8 46.4 29.2 40 37 32.5C31.2 40 26 46.4 23.4 50C27 51 32.5 50.5 37.2 47.4C46.2 41.4 49.5 28.5 48 15Z"
                fill="#CCFBF1"
              />
              <path
                d="M16 50C20 45 25.5 39.5 32.5 34.5"
                stroke="#5EEAD4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="44" cy="20" r="3" fill="#2DD4BF" />
            </svg>
          </div>
        </div>

        {/* Eyebrow Pill */}
        <p className="text-[11px] font-bold tracking-[0.26em] text-teal-300 uppercase">
          • SMARTFARM AI • WHERE AGRONOMY MEETS INTELLIGENCE
        </p>

        {/* Giant Editorial Two-Tone Wordmark */}
        <h1 className="font-editorial mt-3 text-6xl leading-none tracking-tight text-white sm:text-8xl lg:text-[6.5rem]">
          Smart<span className="italic text-teal-300">Farm</span>
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-relaxed font-medium text-slate-200 sm:text-xl">
          Precision crop intelligence people actually use—uniting leaf vision diagnostics,
          cited RAG agronomy, and live microclimate risk alerts.
        </p>

        <p className="mt-3 max-w-xl text-xs leading-relaxed text-slate-400 sm:text-sm">
          Built for modern growers and agronomy teams to detect foliar disease early, ground
          treatment decisions in verified manuals, and isolate every farm&apos;s operational data.
        </p>

        {/* Dual Action CTAs */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            to={isAuthenticated ? "/dashboard" : "/register"}
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-xs font-extrabold tracking-wide text-[#0B221D] shadow-lg shadow-black/25 transition hover:scale-[1.02] hover:bg-teal-200 sm:text-sm"
          >
            {isAuthenticated ? "Enter Farm Workspace" : "Start Free Farm Workspace"}
            <ArrowUpRight className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={handleQuickDemo}
            disabled={demoLoading}
            className="inline-flex items-center gap-2 rounded-full border border-teal-300/35 bg-white/5 px-6 py-3.5 text-xs font-bold text-teal-200 backdrop-blur-md transition hover:border-teal-300 hover:bg-teal-400/15 sm:text-sm"
          >
            <Sparkles className="h-4 w-4 text-teal-300" />
            {demoLoading ? "Launching Demo..." : "Launch Live Demo Farm"}
          </button>
        </div>

        {/* Bottom Metric Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-white/10 pt-6 text-xs font-medium text-slate-300">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-300" />
            MobileNetV2 (15 PlantVillage Classes)
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-300" />
            Cohere Command-A + pgvector RAG
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-300" />
            JWT + Bcrypt Row-Level Multi-Tenancy
          </span>
        </div>
      </section>

      {/* ==================== DUAL-ROW INFINITE MARQUEE RIBBON ==================== */}
      <div className="marquee-wrapper overflow-hidden border-y border-teal-300/15 bg-[#081A16] py-5 text-white">
        {/* Top Row: Large Italic Serif */}
        <div className="animate-marquee-left flex items-center gap-10">
          {[...MARQUEE_TOP, ...MARQUEE_TOP].map((phrase, idx) => (
            <div key={idx} className="flex items-center gap-10 whitespace-nowrap">
              <span className="font-editorial text-3xl italic tracking-wide text-slate-100 sm:text-4xl">
                {phrase}
              </span>
              <span className="h-2.5 w-2.5 rotate-45 rounded-xs bg-teal-400" />
            </div>
          ))}
        </div>

        {/* Bottom Row: Numbered Uppercase Micro-Steps */}
        <div className="animate-marquee-right mt-3.5 flex items-center gap-8 border-t border-white/10 pt-3.5">
          {[...MARQUEE_BOTTOM, ...MARQUEE_BOTTOM].map((step, idx) => (
            <div key={idx} className="flex items-center gap-8 whitespace-nowrap">
              <span className="text-[11px] font-bold tracking-[0.22em] text-teal-300/85 uppercase">
                {step}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400/60" />
            </div>
          ))}
        </div>
      </div>

      {/* ==================== SECTION 01 & 02: PROBLEM & BRAND STORY (LIGHT) ==================== */}
      <section id="about" className="relative bg-[#F8FAF9] py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <p className="text-xs font-bold tracking-[0.22em] text-teal-700 uppercase">
              01 / THE CHALLENGE IN MODERN AGRONOMY
            </p>
            <h2 className="font-editorial mt-4 max-w-4xl text-4xl leading-[1.08] text-slate-900 sm:text-6xl lg:text-7xl">
              Your healthiest crops are{" "}
              <span className="italic text-teal-700">vulnerable silently</span>—until leaf
              blight spreads across the entire plot.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600">
              By the time foliar lesions are manually spotted, microclimate humidity has already
              accelerated fungal spread. Generic AI chatbots guess dosages without citations, and
              harvest records stay trapped in disconnected spreadsheets.
            </p>
          </RevealOnScroll>

          {/* Editorial Split Brand Visual ("Smart [Leaf AI] Farm") */}
          <RevealOnScroll delayMs={150} className="mt-20">
            <div className="rounded-[2.5rem] border border-emerald-950/10 bg-white p-8 text-center shadow-xl shadow-emerald-950/5 sm:p-16">
              <p className="text-[11px] font-bold tracking-[0.24em] text-teal-700 uppercase">
                02 / WHAT IS SMARTFARM AI?
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-10">
                <div className="text-center sm:text-right">
                  <span className="font-editorial block text-6xl text-[#0B221D] sm:text-8xl">
                    Smart
                  </span>
                  <span className="font-editorial text-xl italic text-slate-500">
                    “field vision”
                  </span>
                </div>

                {/* Central Botanical AI Core */}
                <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 via-emerald-50 to-white p-4 shadow-inner ring-1 ring-teal-600/20 sm:h-44 sm:w-44">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#0B221D] text-teal-300 shadow-lg sm:h-28 sm:w-28">
                    <Sprout className="h-12 w-12 sm:h-14 sm:w-14" />
                  </div>
                </div>

                <div className="text-center sm:text-left">
                  <span className="font-editorial block text-6xl text-teal-700 sm:text-8xl">
                    Farm
                  </span>
                  <span className="font-editorial text-xl italic text-slate-500">
                    “grounded intelligence”
                  </span>
                </div>
              </div>

              <p className="mx-auto mt-8 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                SmartFarm AI bridges computer-vision leaf diagnostics, semantic RAG agronomy
                manuals, Open-Meteo weather telemetry, and post-harvest batch inventory into a
                single multi-tenant workspace.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ==================== SECTION 03: STICKY SPLIT CAPABILITIES (DARK) ==================== */}
      <section
        id="capabilities"
        className="relative bg-[#0B221D] py-24 text-white sm:py-32"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
            {/* Left Sticky Editorial Column */}
            <div className="lg:sticky lg:top-28 lg:col-span-5">
              <RevealOnScroll>
                <p className="text-xs font-bold tracking-[0.22em] text-teal-300 uppercase">
                  03 / CORE PLATFORM MODULES
                </p>
                <h2 className="font-editorial mt-4 text-4xl leading-[1.08] text-white sm:text-6xl">
                  Fix crop stress early, not after harvest loss.{" "}
                  <span className="italic text-teal-300">Without guesswork.</span>
                </h2>
                <p className="mt-5 text-sm leading-relaxed text-slate-300 sm:text-base">
                  Every module in SmartFarm AI is backed by live PostgreSQL persistence,
                  verifiable ML confidence scoring, and strict tenant isolation—built for real
                  agronomic workflows.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to={isAuthenticated ? "/disease-detection" : "/register"}
                    className="inline-flex items-center gap-2 rounded-full bg-teal-300 px-5 py-2.5 text-xs font-extrabold text-[#0B221D] transition hover:bg-white"
                  >
                    Explore Disease Scanner
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </RevealOnScroll>
            </div>

            {/* Right Scrollable Numbered Cards */}
            <div className="space-y-5 lg:col-span-7">
              {CAPABILITY_CARDS.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <RevealOnScroll key={card.num} delayMs={idx * 60}>
                    <div className="group rounded-3xl border border-white/10 bg-[#102E27]/85 p-6 transition hover:border-teal-300/40 hover:bg-[#133830] sm:p-8">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold tracking-[0.2em] text-teal-300 uppercase">
                          {card.num}
                        </span>
                        <span className="rounded-full border border-teal-300/25 bg-teal-400/10 px-3 py-1 text-[11px] font-semibold text-teal-200">
                          {card.badge}
                        </span>
                      </div>

                      <div className="mt-4 flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-400/15 text-teal-300 ring-1 ring-teal-300/25">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-editorial text-2xl text-white sm:text-3xl">
                            {card.title}
                          </h3>
                          <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">
                            {card.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </RevealOnScroll>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 04: TECHNOLOGY & MULTI-TENANT SECURITY (LIGHT) ==================== */}
      <section id="architecture" className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <p className="text-xs font-bold tracking-[0.22em] text-teal-700 uppercase">
              04 / SYSTEM ARCHITECTURE &amp; PRIVACY
            </p>
            <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <h2 className="font-editorial max-w-2xl text-4xl leading-[1.08] text-slate-900 sm:text-6xl">
                Engineered for <span className="italic text-teal-700">accuracy</span>, speed,
                and strict tenant privacy.
              </h2>
              <p className="max-w-md text-sm text-slate-600">
                Four decoupled architectural layers ensure rapid inference, verifiable RAG
                citations, and zero cross-farmer data leakage.
              </p>
            </div>
          </RevealOnScroll>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {TECH_LAYERS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <RevealOnScroll key={item.layer} delayMs={idx * 80}>
                  <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200/90 bg-[#F8FAF9] p-7 transition hover:border-teal-600/40 hover:shadow-lg">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold tracking-[0.18em] text-teal-700 uppercase">
                          {item.layer}
                        </span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B221D] text-teal-300">
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <h3 className="font-editorial mt-4 text-3xl text-slate-900">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs font-bold text-teal-800">{item.stack}</p>
                      <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>

          {/* Dedicated Row-Level Security Banner */}
          <RevealOnScroll delayMs={180} className="mt-12">
            <div
              id="security"
              className="rounded-3xl border border-teal-900/15 bg-gradient-to-r from-[#0B221D] to-[#133A31] p-8 text-white sm:p-10"
            >
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-teal-400/15 px-3 py-1 text-[11px] font-bold tracking-wider text-teal-300 uppercase">
                    <Lock className="h-3.5 w-3.5" />
                    Multi-Tenant Row-Level Isolation
                  </div>
                  <h3 className="font-editorial mt-3 text-3xl text-white sm:text-4xl">
                    Every farm workspace is cryptographically isolated.
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">
                    Passwords are salted and hashed with Bcrypt (12 rounds) and validated against
                    5 complexity rules. Every API route verifies HS256 JWT tokens and scopes
                    PostgreSQL queries to the authenticated farmer&apos;s UUID.
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-3">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-extrabold text-[#0B221D] transition hover:bg-teal-200"
                  >
                    Create Secure Account
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ==================== SECTION 05: 4-STEP WORKFLOW (SOFT MINT) ==================== */}
      <section id="workflow" className="border-t border-slate-200/80 bg-[#F2F7F5] py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll className="text-center">
            <p className="text-xs font-bold tracking-[0.22em] text-teal-700 uppercase">
              05 / HOW SMARTFARM AI WORKS
            </p>
            <h2 className="font-editorial mt-3 text-4xl text-slate-900 sm:text-6xl">
              From leaf capture to <span className="italic text-teal-700">actionable harvest</span>{" "}
              decisions.
            </h2>
          </RevealOnScroll>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW_STEPS.map((item, idx) => (
              <RevealOnScroll key={item.step} delayMs={idx * 90}>
                <div className="h-full rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-xs">
                  <span className="font-editorial text-4xl italic text-teal-700">
                    {item.step}
                  </span>
                  <h3 className="mt-3 text-base font-extrabold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {item.description}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SUNRISE HORIZON CTA & DARK FOOTER ==================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0E2B24] via-[#154439] to-[#081915] pt-24 text-center text-white">
        {/* Warm Amber-Teal Sunrise Glow Behind Hills */}
        <div
          className="pointer-events-none absolute bottom-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(253,224,71,0.55)_0%,rgba(45,212,191,0.28)_45%,transparent_75%)] blur-2xl sm:h-96 sm:w-96"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-3xl px-4 pb-28 sm:px-6">
          <RevealOnScroll>
            <p className="text-xs font-bold tracking-[0.24em] text-teal-200 uppercase">
              READY TO EXPERIENCE PRECISION AGRONOMY?
            </p>
            <h2 className="font-editorial mt-4 text-5xl leading-[1.06] text-white sm:text-7xl">
              Turn agricultural data into{" "}
              <span className="italic text-amber-200">intelligent harvests.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base">
              Create your isolated farm workspace in seconds, or launch our pre-configured demo
              environment to explore live MobileNetV2 scans, weather risk intelligence, and Cohere
              RAG citations.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                to={isAuthenticated ? "/dashboard" : "/register"}
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-xs font-extrabold text-[#0B221D] shadow-xl transition hover:scale-[1.02] hover:bg-amber-100 sm:text-sm"
              >
                {isAuthenticated ? "Go to Dashboard" : "Create Farm Account"}
                <ArrowUpRight className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={handleQuickDemo}
                disabled={demoLoading}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-[#0B221D]/60 px-6 py-3.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-[#0B221D] sm:text-sm"
              >
                <FileSpreadsheet className="h-4 w-4 text-teal-300" />
                {demoLoading ? "Opening Demo..." : "Launch Demo Workspace"}
              </button>
            </div>
          </RevealOnScroll>
        </div>

        {/* Layered Rolling Dark Hill Silhouettes */}
        <div className="relative w-full overflow-hidden leading-none" aria-hidden="true">
          <svg
            viewBox="0 0 1440 160"
            fill="none"
            preserveAspectRatio="none"
            className="h-24 w-full sm:h-36"
          >
            <path
              d="M0 70C320 10 620 125 980 65C1190 30 1340 55 1440 80V160H0V70Z"
              fill="#0C241E"
            />
            <path
              d="M0 105C380 155 760 45 1180 100C1310 117 1390 110 1440 98V160H0V105Z"
              fill="#071713"
            />
          </svg>
        </div>

        {/* Minimal Grounded Footer Bar */}
        <footer className="border-t border-white/10 bg-[#071713] px-4 py-8 text-left sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-400/15 text-teal-300">
                <Sprout className="h-4 w-4" />
              </div>
              <div>
                <span className="font-editorial text-2xl text-white">
                  Smart<span className="text-teal-300">Farm</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  Where Agronomy Meets Intelligence.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-xs font-medium text-slate-400">
              {NAV_LINKS.map((item) => (
                <a key={item.href} href={item.href} className="hover:text-teal-300">
                  {item.label}
                </a>
              ))}
            </div>

            <p className="text-[11px] text-slate-500">
              FastAPI • TensorFlow • Cohere RAG • © {new Date().getFullYear()} SmartFarm AI
            </p>
          </div>
        </footer>
      </section>
    </div>
  );
}