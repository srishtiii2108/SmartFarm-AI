import React, { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sprout,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (pw) => pw.length >= 8 && pw.length <= 72 },
  { id: "upper", label: "One uppercase letter (A-Z)", test: (pw) => /[A-Z]/.test(pw) },
  { id: "lower", label: "One lowercase letter (a-z)", test: (pw) => /[a-z]/.test(pw) },
  { id: "digit", label: "One number (0-9)", test: (pw) => /\d/.test(pw) },
  {
    id: "special",
    label: "One special character (@, #, $, !, %, *, ?, &)",
    test: (pw) => /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(pw),
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

export default function RegisterPage() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    farm_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(form.password) })),
    [form.password]
  );

  const passedCount = ruleResults.filter((r) => r.passed).length;
  const allRulesPassed = passedCount === PASSWORD_RULES.length;
  const passwordsMatch =
    form.confirm_password.length > 0 && form.password === form.confirm_password;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const strengthLabel =
    passedCount <= 1
      ? { text: "Weak", color: "bg-red-400", textColor: "text-red-300" }
      : passedCount <= 3
      ? { text: "Moderate", color: "bg-amber-400", textColor: "text-amber-300" }
      : passedCount === 4
      ? { text: "Good", color: "bg-sky-400", textColor: "text-sky-300" }
      : { text: "Strong", color: "bg-teal-300", textColor: "text-teal-300" };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!allRulesPassed) {
      setError("Please satisfy all password complexity requirements before creating your account.");
      return;
    }
    if (!passwordsMatch) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: form.full_name.trim(),
        farm_name: form.farm_name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans-ui relative flex min-h-screen flex-col justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#164238_0%,#0B221D_62%,#071713_100%)] px-4 py-10 text-white sm:px-6 lg:px-8">
      {/* Subtle Ambient Botanical Accents */}
      <FloatingLeaf className="animate-leaf-slow top-16 left-[10%] h-6 w-6 text-teal-400/35" />
      <FloatingLeaf className="animate-leaf-reverse right-[12%] bottom-20 h-7 w-7 text-emerald-300/30" />

      <div className="relative z-10 mx-auto w-full max-w-lg">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-200/85 transition hover:text-teal-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Landing Page
        </Link>

        {/* Brand Header */}
        <div className="mt-4 flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-300/30 bg-teal-400/15 text-teal-300 shadow-lg">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.22em] text-teal-300 uppercase">
              • NEW TENANT WORKSPACE
            </p>
            <h1 className="font-editorial text-4xl leading-none text-white">
              Create Your <span className="italic text-teal-300">SmartFarm</span> Workspace
            </h1>
          </div>
        </div>

        {/* Glass Registration Card */}
        <div className="mt-6 rounded-3xl border border-white/12 bg-[#0E2923]/85 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
          <p className="mb-5 text-xs leading-relaxed text-slate-300">
            Row-level isolated storage for your plots, MobileNetV2 disease scans, Open-Meteo
            forecasts, and harvest batches.
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-400/35 bg-red-950/60 px-4 py-3 text-xs font-medium text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold tracking-wide text-slate-200">
                  Full Name *
                </label>
                <div className="relative mt-1.5">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-300/60" />
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Rohan Kulkarni"
                    className="w-full rounded-xl border border-white/15 bg-[#081A16]/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-300 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold tracking-wide text-slate-200">
                  Farm / Organization *
                </label>
                <div className="relative mt-1.5">
                  <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-300/60" />
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={150}
                    value={form.farm_name}
                    onChange={(e) => setForm({ ...form, farm_name: e.target.value })}
                    placeholder="GreenValley Agro"
                    className="w-full rounded-xl border border-white/15 bg-[#081A16]/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-300 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold tracking-wide text-slate-200">
                Email Address *
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-300/60" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="rohan@greenvalley.in"
                  className="w-full rounded-xl border border-white/15 bg-[#081A16]/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-teal-300 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold tracking-wide text-slate-200">
                Password *
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-300/60" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Create a strong password"
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

              {/* Real-time Password Strength Meter & Checklist */}
              <div className="mt-3 rounded-2xl border border-white/10 bg-[#081A16]/75 p-3.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-300">Password Security Strength</span>
                  <span className={strengthLabel.textColor}>{strengthLabel.text}</span>
                </div>
                <div className="mt-1.5 flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        passedCount >= step ? strengthLabel.color : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>

                <ul className="mt-3 space-y-1.5 text-[11px]">
                  {ruleResults.map((rule) => (
                    <li
                      key={rule.id}
                      className={`flex items-center gap-2 ${
                        rule.passed ? "font-semibold text-teal-300" : "text-slate-400"
                      }`}
                    >
                      {rule.passed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-300" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                      )}
                      {rule.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold tracking-wide text-slate-200">
                Confirm Password *
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-300/60" />
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  placeholder="Re-enter your password"
                  className="w-full rounded-xl border border-white/15 bg-[#081A16]/80 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-teal-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-teal-300"
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.confirm_password.length > 0 && !passwordsMatch && (
                <p className="mt-1.5 text-[11px] font-semibold text-red-300">
                  Passwords do not match yet.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !allRulesPassed || !passwordsMatch}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-extrabold tracking-wide text-[#0B221D] shadow-md transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-45 sm:text-sm"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Account &amp; Enter Workspace
            </button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-300" />
            <span>Bcrypt Hashing • HS256 JWT • Isolated Farm Data</span>
          </div>

          <p className="mt-4 border-t border-white/10 pt-4 text-center text-xs text-slate-300">
            Already have a farm workspace?{" "}
            <Link to="/login" className="font-bold text-teal-300 hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}