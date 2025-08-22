# Product Requirements Document (PRD) — RiskPilot

## 1) Summary
RiskPilot turns a short form into a transparent **Low/Med/High** compliance risk score and a **PDF report**.  
Admins monitor **Avg TTFR**, **% Downloads**, **% Useful**, and **Repeat Usage** to validate impact.

## 2) Background / Problem
- Manual contractor checks are slow and vary by reviewer.
- Startups need a quick pre-check to triage risks before detailed review.

## 3) Objectives & Success Metrics
- **Avg Time-to-First-Result < 60s**
- **≥ 70%** of submissions result in a **PDF download**
- **≥ 60%** mark the result as **Useful**
- **≥ 20%** **repeat usage** within 7 days

## 4) Scope & Requirements

### Must-have
- Form → risk score with rationale
- PDF download of the result
- Feedback (Useful: Yes/No)
- Admin dashboard with KPIs (TTFR, downloads, useful %, repeat usage)
- CSV/aggregates export

### Should-have
- Time-series charts on admin
- High-risk alert (email/Slack) with rate limiting

### Could-have
- PDF thumbnail preview on results
- Trust page/disclaimer and privacy statement pages

### Non-Goals
- Full GRC platform
- Automated legal decisioning
- Deep integrations (HRIS, payroll) in MVP

## 5) Users & Personas
- HR Manager — fast triage, shareable report
- Compliance Analyst — consistent rules, audit proof
- Finance Ops — payout risk context

## 6) User Stories 
- As an **HR Manager**, when I submit a contractor form, I want a clear risk score within 60 seconds so I can decide next steps.  
- As a **Compliance Analyst**, I want a downloadable PDF with rationale so I can attach it to the case file.  
- As **Finance Ops**, I want to see a risk level before payout to decide whether to hold or escalate.

## 7) Acceptance Criteria
- `/api/score` returns `{id, level, reasons}` in < 2s under normal load.
- `/api/result-ready` records `t_first_result_ms` once the result is visible.
- `/api/report?id=...` streams a PDF and marks `downloaded_pdf=true`.
- `/api/feedback` records `feedback=yes|no`.
- `/api/admin/aggregates` returns accurate KPIs for the pilot.

## 8) Rollout Plan
- Pilot with 5–10 users for 1–2 weeks.
- Publish a 1-page **Pilot Report** with KPIs and screenshots.
- Decide: extend rules / integrate alerts / pursue integrations.

## 9) Risks & Mitigations
- **Low adoption** → Remove friction, add sample data, clarify value on landing.
- **Privacy concerns** → Store minimal PII; document retention and admin key.
- **Data quality** → Validate form inputs; capture version of rules in PDF.
