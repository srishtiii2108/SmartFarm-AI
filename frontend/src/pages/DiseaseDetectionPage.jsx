import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  FileImage,
  Info,
  Loader2,
  Microscope,
  ScanLine,
  ShieldAlert,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { apiClient } from "../api/client";
import { ErrorBanner, PageHeader } from "../components/common/StateViews";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function DiseaseDetectionPage() {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [crops, setCrops] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Real MobileNetV2 Evaluation Metrics State
  const [modelInfo, setModelInfo] = useState(null);
  const [showMetricsModal, setShowMetricsModal] = useState(false);

  useEffect(() => {
    apiClient
      .get("/crops", { params: { limit: 100 } })
      .then((res) => setCrops(res.data.items || []))
      .catch(() => {});

    apiClient
      .get("/predictions/model-info")
      .then((res) => setModelInfo(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelection = (file) => {
    setError("");
    setResult(null);

    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Unsupported file format. Please upload a JPEG, PNG, or WebP leaf image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image size exceeds 5 MB limit. Please select a smaller image.");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    handleFileSelection(droppedFile);
  };

  const clearSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl("");
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select or drop a leaf image before running diagnosis.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (selectedCropId) {
        formData.append("crop_id", selectedCropId);
      }

      const res = await apiClient.post("/predictions/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const evalMetrics = modelInfo?.evaluation?.test_metrics;
  const datasetInfo = modelInfo?.evaluation?.dataset;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Crop Disease Detection"
        subtitle="MobileNetV2 transfer-learning screening across Tomato, Potato, and Bell Pepper foliage"
        action={
          evalMetrics && (
            <button
              type="button"
              onClick={() => setShowMetricsModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-forest-200 bg-white px-4 py-2 text-xs font-semibold text-forest-800 shadow-xs transition hover:bg-forest-50"
            >
              <Microscope className="h-4 w-4 text-forest-700" />
              Model Benchmark ({(evalMetrics.accuracy * 100).toFixed(1)}% Test Acc)
            </button>
          )
        }
      />

      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Upload & Controls */}
        <form
          onSubmit={handlePredict}
          className="space-y-5 rounded-2xl border border-forest-100 bg-white p-6 shadow-xs lg:col-span-5"
        >
          <div>
            <label className="block text-sm font-bold text-slate-900">1. Upload Leaf Photograph</label>
            <p className="mt-0.5 text-xs text-slate-500">
              Supported: JPEG, PNG, WebP • Max 5 MB • Focus on a single clear leaf
            </p>
          </div>

          {!previewUrl ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-forest-200 bg-forest-50/40 px-6 py-12 text-center transition hover:border-forest-500 hover:bg-forest-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-100 text-forest-800">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-800">
                Click to upload or drag and drop
              </p>
              <p className="mt-1 text-xs text-slate-500">Tomato, Potato, or Bell Pepper leaf image</p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-forest-200 bg-slate-900">
              <img
                src={previewUrl}
                alt="Selected leaf preview"
                className="mx-auto max-h-64 w-full object-contain"
              />
              <button
                type="button"
                onClick={clearSelection}
                className="absolute right-3 top-3 rounded-full bg-slate-900/80 p-1.5 text-white backdrop-blur-xs transition hover:bg-red-600"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center justify-between bg-white px-3.5 py-2 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 truncate font-medium">
                  <FileImage className="h-3.5 w-3.5 text-forest-700" />
                  {selectedFile?.name}
                </span>
                <span>{(selectedFile?.size / 1024).toFixed(0)} KB</span>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFileSelection(e.target.files?.[0])}
            className="hidden"
          />

          {/* Optional Crop Association */}
          <div>
            <label htmlFor="crop-select" className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              2. Link to Registered Crop (Optional)
            </label>
            <select
              id="crop-select"
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-forest-600 focus:outline-none"
            >
              <option value="">-- Unassigned Quick Scan --</option>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.crop_category}) {c.location_name ? `• ${c.location_name}` : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!selectedFile || submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing Leaf & Uploading...
              </>
            ) : (
              <>
                <ScanLine className="h-4 w-4" />
                Run Disease Classification
              </>
            )}
          </button>

          {/* Scientific Limitation Disclaimer */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />
              <p>
                <strong>Dataset Scope Notice:</strong> Trained on PlantVillage studio leaf imagery (15 classes across Tomato, Potato, and Bell Pepper). Complex field lighting or non-target crops may lower confidence.
              </p>
            </div>
          </div>
        </form>

        {/* Right Column: Classification Output */}
        <div className="lg:col-span-7">
          {!result ? (
            <div className="flex h-full min-h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed border-forest-200 bg-white p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-50 text-forest-700">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">Ready for Leaf Diagnostics</h3>
              <p className="mt-1.5 max-w-md text-sm text-slate-500">
                Upload a leaf image on the left to inspect MobileNetV2 top-3 probability scores, pathogen metadata, and recommended preventive practices.
              </p>
            </div>
          ) : (
            <div className="space-y-5 rounded-2xl border border-forest-100 bg-white p-6 shadow-xs">
              {/* Primary Diagnosis Banner */}
              <div
                className={`rounded-2xl border p-5 ${
                  result.is_healthy
                    ? "border-emerald-200 bg-emerald-50/70"
                    : "border-amber-200 bg-amber-50/70"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                        result.is_healthy
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {result.is_healthy ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      )}
                      {result.is_healthy ? "Healthy Foliage Detected" : "Disease Stress Identified"}
                    </span>
                    <h2 className="mt-2.5 text-xl font-bold text-slate-900">
                      {result.predicted_label}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Model: <span className="font-semibold">{result.model_version}</span>
                      {result.crop_name ? ` • Linked Crop: ${result.crop_name}` : ""}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white px-4 py-2.5 text-right shadow-2xs">
                    <span className="block text-[11px] font-semibold uppercase text-slate-400">
                      Confidence
                    </span>
                    <span className="text-2xl font-extrabold text-forest-800">
                      {(result.confidence_score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {result.low_confidence_warning && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-100/80 px-3 py-2 text-xs font-medium text-amber-950">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-amber-700" />
                    Low confidence (&lt;60%). Retake photo in bright indirect light against a plain background or consult an agronomist.
                  </div>
                )}
              </div>

              {/* Top-3 Predictions Breakdown */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Top-3 Class Probability Distribution
                </h3>
                <div className="mt-3 space-y-2.5">
                  {result.top_predictions.map((item, idx) => {
                    const pct = (item.confidence * 100).toFixed(1);
                    return (
                      <div key={item.raw_class} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-800">
                            #{idx + 1} {item.label}
                          </span>
                          <span className="text-forest-800">{pct}%</span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full ${
                              idx === 0 ? "bg-forest-700" : "bg-slate-400"
                            }`}
                            style={{ width: `${Math.min(100, item.confidence * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Agronomic Guidance */}
              {result.disease_info && (
                <div className="space-y-3 rounded-2xl border border-forest-100 bg-forest-50/40 p-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
                      Pathogen / Cause
                    </span>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">
                      {result.disease_info.pathogen}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
                      Diagnostic Symptoms
                    </span>
                    <p className="mt-0.5 text-sm text-slate-700">{result.disease_info.symptoms}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
                      Recommended Preventive Practices
                    </span>
                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {result.disease_info.recommended_actions.map((act, i) => (
                        <li key={i}>{act}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    <Link
                      to="/assistant"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-forest-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-forest-900"
                    >
                      <Bot className="h-3.5 w-3.5" />
                      Ask AI Farming Assistant About This Condition
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Model Evaluation Benchmark Modal */}
      {showMetricsModal && evalMetrics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  MobileNetV2 Held-Out Test Evaluation
                </h3>
                <p className="text-xs text-slate-500">
                  {datasetInfo?.name} • Evaluated on {datasetInfo?.test_images} unseen test images
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMetricsModal(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-forest-50 p-3">
                <span className="text-[11px] font-semibold text-forest-800">Test Accuracy</span>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {(evalMetrics.accuracy * 100).toFixed(2)}%
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <span className="text-[11px] font-semibold text-slate-600">Weighted F1</span>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {evalMetrics.weighted_f1.toFixed(4)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <span className="text-[11px] font-semibold text-slate-600">Macro Precision</span>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {evalMetrics.macro_precision.toFixed(4)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <span className="text-[11px] font-semibold text-slate-600">Macro Recall</span>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {evalMetrics.macro_recall.toFixed(4)}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Documented Model Limitations
              </h4>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs text-slate-600">
                {(modelInfo?.evaluation?.known_limitations || []).map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}