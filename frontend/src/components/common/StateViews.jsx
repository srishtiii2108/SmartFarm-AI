import React from "react";
import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function LoadingState({ message = "Loading agricultural telemetry..." }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-forest-100 bg-white p-8 text-center shadow-sm">
      <Loader2 className="h-9 w-9 animate-spin text-forest-700" />
      <p className="mt-3 text-sm font-medium text-slate-700">{message}</p>
      <p className="mt-1 text-xs text-slate-400">Querying live PostgreSQL & AI services</p>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50/80 p-5 sm:flex-row sm:items-center"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <div>
          <h3 className="text-sm font-semibold text-red-900">Unable to complete request</h3>
          <p className="mt-0.5 text-sm text-red-700">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-forest-200 bg-forest-50/40 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-100 text-forest-700">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-3.5 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}