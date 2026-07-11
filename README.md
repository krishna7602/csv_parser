# 🌱 GrowEasy AI-Powered CSV Importer

> **Position Applied For:** Full-Time Software Engineer  
> **Submitted to:** varun@groweasy.ai

An AI-powered full-stack app that accepts any CRM/lead-export CSV (Facebook Ads, Google Ads, real estate CRMs, manual spreadsheets), previews it with zero AI cost, then uses Claude to intelligently map arbitrary columns onto the GrowEasy CRM schema — batching requests, retrying failures, and returning detailed import vs. skipped records.

---

## 🏗️ Architecture

```
groweasy-csv-importer/
├── apps/
│   ├── web/          → Next.js 16 (App Router) + Tailwind CSS v4
│   └── api/          → Express + TypeScript backend
├── packages/
│   └── shared/       → Single source of truth for CrmRecord, ImportResult, etc.
├── sample-csvs/      → 3 sample CSVs for testing
├── Dockerfile.web    → Multi-stage Next.js Docker image
├── Dockerfile.api    → Multi-stage Express Docker image
└── docker-compose.yml
```

**Architecture boundary rule enforced:**  
`routes → controllers → services → (ai / repositories)`  
Controllers never touch AI clients. Services never touch `req`/`res`.

### Data Flow

```
CSV Upload (multipart)
  ↓ [POST /api/csv/upload]
Backend parses + stores raw rows (no AI)
  ↓ Returns uploadId + preview
Frontend shows preview (papaparse client-side)
  ↓ User clicks "Confirm & Import"
  ↓ [POST /api/csv/:uploadId/import]
Backend: chunk rows into batches → parallel AI calls (p-limit concurrency)
  ↓ Each batch: Claude maps columns → Zod validates → skip rule applied
  ↓ Failed batches retry (exp backoff, 3 attempts)
  ↓ Aggregated ImportResult
Frontend polls [GET /api/csv/:uploadId/status] every 2s
  ↓ Results: ImportSummaryCards + ParsedRecordsTable + SkippedRecordsTable
```

---

## 🚀 Quick Start

### Prerequisites

