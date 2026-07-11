"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useImportFlow } from "@/hooks/useImportFlow";
import { useImportLeads } from "@/hooks/useImportLeads";
import { useFileValidation } from "@/hooks/useFileValidation";
import { apiClient, ApiError } from "@/lib/api-client";
import type { CrmRecord, SkippedRecord, ImportResult } from "@groweasy/shared";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getCrmStatusBadge(status: string | null) {
  if (!status) return <span className="badge badge-gray">—</span>;
  const map: Record<string, { cls: string; label: string }> = {
    GOOD_LEAD_FOLLOW_UP: { cls: "badge-green", label: "Good Lead" },
    DID_NOT_CONNECT: { cls: "badge-yellow", label: "Not Connected" },
    BAD_LEAD: { cls: "badge-red", label: "Bad Lead" },
    SALE_DONE: { cls: "badge-indigo", label: "Sale Done" },
  };
  const m = map[status] ?? { cls: "badge-gray", label: status };
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}

// ─── Sample CSV data ──────────────────────────────────────────────────────────

const SAMPLE_CSV = `Full Name,Email Address,Phone Number,Created Time,Notes,City,State,Source
John Doe,john@example.com,+91 9876543210,2026-05-13,Interested in 2BHK flat,Mumbai,Maharashtra,meridian_tower
Jane Smith,jane@example.com,1234567890,2026-05-14,Needs follow up ASAP,Delhi,Delhi,leads_on_demand
Bob Johnson,,9988776655,2026-05-15,No email — call only,Bangalore,Karnataka,eden_park
Alice Wong,alice@example.com,,2026-05-16,Ready to buy,Hyderabad,Telangana,varah_swamy
Charlie Brown,charlie@example.com,8877665544,2026-05-17,,Pune,Maharashtra,`;

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sample-leads.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Import Modal ─────────────────────────────────────────────────────────────

type ModalStep = "drop" | "preview" | "importing" | "done";

interface ImportModalProps {
  onClose: () => void;
  onImportComplete: (result: ImportResult) => void;
}

