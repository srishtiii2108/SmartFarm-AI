import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2, Sprout } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 text-white shadow-md">
          <Sprout className="h-6 w-6" />
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Loader2 className="h-4 w-4 animate-spin text-forest-700" />
          Verifying secure farm workspace...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}