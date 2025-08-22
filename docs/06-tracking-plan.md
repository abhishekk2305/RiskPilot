# Tracking Plan — RiskPilot

## Identity & Privacy
- **User ID:** email (work). Hash if sending to third-party analytics.
- **IP:** store only **last octet**.
- **PII:** keep minimal; retention policy in repo notes.

## Events & Properties
1) **FormSubmitted**
   - `email`, `country`, `contractType`, `contractValueUsd`, `dataProcessing (yes/no)`
2) **RiskScored**
   - `id`, `score (num)`, `level (Low|Medium|High)`, `t_backend_ms`
3) **ResultViewed**
   - `id`, `t_first_result_ms`  *(primary KPI)*
4) **ReportDownloaded**
   - `id`
5) **FeedbackSubmitted**
   - `id`, `feedback (yes|no)`

## KPIs (Admin)
- **Avg TTFR (sec)** = avg(`t_first_result_ms`)/1000 where not null
- **% Downloads** = downloaded / submissions
- **% Useful** = yes / (yes + no)
- **Repeat Users** = emails with ≥ 2 submissions

## Storage
- Google Sheets (service account) → append/update rows
- Fallback: SQLite/JSON with append + update by `id`

## QA Checklist
- Verify `/api/result-ready` fires after result render
- PDF route marks `downloaded_pdf=true`
- Feedback route disabled after click; idempotent on server