- [pnpm](https://pnpm.io/) ≥ 9.0 — `corepack enable && corepack prepare pnpm@latest --activate`
- Node.js ≥ 20
- Anthropic API key (`sk-ant-...`)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/groweasy-csv-importer.git
cd groweasy-csv-importer
pnpm install
```

### 2. Environment Variables

**Backend** — copy and fill in your key:
```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env and set ANTHROPIC_API_KEY=sk-ant-...
```

**Frontend** — copy:
```bash
cp apps/web/.env.local.example apps/web/.env.local
# Default: NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Build Shared Package

```bash
pnpm --filter @groweasy/shared build
```

### 4. Run Both Apps

```bash
pnpm dev
# API: http://localhost:3001
# Web: http://localhost:3000
```

Or run individually:
```bash
pnpm --filter api dev    # backend only
pnpm --filter web dev    # frontend only
```

---

## 🐳 Docker

```bash
# Add your API key to a .env file in the project root
echo "ANTHROPIC_API_KEY=sk-ant-your-key" > .env

docker compose up --build
# Web: http://localhost:3000
# API: http://localhost:3001
```

---

## 📡 API Reference

### `POST /api/csv/upload`

Upload a CSV file for parsing (no AI cost).

**Request:** `multipart/form-data`, field `file` (`.csv`, ≤5MB)

**Response `200`:**
```json
{
  "uploadId": "up_8f2a1b3c...",
  "headers": ["Full Name", "Email Address", "Phone"],
  "rowCount": 214,
  "preview": [ { "Full Name": "John Doe", ... } ]
}
```

**Error codes:**
| Code | Status | Meaning |
|------|--------|---------|
| `NO_FILE` | 400 | No file field in request |
| `EMPTY_FILE` | 400 | File is 0 bytes |
| `INVALID_FILE_TYPE` | 400 | Not a CSV file |
| `FILE_TOO_LARGE` | 413 | Exceeds MAX_UPLOAD_MB |
| `UNPARSEABLE_CSV` | 422 | csv-parse failed |

---

### `POST /api/csv/:uploadId/import`

Starts async AI extraction. Returns immediately.

**Response `202`:**
```json
{
  "uploadId": "up_8f2a1b3c...",
  "status": "processing",
  "message": "Import started for 214 rows"
}
```

---

### `GET /api/csv/:uploadId/status`

Poll for job status and results.

**Response `200` (processing):**
```json
{
  "uploadId": "up_8f2a1b3c...",
  "status": "processing",
  "progress": { "completedBatches": 3, "totalBatches": 11 }
}
```

**Response `200` (done):**
```json
{
  "uploadId": "up_8f2a1b3c...",
  "status": "done",
  "progress": { "completedBatches": 11, "totalBatches": 11 },
  "result": {
    "uploadId": "up_8f2a1b3c...",
    "totalRows": 214,
    "totalImported": 198,
    "totalSkipped": 16,
    "records": [ { "name": "John Doe", "email": "john@example.com", ... } ],
    "skipped": [ { "rowIndex": 5, "raw": {...}, "reason": "No email or mobile number found" } ],
    "batches": { "total": 11, "succeeded": 10, "failed": 0, "retried": 1 }
  }
}
```

---

## 🤖 AI Prompting Strategy

The core of the system lives in [`apps/api/src/ai/prompts/crm-extraction.prompt.ts`](apps/api/src/ai/prompts/crm-extraction.prompt.ts).

**Design choices:**

1. **Batching (default 20 rows/batch):** Never send the whole CSV in one prompt. Batch processing with bounded concurrency (default 3 parallel batches) keeps token usage predictable and allows partial failures without losing the whole import.

2. **System prompt as a data-extraction contract:** The system prompt defines an exact JSON target schema with 14 keys, closed-enum constraints (`crm_status`, `data_source`), and explicit mapping rules (semantic column name matching, phone/email splitting, `crm_note` aggregation). The model is instructed to return *only* a raw JSON array — no markdown fences, no prose.

3. **Defensive parsing:** The client strips accidental markdown fences before `JSON.parse`, and validates each record against a Zod schema independently. Per-record failures skip only that record; the batch is still counted as succeeded.

4. **Retry with exponential backoff:** Network errors, 5xx responses, and malformed-JSON errors all trigger the `retry()` utility (max 3 attempts, 500ms → 1.5s → 4s backoff). If all retries fail, the batch's rows are moved to `skipped` with reason `"AI extraction failed after retries"`.

5. **Swap-able client interface:** `AnthropicClient` implements `ILLMClient { extractBatch(rows, headers): Promise<unknown[]> }`. Adding an `OpenAiClient` or `GeminiClient` requires only implementing this interface and wiring it in `import.controller.ts`.

6. **Deterministic skip rule (not AI's job):** The skip rule (no `email` AND no `mobile_without_country_code`) is enforced in `record-validator.service.ts`, not delegated to the AI. Defense-in-depth enum whitelisting also happens here.

---

## 🧪 Testing

```bash
# All tests
pnpm test

# Backend only
pnpm --filter api test

# With watch mode
pnpm --filter api test:watch
```

**Test coverage:**
- **Unit:** `csv-parser.service`, `batching.service`, `record-validator.service`, `retry.ts`
- **Integration:** `POST /upload` (happy path, empty file, no file), `POST /import` + `GET /status` with mocked `ILLMClient` — never hits Anthropic API

---

## 🌍 Deployment

### Backend → Railway / Render

**Required env vars:**
```
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001 (or your host's PORT)
BATCH_SIZE=20
BATCH_CONCURRENCY=3
MAX_UPLOAD_MB=5
NODE_ENV=production
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**Build command:** `pnpm install && pnpm --filter @groweasy/shared build && pnpm --filter api build`  
**Start command:** `node apps/api/dist/server.js`

### Frontend → Vercel

**Required env vars (Vercel dashboard → Settings → Environment Variables):**
```
NEXT_PUBLIC_API_URL=https://your-api.railway.app
```

**Build command:** `pnpm install && pnpm --filter @groweasy/shared build && pnpm --filter web build`  
**Output directory:** `apps/web/.next`

---

## 📁 Sample CSVs

Three test CSVs in [`sample-csvs/`](sample-csvs/):

| File | Style | Notable challenges |
|------|-------|--------------------|
| `facebook-leads.csv` | Facebook Lead Ads export | Mixed phone formats (+91 prefix, dashes), missing emails |
| `google-ads-leads.csv` | Google Ads leads | Campaign/ad name columns, AI infers `data_source` |
| `manual-spreadsheet.csv` | Hand-made spreadsheet | Ambiguous dates, "mob no"/"mail" headers, multiple phones, inconsistent status values |

---

## ⚠️ Known Limitations & Trade-offs

1. **Stateless / in-memory job store:** Job results are lost on server restart. The `IJobRepository` interface makes it straightforward to swap in Postgres/Redis — see [`in-memory-job.repository.ts`](apps/api/src/repositories/in-memory-job.repository.ts).

2. **Import is async with polling:** `POST /import` returns immediately; frontend polls every 2s. For very long imports (1000+ rows), a Server-Sent Events (SSE) stream would give smoother progress UX. Polling is simpler and works without WebSocket infrastructure.

3. **No authentication:** All upload/import endpoints are open. In production, add an API key middleware or session-based auth.

4. **AI non-determinism:** Claude may occasionally produce slightly different `crm_note` aggregations for the same input. The Zod schema + enum enforcement ensure the output is always structurally valid.

5. **5MB file size limit:** Configurable via `MAX_UPLOAD_MB` env var. The in-memory Multer storage means larger files need streaming + a streaming CSV parser.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| Backend | Node.js + Express, TypeScript |
| AI | Anthropic Claude (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| CSV Parsing | PapaParse (frontend), csv-parse (backend) |
| Validation | Zod (env config, AI output, per-record schema) |
| Concurrency | p-limit (batch concurrency cap) |
| State Management | React `useReducer` (explicit state machine) |
| Testing | Vitest + Supertest |
| Containerization | Docker + Docker Compose |
