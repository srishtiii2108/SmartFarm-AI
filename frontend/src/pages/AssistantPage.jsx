import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Bot,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  Send,
  Sparkles,
  Upload,
  User,
} from "lucide-react";
import { apiClient } from "../api/client";
import { ErrorBanner, PageHeader } from "../components/common/StateViews";

const STARTER_PROMPTS = [
  "How do I manage Tomato Bacterial Spot and prevent spread?",
  "What humidity and temperature levels trigger Potato Late Blight?",
  "Best irrigation and soil practices for Bell Pepper crops?",
  "How should I store harvested tomatoes to minimize post-harvest loss?",
];

function extractAssistantText(payload, rawResponse) {
  const candidates = [
    payload?.assistant_reply,
    payload?.answer,
    payload?.response,
    payload?.reply,
    payload?.assistant_response,
    payload?.assistant_reply_text,
    payload?.assistant_message?.content,
    typeof payload?.assistant_message === "string" ? payload.assistant_message : null,
    payload?.message?.content,
    typeof payload?.message === "string" && payload.message !== "Success" ? payload.message : null,
    payload?.content,
    payload?.text,
    payload?.output,
    rawResponse?.assistant_reply,
    rawResponse?.answer,
    rawResponse?.response,
  ];

  for (const item of candidates) {
    if (typeof item === "string" && item.trim().length > 0) {
      return item.trim();
    }
  }
  return "Received a response, but no answer text was found.";
}

function normalizeCitations(rawCitations) {
  if (!Array.isArray(rawCitations)) return [];
  const seen = new Map();

  rawCitations.forEach((cit, idx) => {
    const title =
      cit.document_title || cit.title || cit.source_name || cit.source || `Field Guide #${idx + 1}`;
    const rawSim =
      typeof cit.similarity_score === "number"
        ? cit.similarity_score
        : typeof cit.similarity === "number"
        ? cit.similarity
        : typeof cit.score === "number"
        ? cit.score
        : null;
    const sim = rawSim !== null ? (rawSim > 1 ? rawSim / 100 : rawSim) : null;

    if (!seen.has(title) || (sim !== null && (seen.get(title).similarity ?? 0) < sim)) {
      seen.set(title, {
        title,
        similarity: sim,
        snippet: cit.section || cit.chunk_text || cit.snippet || title,
      });
    }
  });

  return Array.from(seen.values());
}

function renderFormattedText(text) {
  if (!text) return null;
  const lines = text.split("\n");

  return lines.map((line, lineIdx) => {
    const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
    const formattedLine = boldParts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return (
          <strong key={i} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      const italicParts = part.split(/(\*[^*]+\*)/g);
      return italicParts.map((sub, j) => {
        if (sub.startsWith("*") && sub.endsWith("*") && sub.length > 2) {
          return (
            <em key={`${i}-${j}`} className="italic">
              {sub.slice(1, -1)}
            </em>
          );
        }
        return sub;
      });
    });

    return (
      <React.Fragment key={lineIdx}>
        {formattedLine}
        {lineIdx < lines.length - 1 && "\n"}
      </React.Fragment>
    );
  });
}

