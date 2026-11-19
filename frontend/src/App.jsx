import React, { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SidebarLayout from "./components/layout/SidebarLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import DiseaseDetectionPage from "./pages/DiseaseDetectionPage";
import PredictionHistoryPage from "./pages/PredictionHistoryPage";
import WeatherPage from "./pages/WeatherPage";
import AssistantPage from "./pages/AssistantPage";
import CropsPage from "./pages/CropsPage";
import InventoryPage from "./pages/InventoryPage";
import AnalyticsPage from "./pages/AnalyticsPage";

const ROUTE_TITLES = {
  "/": "SmartFarm AI — Precision Agronomy & Crop Intelligence",
  "/login": "Sign In | SmartFarm AI",
  "/register": "Create Farm Workspace | SmartFarm AI",
  "/dashboard": "Smart Dashboard | SmartFarm AI",
  "/disease-detection": "Disease Scanner | SmartFarm AI",
  "/predictions": "Prediction History | SmartFarm AI",
  "/weather": "Weather & Risk Intel | SmartFarm AI",
  "/assistant": "AI Farming Assistant | SmartFarm AI",
  "/crops": "Crop Management | SmartFarm AI",
  "/inventory": "Produce Inventory | SmartFarm AI",
  "/analytics": "Analytics & Reports | SmartFarm AI",
};

function DocumentTitleUpdater() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = ROUTE_TITLES[pathname] || "SmartFarm AI — Precision Agronomy";
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <DocumentTitleUpdater />
        <Routes>
          {/* Public SaaS Marketing & Authentication Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Multi-Tenant Farm Workspace */}
          <Route
            element={
              <ProtectedRoute>
                <SidebarLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/disease-detection" element={<DiseaseDetectionPage />} />
            <Route path="/predictions" element={<PredictionHistoryPage />} />
            <Route path="/weather" element={<WeatherPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/crops" element={<CropsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}