import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Sprout,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

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

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError("");
    try {
      await login(email.trim(), password);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setError("");
    try {
      await login("demo@smartfarm.ai", "Demo@1234");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="font-sans-ui relative flex min-h-screen flex-col justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_25%,#164238_0%,#0B221D_60%,#071713_100%)] px-4 py-12 text-white sm:px-6 lg:px-8">
      {/* Subtle Ambient Botanical Accents */}
      <FloatingLeaf className="animate-leaf-slow top-20 left-[12%] h-6 w-6 text-teal-400/35" />
      <FloatingLeaf className="animate-leaf-reverse right-[14%] bottom-24 h-7 w-7 text-emerald-300/30" />

      <div className="relative z-10 mx-auto w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-200/85 transition hover:text-teal-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Landing Page
        </Link>

        {/* Brand Header */}
        <div className="mt-5 flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-300/30 bg-teal-400/15 text-teal-300 shadow-lg">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.22em] text-teal-300 uppercase">
              • WORKSPACE SIGN IN
            </p>
            <h1 className="font-editorial text-4xl leading-none text-white">
              Welcome back to <span className="italic text-teal-300">SmartFarm</span>
            </h1>
          </div>
        </div>

        {/* Glass Auth Card */}
        <div className="mt-6 rounded-3xl border border-white/12 bg-[#0E2923]/85 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
          <p className="mb-5 text-xs leading-relaxed text-slate-300">
            Sign in to access your isolated farm plots, MobileNetV2 scans, weather risk alerts,
            and harvest inventory.
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-400/35 bg-red-950/60 px-4 py-3 text-xs font-medium text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold tracking-wide text-slate-200">
                Email Address
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-300/60" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  className="w-full rounded-xl border border-white/15 bg-[#081A16]/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-teal-300 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold tracking-wide text-slate-200">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-300/60" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/15 bg-[#081A16]/80 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-teal-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-teal-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || demoLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-extrabold tracking-wide text-[#0B221D] shadow-md transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign In to Workspace
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/12" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
              Quick Evaluation
            </span>
            <div className="h-px flex-1 bg-white/12" />
          </div>

          {/* Demo Workspace Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading || demoLoading}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-teal-300/35 bg-teal-400/10 px-4 py-2.5 text-xs font-bold text-teal-200 transition hover:border-teal-300 hover:bg-teal-400/20 disabled:opacity-60"
          >
            {demoLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-teal-300" />
            ) : (
              <Sparkles className="h-4 w-4 text-teal-300" />
            )}
            Launch Demo Farm (demo@smartfarm.ai)
          </button>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-300" />
            <span>HS256 JWT Session • Bcrypt Protected</span>
          </div>

          <p className="mt-5 border-t border-white/10 pt-5 text-center text-xs text-slate-300">
            Don&apos;t have a farm workspace yet?{" "}
            <Link to="/register" className="font-bold text-teal-300 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}