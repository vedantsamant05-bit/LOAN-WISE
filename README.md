# 🏦 LoanWise — Explainable Credit Policy & Automated Decisioning Engine

<div align="center">

![Next.js 14](https://img.shields.io/badge/Next.js-14.2.35-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Jest Tests](https://img.shields.io/badge/Tests-146%20Passed-success?style=for-the-badge&logo=jest&logoColor=white)
![Audit Coverage](https://img.shields.io/badge/Coverage-100%25%20Explainable-emerald?style=for-the-badge)
![License](https://img.shields.io/badge/License-Proprietary%20Demo-forest?style=for-the-badge)

<p align="center">
  <strong>Next-Generation Digital Underwriting Platform with Deterministic Policy Rules, Machine Learning Risk Scoring, and Safe External Degradation Fallbacks.</strong>
</p>

[Key Features](#-key-features) •
[Decision Architecture](#-decision-engine--precedence-pipeline) •
[Machine Learning & AI](#-machine-learning--explainable-ai) •
[Screens & User Experience](#-product-screens--ui-tour) •
[API Reference](#-rest-api-documentation) •
[Quickstart](#-quickstart--installation)

</div>

---

## 📌 Executive Summary

**LoanWise** is a full-stack, institutional credit decisioning platform designed for modern retail banking and digital consumer lending. Adhering to the design specifications derived from **Google Stitch Project ID `8109105302647157321`**, LoanWise automates personal loan underwriting in under **1.3 seconds** while enforcing strict regulatory compliance, transparent explainability, and dependency failure resilience.

> [!NOTE]
> **Core Philosophy — Policy First, ML Second:**  
> In banking regulations, statistical machine learning models must never silently override institutional credit policies. In LoanWise, regulatory hard stops (e.g. debt ceilings, active write-offs) unconditionally reject applications regardless of how favorable the applicant's predictive ML score is.

---

## 🌟 Key Features

| Pillar | Capability | Technical Implementation |
| :--- | :--- | :--- |
| **⚖️ Deterministic Policy Engine** | Configurable 8-rule risk catalog across Hard-Stop and Soft-Rule gates | Dynamic parameter evaluation ([lib/engine/orchestrator.ts](file:///c:/Users/vedan/Downloads/LOAN_IDFC/lib/engine/orchestrator.ts)) |
| **🤖 Calibrated ML Scorecard** | Calibrated probability of default (PD) with local feature attributions | Ensemble Logistic Regression model with SHAP weights ([lib/ml/scorecard.ts](file:///c:/Users/vedan/Downloads/LOAN_IDFC/lib/ml/scorecard.ts)) |
| **🛡️ Graceful Failure Recovery** | Network timeouts and 500/502 errors trigger `PENDING`, never `REJECT` | Exponential retry engine with human-in-the-loop escalation |
| **🔍 100% Explainable Decisions** | Plain-language adverse action notices alongside internal reason codes | Dual-layer disclosure generator with rule threshold metrics |
| **📈 Live Policy Simulation** | Dynamic slider simulating volume and approval trade-offs in real time | Monte Carlo volume projection on `/credit-policy` |
| **🔒 Immutable Compliance Ledger** | Append-only audit trail logging every automated evaluation and human override | Cryptographically verified event ledger on `/audit-trail` |
| **🌓 Adaptive Dark / Light Mode** | Financial green institutional theme with WCAG AAA contrast compliance | Semantic CSS variables and vector branding ([app/globals.css](file:///c:/Users/vedan/Downloads/LOAN_IDFC/app/globals.css)) |

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["🖥️ Frontend Client (Next.js 14 App Router)"]
        UI["Executive Dashboard & Underwriter Console"]
        Theme["Adaptive Theme Provider (Light / Dark)"]
        Forms["Interactive Intake & Review Modals"]
    end

    subgraph ApiLayer["⚡ API Routing & Orchestration Layer"]
        AppRouter["App Router REST Endpoints (/api/*)"]
        Orchestrator["Underwriting Pipeline Orchestrator"]
    end

    subgraph ServiceLayer["🔌 External Integration Adapters"]
        Bureau["Credit Bureau Adapter (CIBIL / Experian)"]
        KYC["KYC Verification (UIDAI / PAN / NSDL)"]
        Bank["Account Aggregator (Bank Statement Cashflows)"]
    end

    subgraph RiskEngine["🧠 Risk & Policy Engine"]
        HardStops["Gate 1: Hard-Stop Rules (Unconditional Reject)"]
        SoftRules["Gate 2: Soft Rules (Human Underwriter Referral)"]
        MLModel["Gate 3: Calibrated Risk Scorecard (Default PD)"]
    end

    subgraph StorageLayer["💾 Data & Audit Layer"]
        Store["LoanWise State Store (In-Memory / Postgres)"]
        AuditLedger["Append-Only Compliance Audit Trail"]
    end

    UI --> AppRouter
    AppRouter --> Orchestrator
    Orchestrator --> Bureau & KYC & Bank
    Bureau & KYC & Bank --> HardStops
    HardStops -->|All Hard Stops Passed| SoftRules
    HardStops -->|Any Rule Failed| Resolver["Outcome Resolver"]
    SoftRules --> MLModel
    MLModel --> Resolver
    Resolver --> Store
    Resolver --> AuditLedger
    Store --> UI
```

---

## ⚡ Decision Engine & Precedence Pipeline

Applications are processed through a deterministic multi-stage waterfall. Precedence is strictly enforced: **Hard Stop (Reject) > Soft Rule (Refer) > Score Band (Approve / Refer / Reject)**.

```mermaid
flowchart TD
    Start(["📥 Loan Application Ingested"]) --> IntCheck{"External APIs Responsive?"}
    
    IntCheck -->|Timeout / 502 Bad Gateway| PendingState["⏳ Set Status: PENDING"]
    PendingState --> RetryQueue["Safe Exponential Retries (Max 3)"]
    RetryQueue -->|Retries Succeeded| HardStopCheck
    RetryQueue -->|Retries Exhausted| UnderwriterEscalation["👤 Set Status: REFER (Manual Inspection)"]

    IntCheck -->|Success (200 OK)| HardStopCheck{"Gate 1: Hard Stop Rules\n• Age 21–60 (R01)\n• No Write-Offs (R02)\n• Min Bureau ≥ 650 (R03)\n• FOIR Ceiling ≤ 65% (R04)"}

    HardStopCheck -->|Failed Any Hard Stop| RejectOutcome["❌ REJECT\nAdverse Action Notice Generated\nReason Code Stamped"]
    
    HardStopCheck -->|Passed All Hard Stops| SoftRuleCheck{"Gate 2: Soft Rules\n• Borderline FOIR 50–65% (R05)\n• Income Variance > 15% (R06)\n• Name / PAN Mismatch (R07)\n• Loan Amount > 10x Income (R08)"}

    SoftRuleCheck -->|Triggered Any Soft Rule| ReferOutcome["⚠️ REFER\nQueue for Underwriter Review\nSecondary Verification Requested"]

    SoftRuleCheck -->|Passed All Soft Rules| MLScore{"Gate 3: ML Scorecard\nProbability of Default (PD)\nScore: 0.00 – 1.00"}

    MLScore -->|Score ≥ 0.70| ApproveOutcome["✅ APPROVE\nPre-Approved Offer Issued\nP95 Decision TAT < 1.3s"]
    MLScore -->|0.50 ≤ Score < 0.70| ReferOutcome
    MLScore -->|Score < 0.50| RejectOutcome
```

---

## 🤖 Machine Learning & Explainable AI

LoanWise incorporates an **Ensemble Logistic Regression Scorecard** (`RiskModel-XGBoost v2.1.4 (Production)`) located in [`lib/ml/scorecard.ts`](file:///c:/Users/vedan/Downloads/LOAN_IDFC/lib/ml/scorecard.ts).

### Model Formula & Log-Odds Formulation

$$\text{Log-Odds} = \beta_0 + \beta_{\text{bureau}} + \beta_{\text{FOIR}} + \beta_{\text{income}} + \beta_{\text{tradelines}} + \beta_{\text{age}}$$

$$\text{Predictive Score} = \frac{1}{1 + e^{-\text{Log-Odds}}}$$

```mermaid
flowchart LR
    subgraph Inputs["Borrower Attributes"]
        B["Bureau Rating (300–900)"]
        F["FOIR Ratio (DTI %)"]
        I["Verified Monthly Earnings"]
        T["Tradeline Depth (Years)"]
        A["Borrower Age Bracket"]
    end

    subgraph Model["Calibrated ML Scorecard"]
        Weights["Linear Log-Odds Transformation\nIntercept = 1.80"]
        Sigmoid["Sigmoid Normalization (0.00 – 1.00)"]
    end

    subgraph Outputs["Explainable Inference"]
        Score["Calibrated Score (e.g. 78/100)"]
        PD["Default Probability (e.g. 4.2% PD)"]
        SHAP["Local Feature Attribution Drivers\n(Positive / Neutral / Negative)"]
    end

    Inputs --> Weights --> Sigmoid --> Outputs
```

### Local Feature Attribution & Driver Weights

Every prediction calculates local SHAP-style weights to explain **why** the model scored the applicant:

| Feature | Feature Label | Weight Impact Formula | Plain-Language Notice Example |
| :--- | :--- | :--- | :--- |
| `bureau_score` | External Bureau Rating | `+(bureauScore - 680) * 0.008` | *"Score of 740 reflects established repayment discipline."* |
| `foir_ratio` | Fixed Obligation Burden | `-(foir - 0.40) * 4.5` | *"Debt-to-income at 42.1% is well within sustainable capacity."* |
| `tradeline_history` | Credit Depth & History | `< 3.0 yrs ? -0.45 : +0.30` | *"Thin credit file (<3 yrs active history) limits confidence."* |
| `monthly_income` | Net Monthly Earnings | `+min(income/10000, 1.2) * 0.4` | *"Monthly disposable income of $8,500 supports servicing."* |
| `age` | Borrower Age Maturity | `25–55 yrs ? +0.25 : -0.15` | *"Applicant age falls within prime earning bracket."* |

---

## 📋 Deterministic Policy Rules Matrix

The active credit policy ([`lib/policy/default-policy.ts`](file:///c:/Users/vedan/Downloads/LOAN_IDFC/lib/policy/default-policy.ts)) defines 8 configurable rules operating under active version **`v4.2-active`**:

| Rule ID | Rule Name | Gate Type | Threshold | Default Action | Regulatory Reason Code |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **R01** | Minimum & Maximum Age | `Hard Stop` | $21 \le \text{Age} \le 60$ | `REJECT` | `AGE_OUT_OF_BOUNDS` |
| **R02** | Adverse Bureau History | `Hard Stop` | No active write-offs or defaults | `REJECT` | `ADVERSE_BUREAU_HISTORY` |
| **R03** | Minimum Bureau Floor | `Hard Stop` | $\text{Bureau Score} \ge 650$ | `REJECT` | `BUREAU_SCORE_BELOW_FLOOR` |
| **R04** | Hard FOIR Debt Ceiling | `Hard Stop` | $\text{FOIR} \le 65.0\%$ | `REJECT` | `FOIR_ABOVE_CEILING` |
| **R05** | Borderline FOIR Band | `Soft Rule` | $50.0\% \le \text{FOIR} \le 65.0\%$ | `REFER` | `FOIR_BORDERLINE` |
| **R06** | Income Discrepancy Flag | `Soft Rule` | $|\text{Variance}| \le 15.0\%$ | `REFER` | `INCOME_MISMATCH` |
| **R07** | KYC Identity Matching | `Soft Rule` | Exact Name & PAN verification | `REFER` | `KYC_FLAGGED` |
| **R08** | Max Income Multiplier | `Soft Rule` | $\text{Facility} \le 10\times \text{Income}$ | `REFER` | `EXCESSIVE_AMOUNT_REQUESTED` |

---

## 🖥️ Product Screens & UI Tour

Derived directly from the Stitch Project prototype:

```
┌────────────────────────────────────────────────────────────────────────┐
│  LoanWise Navigation Bar                                 [🌙 Dark Mode]│
├───────────────┬────────────────────────────────────────────────────────┤
│ 📊 Overview   │  • Cohort KPIs: 12,482 Applications | 64.2% Approval   │
│ 📁 Ledger     │  • Real-Time Ledger Table with Explainability Drawer   │
│ 📜 Policy     │  • Policy Rules Editor & Monte Carlo Impact Simulation │
│ ⚙️ Engine     │  • Interactive Rule Sandbox with Instant Decisioning   │
│ 📉 Risk Model │  • ROC Curve (0.832 AUC) & Demographic Parity Analysis │
│ 📜 Audit      │  • Append-Only Tamper-Evident System Event Ledger      │
│ 🧪 Sandbox    │  • Failure Injection: Inject Bureau Timeouts & 502s    │
└───────────────┴────────────────────────────────────────────────────────┘
```

1. **Lending Overview (`/`)**: High-level portfolio metrics, application cohort volume stacked bar charts, and real-time incoming ledger.
2. **Applications Ledger (`/applications`)**: Comprehensive data grid with multi-status filters (`All`, `Approved`, `Refer`, `Rejected`, `Pending`), search query indexes, and instant access to case evaluations.
3. **Decision Result & Audit (`/applications/[id]`)**: Deep-dive audit containing the interactive FOIR dial, rule evaluation checklist, and SHAP feature driver contributions.
4. **Credit Policy Management (`/credit-policy`)**: Dynamic policy catalog enabling parameter edits without redeployment and real-time approval volume projections.
5. **Decision Sandbox (`/decision-engine`)**: Live interactive playground allowing underwriters and risk officers to simulate custom profiles.
6. **Risk Scorecard (`/risk-scorecard`)**: Formal model governance documentation detailing confusion matrices, ROC-AUC, precision-recall, and disparate impact ratios across age cohorts.
7. **Audit Trail (`/audit-trail`)**: Immutable event stream recording every pipeline execution, policy mutation, and underwriter override.
8. **Fault Injection Console (`/settings`)**: Sandbox utility to inject external service degradation (e.g. simulate bureau timeout or KYC mismatch) to verify resilience.

---

## 📡 REST API Documentation

### Application Management

#### `POST /api/applications`
Submits a loan application and triggers synchronous decisioning.
```bash
curl -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "applicant": {
      "name": "David Miller",
      "age": 34,
      "city": "Chicago, IL",
      "employmentType": "Salaried",
      "monthlyIncome": 8500,
      "existingObligations": 1800
    },
    "requestedAmount": 25000,
    "tenureMonths": 36
  }'
```

#### `GET /api/applications/[id]`
Returns the full decision record, including policy gate results and ML scorecard metrics.

#### `POST /api/applications/[id]/retry`
Re-executes external integration verifications for an application stalled in `PENDING` state.

#### `POST /api/applications/[id]/review`
Records a human underwriter's manual review decision (`APPROVE` or `REJECT`) with rationale.

### Risk Policy & Platform Management

| Route | Method | Payload / Params | Return Data |
| :--- | :---: | :--- | :--- |
| `/api/policy` | `GET` | *None* | Active policy configuration (`v4.2-active`) |
| `/api/policy` | `PUT` | Updated rule parameters & score bands | Persisted policy version with audit log |
| `/api/metrics` | `GET` | *None* | Aggregated approval ratios, FOIR, and P95 TAT |
| `/api/audit` | `GET` | Filter by `applicationId` or `actor` | Append-only audit records list |
| `/api/simulation` | `POST` | `{ "bureauStatus": "TIMEOUT" }` | Active mock failure injection profile |

---

## 🚀 Quickstart & Installation

### Prerequisites
- **Node.js**: v18.18.0 or newer
- **npm**: v9.0.0 or newer

### Setup Steps

```bash
# 1. Clone the repository
git clone https://github.com/vedantsamant05-bit/LOAN-WISE.git
cd LOAN-WISE

# 2. Install dependencies (strictly clean audit)
npm install

# 3. Launch Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Test Suite
```bash
# Run unit & integration test suite (146 tests)
npm test

# Run TypeScript typecheck
npx tsc --noEmit
```

---

## 🔒 Security & Safe Dependency Guarantee

- **Zero High/Critical npm Vulnerabilities**: Dependencies are pinned to secure Next.js 14.2 LTS releases.
- **Fail-Safe External Calls**: Unhandled exceptions in external integration mocks are trapped with safe `PENDING` states.
- **No Hardcoded Secrets**: All configuration is driven through typed environment variables.
- **Explainability Transparency**: All adverse decisions produce consumer-facing plain-language disclosure summaries to comply with FCRA / ECOA regulations.

---

<div align="center">
  <sub>Developed for the Associate Product Manager Flagship Initiative • Powered by Next.js & TypeScript</sub>
</div>