export default function AssistantPage() {
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Namaste! I am your SmartFarm AI Crop Advisor. Ask me anything about crop diseases, pest care, watering schedules, or harvest storage—every answer is backed by our verified farming guides.",
      citations: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Farming Guides Library State
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadNotice, setUploadNotice] = useState("");

  const fetchDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const res = await apiClient.get("/knowledge/documents");
      const payload = res.data;
      const docs =
        payload?.items ||
        payload?.documents ||
        payload?.data?.items ||
        (Array.isArray(payload?.data) ? payload.data : null) ||
        (Array.isArray(payload) ? payload : []);
      setDocuments(docs);
    } catch {
      // Non-blocking if empty
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const sendMessage = async (promptText) => {
    const rawText = typeof promptText === "string" ? promptText : input;
    const text = rawText.trim();
    if (!text || sending) return;

    setError("");
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setSending(true);

    try {
      const requestBody = {
        message: text,
        ...(sessionId ? { session_id: sessionId } : {}),
      };

      const res = await apiClient.post("/chat", requestBody);
      const raw = res.data;
      const payload = raw?.data || raw;

      if (payload?.session_id) {
        setSessionId(payload.session_id);
      } else if (raw?.session_id) {
        setSessionId(raw.session_id);
      }

      const answerText = extractAssistantText(payload, raw);
      const rawCitations =
        payload?.citations || payload?.sources || raw?.citations || raw?.sources || [];
      const citations = normalizeCitations(rawCitations);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: answerText,
          citations,
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleNewChat = () => {
    setSessionId(null);
    setError("");
    setMessages([
      {
        role: "assistant",
        content:
          "Started a new crop advice chat. Ask your question below to get guidance from our verified farming guides.",
        citations: [],
      },
    ]);
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    setError("");
    setUploadNotice("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiClient.post("/knowledge/ingest", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadNotice(res.data?.message || `Added "${file.name}" to your farming guides.`);
      await fetchDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crop Advisory Assistant"
        subtitle="Practical farming guidance on plant care, disease prevention, watering, and storage—backed by trusted guides"
        action={
          <button
            type="button"
            onClick={handleNewChat}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-forest-300 hover:bg-forest-50/50 hover:text-forest-900"
          >
            <Plus className="h-3.5 w-3.5" />
            New Chat
          </button>
        }
      />

      {error && <ErrorBanner message={error} />}

      {uploadNotice && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs font-medium text-emerald-900">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            {uploadNotice}
          </span>
          <button
            type="button"
            onClick={() => setUploadNotice("")}
            className="text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Advisor Chat Window */}
        <div className="flex h-[640px] flex-col rounded-2xl border border-forest-100 bg-white shadow-xs lg:col-span-8">
          {/* Messages Scroll Area */}
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-2xs ${
                      isUser ? "bg-slate-800 text-white" : "bg-forest-800 text-white"
                    }`}
                  >
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? "bg-forest-800 text-white shadow-2xs"
                        : "border border-slate-200/80 bg-slate-50/90 text-slate-800"
                    }`}
                  >
                    <p className="whitespace-pre-line">
                      {isUser ? msg.content : renderFormattedText(msg.content)}
                    </p>

                    {/* Grounded Reference Sources */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 border-t border-slate-200/80 pt-2.5">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-forest-800">
                          Reference Guides Used ({msg.citations.length})
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {msg.citations.map((cit, cIdx) => {
                            const sim =
                              typeof cit.similarity === "number"
                                ? ` (${Math.round(cit.similarity * 100)}% match)`
                                : "";
                            return (
                              <span
                                key={cIdx}
                                title={cit.snippet}
                                className="inline-flex items-center gap-1 rounded-lg border border-forest-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-forest-900 shadow-2xs"
                              >
                                <FileText className="h-3 w-3 text-forest-700" />
                                {cit.title}
                                {sim}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-forest-800 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin text-forest-700" />
                  Checking farming guides and preparing your answer...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Starter Prompt Chips */}
          {messages.length <= 2 && (
            <div className="border-t border-slate-100 bg-forest-50/40 px-4 py-3">
              <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                <Sparkles className="h-3 w-3 text-forest-700" />
                Common Questions You Can Ask
              </p>
              <div className="flex flex-wrap gap-1.5">
                {STARTER_PROMPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendMessage(q)}
                    className="rounded-xl border border-forest-200 bg-white px-2.5 py-1 text-left text-[11px] font-medium text-slate-700 transition hover:border-forest-500 hover:bg-forest-50 hover:text-forest-900"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2 border-t border-slate-100 p-4"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about crop diseases, sprays, soil care, watering, or storage..."
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-forest-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-forest-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-900 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Ask
            </button>
          </form>
        </div>

        {/* Right Column: Farming Guides Library */}
        <div className="flex flex-col justify-between rounded-2xl border border-forest-100 bg-white p-5 shadow-xs lg:col-span-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-forest-700" />
                <h2 className="text-base font-bold text-slate-900">Farming Guides</h2>
              </div>
              <span className="rounded-full bg-forest-50 px-2.5 py-0.5 text-xs font-bold text-forest-800">
                {documents.length} {documents.length === 1 ? "Guide" : "Guides"}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Answers are pulled strictly from these trusted guides so you get reliable, accurate
              advice.
            </p>

            {/* Upload New Guide Button */}
            <div className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt,.pdf"
                onChange={handleDocUpload}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingDoc}
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-forest-300 bg-forest-50/50 px-4 py-2.5 text-xs font-semibold text-forest-900 transition hover:bg-forest-100 disabled:opacity-50"
              >
                {uploadingDoc ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding guide to library...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Add Farming Guide (.md, .txt, .pdf)
                  </>
                )}
              </button>
            </div>

            {/* Indexed Documents List */}
            <div className="mt-4 max-h-[380px] space-y-2.5 overflow-y-auto pr-1">
              {loadingDocs ? (
                <p className="py-6 text-center text-xs text-slate-400">Loading farming guides...</p>
              ) : documents.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
                  No farming guides added yet. Upload a markdown, text, or PDF guide above.
                </p>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id || doc.title}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-forest-200 hover:bg-forest-50/30"
                  >
                    <div className="flex items-start gap-2.5">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-900">
                          {doc.title || doc.filename}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {doc.total_chunks || doc.chunk_count
                            ? `${doc.total_chunks || doc.chunk_count} sections indexed`
                            : "Ready for crop advice"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
            <strong className="text-slate-800">Verified Advice Only:</strong> If a topic is not
            covered in your farming guides, the assistant lets you know instead of guessing.
          </div>
        </div>
      </div>
    </div>
  );
}