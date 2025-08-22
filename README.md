# RiskPilot — Contractor Compliance Risk in 60 Seconds

**Live Demo:** https://risk-pilot-abhishekdhama18.replit.app/  

---

## 🌍 Why RiskPilot?
Companies hiring globally face the same problem: **contractor compliance checks are slow, inconsistent, and often undocumented.**  
What should take a minute usually drags into a 15–30 minute manual review, with results that differ depending on who’s doing it.

**RiskPilot** was built to prove a simple idea:  
> *Can we give HR, Compliance, and Finance Ops teams a consistent risk score in under one minute — with an audit-ready report and measurable adoption metrics?*  

---

## 🚀 What It Does
- **Risk Score in 60 Seconds**  
  Enter basic contract details → instantly see **Low / Medium / High risk**, with reasons.  

- **Audit-Ready PDF**  
  Every result is downloadable as a timestamped PDF with the rationale baked in.  

- **Feedback Built In**  
  Users mark “Useful / Not Useful” so we know if the tool delivers value.  

- **Admin Dashboard**  
  KPIs at a glance:  
  - Average Time-to-First-Result (TTFR)  
  - % of users downloading reports  
  - % marking results as useful  
  - Repeat usage (same email using tool again)  

- **Exports for Case Studies**  
  Download raw and aggregated data to create pilot reports for leadership or investors.  

---

## 🛠 How It’s Built
- **Frontend:** React (Vite) + Tailwind CSS  
- **Backend:** Node.js (Express)  
- **Data Layer:** Google Sheets API (service account) with SQLite/JSON fallback  
- **PDF Generation:** pdfkit  
- **Analytics Dashboard:** Chart.js  
- **Admin Security:** simple key (`ADMIN_KEY`)  

Architecture at a glance:
User → Risk Form → Express API → Rules Engine → Risk Score + PDF
↘ Admin KPIs + Exports


---

## 📊 Why It Matters
RiskPilot isn’t just another form. It’s instrumented to capture **proof of impact**:

- **Avg TTFR**: how fast users get value  
- **% Downloads**: adoption of reports  
- **% Useful**: whether the score feels trustworthy  
- **Repeat Usage**: stickiness of the tool  


---

## 🔒 Disclaimer
RiskPilot is a **pilot tool**.  
It provides indicative scoring only and is **not legal advice**.  
Data collected is minimal (work email + form inputs) and stored only for pilot analytics.  

---

## 📌 Getting Started

Clone the repo and run locally:

(```bash
git clone https://github.com/abhishekk2305/RiskPilot
cd RiskPilot
cp .env.example .env
npm install
npm run dev

Fill in .env with your service account details:
GOOGLE_SA_EMAIL=
GOOGLE_SA_KEY=
GOOGLE_SHEET_ID=
ADMIN_KEY=your-secret''')

---

## 🗺 Roadmap

- **Now:** MVP + pilot analytics  
- **Next:** Alerts for high-risk submissions; richer scoring rules  
- **Later:** Integrations with HRIS/payroll; audit logs; GDPR/SOC2 trust features  

---

## 📄 License

MIT — see [LICENSE](./LICENSE)

---

## 🙌 A Note from the Maker

RiskPilot started as an experiment:  
*Could a single person ship, measure, and learn from a compliance tool MVP in under two weeks?*  

This repo documents that journey. Feedback is welcome — both on the code and the product approach.