function ImportModal({ onClose, onImportComplete }: ImportModalProps) {
  const [step, setStep] = useState<ModalStep>("drop");
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    phase: importPhase,
    progress,
    result,
    error: importError,
    startImport,
  } = useImportLeads();

  const { validate, validationError } = useFileValidation();

  // Sync import hook → modal step
  useEffect(() => {
    if (importPhase === "done" && result && step === "importing") {
      setStep("done");
      onImportComplete(result);
    } else if (importPhase === "error" && importError && step === "importing") {
      setError(importError);
      setStep("preview");
    }
  }, [importPhase, result, importError, step, onImportComplete]);

  async function handleFile(f: File) {
    setError(null);
    if (!validate(f)) return;
    setFile(f);
    setUploading(true);
    try {
      const res = await apiClient.uploadCsv(f);
      setUploadId(res.uploadId);
      setHeaders(res.headers);
      setPreview(res.preview);
      setRowCount(res.rowCount);
      setStep("preview");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirm() {
    if (!uploadId) return;
    setStep("importing");
    await startImport(uploadId);
  }

  const pct =
    progress.totalBatches > 0
      ? Math.round((progress.completedBatches / progress.totalBatches) * 100)
      : 0;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box animate-fade-in">
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">Import Leads via CSV</div>
            <div className="modal-subtitle">Upload a CSV file to bulk import leads into your system.</div>
          </div>
          <button className="modal-close" onClick={onClose} id="modal-close-btn">✕</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* ── Drop Step ── */}
          {step === "drop" && (
            <div>
              {/* Drop zone */}
              <div
                id="dropzone-area"
                className={`dropzone${isDragOver ? " drag-over" : ""}`}
                style={{ marginBottom: 16 }}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  style={{ display: "none" }}
                  id="csv-file-input"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
                />
                {uploading ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                    <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
                    <div style={{ fontSize: "0.9375rem", color: "var(--text-secondary)" }}>Uploading…</div>
                  </div>
                ) : (
                  <>
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%",
                      background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 16px", fontSize: "1.5rem"
                    }}>
                      ⬆
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: 6 }}>
                      {isDragOver ? "Drop your CSV here" : "Drop your CSV file here"}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: 14 }}>
                      or click to browse files
                    </div>
                    <span className="badge badge-gray" style={{ fontSize: "0.8rem" }}>
                      Supported file: .csv (max 5MB)
                    </span>
                  </>
                )}
              </div>

              {/* Error */}
              {(error || validationError) && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8,
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                  color: "#ef4444", fontSize: "0.875rem", marginBottom: 12
                }}>
                  ⚠ {error ?? validationError?.message}
                </div>
              )}

              {/* Hint */}
              <div className="hint-box">
                <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--text-label)" }}>
                  Required headers:
                </div>
                <div style={{ fontFamily: "monospace", fontSize: "0.8rem", lineHeight: 1.7, color: "var(--text-muted)" }}>
                  created_at, name, email, country_code, mobile_without_country_code, company, city, state, country, lead_owner, crm_status, crm_note, data_source, possession_time, description
                </div>
                <div style={{ marginTop: 8, color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                  Template includes default + custom CRM fields to reduce upload errors.
                </div>
              </div>
            </div>
          )}

          {/* ── Preview Step ── */}
          {step === "preview" && file && (
            <div>
              {/* File pill */}
              <div className="file-pill">
                <div style={{
                  width: 38, height: 38, borderRadius: 8,
                  background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.1rem", flexShrink: 0
                }}>📄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    {formatBytes(file.size)} · {rowCount} rows · {headers.length} columns
                  </div>
                </div>
                <button
                  onClick={() => { setFile(null); setStep("drop"); setError(null); }}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.1rem", padding: 4 }}
                >✕</button>
              </div>

              {/* Preview table */}
              <div style={{ border: "1px solid var(--border-color)", borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
                <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 280 }}>
                  <table style={{ minWidth: headers.length * 130 }}>
                    <thead>
                      <tr>
                        {headers.map(h => <th key={h}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 25).map((row, i) => (
                        <tr key={i}>
                          {headers.map(h => (
                            <td key={h} title={row[h]}>
                              {row[h] || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{
                  padding: "8px 14px", borderTop: "1px solid var(--border-color)",
                  background: "var(--bg-input)", fontSize: "0.8125rem", color: "var(--text-muted)",
                  display: "flex", justifyContent: "space-between"
                }}>
                  <span>Showing {Math.min(25, preview.length)} of {rowCount} rows</span>
                  <span>{headers.length} columns detected</span>
                </div>
              </div>

              {error && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8, marginBottom: 12,
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                  color: "#ef4444", fontSize: "0.875rem"
                }}>⚠ {error}</div>
              )}
            </div>
          )}

          {/* ── Importing Step ── */}
          {step === "importing" && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "rgba(249,115,22,0.08)", border: "2px solid rgba(249,115,22,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", fontSize: "2rem",
                animation: "spin 3s linear infinite"
              }}>🤖</div>

              <div style={{ fontWeight: 700, fontSize: "1.0625rem", marginBottom: 8, color: "var(--text-primary)" }}>
                AI is mapping your leads…
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 24, maxWidth: 340, margin: "0 auto 24px" }}>
                Claude is analyzing columns and mapping them to the GrowEasy CRM schema
              </div>

              {/* Progress */}
              <div style={{ maxWidth: 340, margin: "0 auto" }}>
                {progress.totalBatches > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.8125rem" }}>
                    <span style={{ color: "var(--text-secondary)" }}>
                      Batch {progress.completedBatches} of {progress.totalBatches}
                    </span>
                    <span style={{ color: "var(--accent-orange)", fontWeight: 600 }}>{pct}%</span>
                  </div>
                )}
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: progress.totalBatches > 0 ? `${pct}%` : "100%",
                    background: progress.totalBatches > 0
                      ? "var(--accent-orange)"
                      : "linear-gradient(90deg, #f97316, #fb923c, #f97316)",
                    backgroundSize: "400px 100%",
                    animation: progress.totalBatches > 0 ? undefined : "shimmer 1.5s linear infinite"
                  }} />
                </div>
                <div style={{ marginTop: 8, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  {rowCount} rows · processing in batches of 20
                </div>
              </div>
            </div>
          )}

          {/* ── Done Step ── */}
          {step === "done" && result && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--text-primary)", marginBottom: 6 }}>
                Import Complete!
              </div>
              <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: 24 }}>
                {result.totalImported.toLocaleString()} leads imported · {result.totalSkipped} skipped
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <div style={{ padding: "14px 24px", borderRadius: 12, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#22c55e" }}>{result.totalImported}</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Imported</div>
                </div>
                <div style={{ padding: "14px 24px", borderRadius: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f59e0b" }}>{result.totalSkipped}</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Skipped</div>
                </div>
                {result.batches.retried > 0 && (
                  <div style={{ padding: "14px 24px", borderRadius: 12, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#6366f1" }}>{result.batches.retried}</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Retried</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {step === "drop" && (
            <>
              <button className="btn btn-secondary" onClick={downloadSample} id="download-sample-btn">
                ⬇ Download Sample CSV Template
              </button>
              <button className="btn btn-primary" onClick={() => inputRef.current?.click()} id="upload-file-btn">
                Upload File
              </button>
            </>
          )}
          {step === "preview" && (
            <>
              <button className="btn btn-secondary" onClick={onClose} id="cancel-btn">Cancel</button>
              <button className="btn btn-primary" onClick={handleConfirm} id="confirm-import-btn">
                Upload File
              </button>
            </>
          )}
          {step === "importing" && (
            <button className="btn btn-secondary" disabled id="importing-cancel-btn">Processing…</button>
          )}
          {step === "done" && (
            <button className="btn btn-primary" onClick={onClose} id="done-close-btn">
              View Leads
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Lead Sources Page ────────────────────────────────────────────────────────

function LeadSourcesPage({ onImport }: { onImport: () => void }) {
  const sources = [
    { name: "Facebook Ads", icon: "📘", color: "#1877f2", status: "Connected", leads: 0 },
    { name: "Google Ads", icon: "🔴", color: "#ea4335", status: "Not Connected", leads: 0 },
    { name: "CSV Import", icon: "📄", color: "#6366f1", status: "Active", leads: 0 },
    { name: "WhatsApp", icon: "💬", color: "#22c55e", status: "Not Connected", leads: 0 },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Topbar */}
      <div className="main-topbar">
        <div>
          <div className="main-topbar-title">Lead Sources</div>
          <div className="main-topbar-subtitle">Connect, manage, and control all your lead channels from one dashboard.</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-indigo btn-sm" onClick={onImport} id="import-csv-btn">
            ⬆ Import CSV
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="main-body">
        <div style={{ marginBottom: 20, fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
          Active Lead Sources
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {sources.map(src => (
            <div key={src.name} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `${src.color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.375rem"
                }}>
                  {src.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9375rem" }}>{src.name}</div>
                  <span className={`badge ${src.status === "Connected" || src.status === "Active" ? "badge-green" : "badge-gray"}`} style={{ fontSize: "0.7rem" }}>
                    {src.status}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: 12 }}>
                {src.leads} leads this month
              </div>
              {src.name === "CSV Import" ? (
                <button className="btn btn-primary btn-sm" style={{ width: "100%" }} onClick={onImport}>
                  Import Now
                </button>
              ) : (
                <button className="btn btn-secondary btn-sm" style={{ width: "100%" }}>
                  {src.status === "Not Connected" ? "+ Connect" : "Manage"}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Help */}
        <div style={{
          marginTop: 32, padding: "20px 24px", borderRadius: 12,
          background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)"
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--text-primary)" }}>📌 CSV Import Tips</div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
            Our AI automatically maps any column names to the GrowEasy schema — works with Facebook Lead Ads, Google Ads exports,
            real estate CRM dumps, or hand-made spreadsheets. No manual mapping needed.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Manage Leads Page ────────────────────────────────────────────────────────

function ManageLeadsPage({
  result,
  onImportMore,
}: {
  result: ImportResult;
  onImportMore: () => void;
}) {
  const [search, setSearch] = useState("");
  const [showSkipped, setShowSkipped] = useState(false);

  const filtered = result.records.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.mobile_without_country_code?.includes(q)
    );
  });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Topbar */}
      <div className="main-topbar">
        <div>
          <div className="main-topbar-title">Manage Your Leads</div>
          <div className="main-topbar-subtitle">Monitor lead status, assign tasks, and close deals faster.</div>
        </div>
        <div className="topbar-actions">
          {result.totalSkipped > 0 && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowSkipped(!showSkipped)}
              id="toggle-skipped-btn"
            >
              ⚠ {result.totalSkipped} Skipped
            </button>
          )}
          <button className="btn btn-indigo btn-sm" onClick={onImportMore} id="import-more-btn">
            ⬆ Import More
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="main-body">
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total Rows", value: result.totalRows, icon: "📊", color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
            { label: "Imported", value: result.totalImported, icon: "✅", color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
            { label: "Skipped", value: result.totalSkipped, icon: "⚠️", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
            { label: "AI Batches", value: result.batches.total, icon: "🤖", color: "#8b5cf6", bg: "rgba(139,92,246,0.08)" },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ padding: "16px" }}>
              <div className="stat-icon" style={{ background: s.bg, fontSize: "1.25rem" }}>{s.icon}</div>
              <div>
                <div className="stat-value" style={{ fontSize: "1.5rem", color: s.color }}>{s.value.toLocaleString()}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Your Leads */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>Your Leads</div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.875rem" }}>🔍</span>
            <input
              className="search-input"
              placeholder="Enter email or phone number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="search-leads-input"
            />
          </div>
        </div>

        {/* Imported records table */}
        <div className="data-table-wrap" style={{ marginBottom: showSkipped ? 24 : 0 }}>
          <div className="data-table-scroll" style={{ maxHeight: 420 }}>
            <table style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Email</th>
                  <th>Contact</th>
                  <th>Date Created</th>
                  <th>Company</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      No leads match your search
                    </td>
                  </tr>
                ) : (
                  filtered.map((rec, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {rec.name || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>—</span>}
                      </td>
                      <td title={rec.email ?? ""}>{rec.email || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                      <td>
                        {rec.mobile_without_country_code
                          ? `${rec.country_code ?? ""}${rec.mobile_without_country_code}`
                          : <span style={{ color: "var(--text-muted)" }}>—</span>
                        }
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                        {rec.created_at
                          ? (() => { try { return new Date(rec.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return rec.created_at; } })()
                          : "—"
                        }
                      </td>
                      <td>{rec.company || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                      <td>{rec.city || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                      <td>{getCrmStatusBadge(rec.crm_status)}</td>
                      <td>
                        {rec.data_source
                          ? <span className="badge badge-indigo" style={{ fontSize: "0.75rem" }}>{rec.data_source}</span>
                          : <span style={{ color: "var(--text-muted)" }}>—</span>
                        }
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" style={{ fontSize: "0.75rem", padding: "4px 10px" }}>
                          More ›
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div style={{
            padding: "10px 14px", borderTop: "1px solid var(--border-color)",
            background: "var(--bg-input)", display: "flex", justifyContent: "space-between",
            fontSize: "0.8125rem", color: "var(--text-muted)"
          }}>
            <span>{filtered.length.toLocaleString()} lead{filtered.length !== 1 ? "s" : ""}</span>
            {filtered.length > 0 && <span>Scroll to see all</span>}
          </div>
        </div>

        {/* Skipped records */}
        {showSkipped && result.totalSkipped > 0 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 12, color: "var(--text-primary)" }}>
              ⚠ Skipped Records ({result.totalSkipped})
            </div>
            <div className="data-table-wrap">
              <div className="data-table-scroll" style={{ maxHeight: 260 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Row #</th>
                      <th>Reason</th>
                      <th>Raw Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.skipped.map(s => (
                      <tr key={s.rowIndex}>
                        <td style={{ fontWeight: 600, color: "var(--accent-warning)", width: 60 }}>{s.rowIndex + 1}</td>
                        <td>
                          <span className={`badge ${s.reason.includes("email or mobile") ? "badge-yellow" : "badge-red"}`}>
                            {s.reason}
                          </span>
                        </td>
                        <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-muted)", maxWidth: 400 }}>
                          {JSON.stringify(s.raw).slice(0, 120)}…
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [activePage, setActivePage] = useState("lead-sources");

  const handleImportComplete = useCallback((result: ImportResult) => {
    setImportResult(result);
    setShowModal(false);
    setActivePage("manage");
  }, []);

  const handleNavigate = (id: string) => {
    setActivePage(id);
    if (id === "lead-sources" || id === "manage") {
      // valid pages
    }
  };

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />

      {/* Main content based on active page */}
      {activePage === "lead-sources" || (!importResult && activePage !== "manage") ? (
        <LeadSourcesPage onImport={() => setShowModal(true)} />
      ) : (
        <ManageLeadsPage
          result={importResult!}
          onImportMore={() => { setActivePage("lead-sources"); setShowModal(true); }}
        />
      )}

      {showModal && (
        <ImportModal
          onClose={() => setShowModal(false)}
          onImportComplete={handleImportComplete}
        />
      )}
    </div>
  );
}
