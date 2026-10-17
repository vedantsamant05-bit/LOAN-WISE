# PLAN.md: Loan Eligibility & Decisioning Engine (Prototype)

> **Purpose:** Flagship project for an Associate Product Manager application (Retail Assets / digital lending).
> **Positioning:** A decisioning engine with a product management layer, not a large app with many features.
> **Disclaimer:** This is a prototype built on synthetic and public data with mock external services. It is not a real lending or credit-approval system. All thresholds are illustrative prototype choices, not banking standards.

---

## 1. Project at a glance

| Item | Decision |
|---|---|
| Name | Loan Decisioning Engine (prototype) |
| Product area | Retail assets: personal loan eligibility and decisioning |
| Core idea | Configurable credit policy + ML scorecard + safe fallbacks, returning explainable outcomes |
| Outcomes | `APPROVE`, `REJECT`, `REFER`, `PENDING` |
| Stack | Python, FastAPI, PostgreSQL, SQLAlchemy, Alembic, scikit-learn, pytest, Docker |
| Optional | Streamlit dashboard, lightweight UI, funnel analysis |
| Timeline | 4 weeks (about 8 to 10 hours per week; compress or stretch as needed) |
| Differentiator | Clear PRD, defensible trade-offs, honest metrics |

### What this project must prove (mapped to the JD)

| JD expectation | Evidence in this project |
|---|---|
| Translate business needs into tech solutions | PRD, decision table, user stories |
| Define requirements, user stories, business rules | PRD with acceptance criteria and rule catalogue |
| Work with Credit and Risk on lending rules and decisioning | Configurable policy, hard stops vs soft rules, reason codes |
| APIs and system integrations | REST API, mock bureau/KYC/income services, failure handling |
| Data-driven insight and experimentation | Metrics definitions, evaluation report, optional funnel analysis |
| AI/ML and digital decisioning | Logistic regression scorecard, combined with policy under documented logic |
| Risk, fraud, responsible lending | Fairness checks, explainability, basic fraud flags, human review path |
| Agile/Scrum familiarity | Sprint-style weekly plan, backlog, definition of done |

---

## 2. Principles (read before every work session)

1. **Finish a small thing well.** A tested core beats an unfinished large app.
2. **Policy first, ML second.** The model never silently overrides credit policy.
3. **A system failure is not a rejection.** Timeouts lead to Pending, retry, then Refer.
4. **Every decision is explainable.** Reason codes plus a plain-language message.
5. **Every threshold is configuration**, with an effective date.
6. **Report only measured results.** No invented AUC, accuracy or drop-off numbers.
7. **Document the why.** Every major design choice gets a trade-off note.

---

## 3. Scope

### 3.1 Core (must build)

| # | Deliverable | Summary |
|---|---|---|
| 01 | Configurable credit policy | Rules, thresholds, hard stops, soft rules, effective dates |
| 02 | Decisioning API | Approve / Reject / Refer / Pending with reason codes |
| 03 | Mock integrations + persistence | Bureau, KYC, income mocks; PostgreSQL; audit trail |
| 04 | ML scorecard | Logistic regression with documented evaluation |
| 05 | Product documentation | PRD, user stories, acceptance criteria, API docs, trade-offs |

### 3.2 Optional polish (only after core is tested)

- Simple dashboard (4 to 5 metrics)
- Lightweight application form or status page
- Funnel analysis section on a public dataset

### 3.3 Explicit non-goals

- Real credit bureau or KYC integration
- Real customer data of any kind
- Loan pricing, collections, disbursal
- Regulatory or compliance sign-off
- Production-grade authentication and consent management

---

## 4. Sample credit policy (prototype)

All values live in `config/policy.yaml` (or a `policy_rules` table). The numbers below are examples to start from.

### 4.1 Decision table

| ID | Condition | Type | Outcome | Reason code |
|---|---|---|---|---|
| R01 | Age outside 21 to 60 | Hard stop | REJECT | `AGE_OUT_OF_RANGE` |
| R02 | Active write-off or settled account on bureau | Hard stop | REJECT | `ADVERSE_BUREAU_HISTORY` |
| R03 | Bureau score below minimum cutoff | Hard stop | REJECT | `BUREAU_SCORE_BELOW_MIN` |
| R04 | FOIR above hard ceiling | Hard stop | REJECT | `FOIR_ABOVE_CEILING` |
| R05 | FOIR in borderline band | Soft rule | REFER | `FOIR_BORDERLINE` |
| R06 | Declared vs verified income differs beyond tolerance | Soft rule | REFER | `INCOME_MISMATCH` |
| R07 | KYC name or address mismatch | Soft rule | REFER (after re-verification request) | `KYC_MISMATCH` |
| R08 | Requested amount above income-linked cap | Soft rule | REFER | `AMOUNT_ABOVE_CAP` |
| S01 | Bureau, KYC or income API timeout or error | System failure | PENDING, retry, then REFER if unresolved | `DEPENDENCY_UNAVAILABLE` |
| M01 | All rules pass and score at or above approve cutoff | Score band | APPROVE | `POLICY_AND_SCORE_PASS` |
| M02 | All rules pass and score in mid band | Score band | REFER | `SCORE_MID_BAND` |
| M03 | All rules pass and score below floor | Score band | REJECT | `SCORE_BELOW_FLOOR` |

### 4.2 Evaluation order and precedence

1. **Validate input** (schema, ranges). Invalid input returns HTTP 422, not a decision.
2. **Fetch dependencies** (bureau, KYC, income) with timeout and retry policy.
3. **If any dependency is unresolved after retries**, outcome is `PENDING`, then `REFER` once retries are exhausted.
4. **Run hard-stop rules.** Any failure returns `REJECT` with all failed reason codes collected.
5. **Run soft rules.** Any triggered rule returns `REFER` with reason codes.
6. **Run scorecard** (only if no hard stop and no soft rule triggered).
7. **Apply score bands** to produce the final outcome.
8. **Persist** the full decision record and audit event.

Precedence: `REJECT` (hard stop) > `PENDING` / `REFER` (system or soft) > score band. Document this in the PRD.

### 4.3 Config schema (example)

```yaml
policy_version: "2026-10-v1"
effective_from: "2026-10-20"
rules:
  - id: R01
    name: age_range
    type: hard_stop
    params: { min_age: 21, max_age: 60 }
    outcome: REJECT
    reason_code: AGE_OUT_OF_RANGE
  - id: R04
    name: foir_ceiling
    type: hard_stop
    params: { max_foir: 0.65 }
    outcome: REJECT
    reason_code: FOIR_ABOVE_CEILING
  - id: R05
    name: foir_borderline
    type: soft
    params: { lower: 0.50, upper: 0.65 }
    outcome: REFER
    reason_code: FOIR_BORDERLINE
score_bands:
  approve_min: 0.75     # prototype choice, tune on validation data
  refer_min: 0.55
dependencies:
  timeout_seconds: 3
  max_retries: 2
```

Policy changes must create a **new version** (never edit in place). Each decision stores the `policy_version` that produced it.

---

## 5. Architecture

```
Client (curl / Swagger UI / optional form)
        |
        v
FastAPI service
  - validation, auth stub, request IDs
  - POST /applications, GET /applications/{id}, etc.
        |
        v
Decision orchestrator
  1. Dependency adapter  -> mock bureau / KYC / income services (with timeout, retry, failure injection)
  2. Rules engine        -> loads versioned policy config
  3. Scorecard           -> loads trained model artifact
  4. Outcome resolver    -> precedence + score bands + reason codes
        |
        v
PostgreSQL
  - applications, decisions, rule_results, audit_events, policy_versions
        |
        v
(Optional) Dashboard: conversion, outcome mix, TAT, manual-review rate
```

### 5.1 Design decisions to document

- Rules engine and scorecard are **separate components**; the orchestrator combines them.
- Dependency adapters are **interfaces**, so mocks can be swapped for real integrations later.
- Mock services support **failure injection** (timeout, 500, malformed response) so fallback logic is testable.
- Audit trail is **append-only**.

---

## 6. Repository structure

```
loan-decisioning-engine/
├── README.md
├── PLAN.md
├── docs/
│   ├── PRD.md
│   ├── decision_table.md
│   ├── user_stories.md
│   ├── tradeoffs.md
│   ├── model_card.md
│   ├── fairness_report.md
│   ├── metrics_definitions.md
│   └── limitations_and_prod_gaps.md
├── config/
│   └── policy.yaml
├── app/
│   ├── main.py
│   ├── api/                # routers, schemas
│   ├── core/               # settings, logging
│   ├── decisioning/
│   │   ├── orchestrator.py
│   │   ├── rules_engine.py
│   │   ├── outcome_resolver.py
│   │   └── reason_codes.py
│   ├── integrations/
│   │   ├── base.py         # adapter interfaces
│   │   ├── mock_bureau.py
│   │   ├── mock_kyc.py
│   │   └── mock_income.py
│   ├── ml/
│   │   ├── train.py
│   │   ├── evaluate.py
│   │   ├── scorecard.py    # inference wrapper
│   │   └── artifacts/
│   ├── db/                 # models, session, migrations
│   └── services/           # audit, policy loader
├── data/
│   ├── synthetic/          # generated applicants
│   └── README.md           # dataset sources and licences
├── notebooks/              # EDA and evaluation
├── tests/
│   ├── unit/
│   ├── integration/
│   └── scenarios/          # decision-table scenario tests
├── docker-compose.yml
├── Dockerfile
└── Makefile
```

---

## 7. Data model (PostgreSQL)

| Table | Key columns |
|---|---|
| `applications` | id, created_at, applicant_json (synthetic), requested_amount, tenure_months, status |
| `decisions` | id, application_id, outcome, reason_codes[], score, policy_version, model_version, tat_ms, created_at |
| `rule_results` | id, decision_id, rule_id, passed, observed_value, threshold |
| `dependency_calls` | id, application_id, service, status, latency_ms, attempt, error |
| `audit_events` | id, application_id, event_type, actor, payload_json, created_at (append-only) |
| `policy_versions` | version, config_json, effective_from, created_by |
| `manual_reviews` | id, application_id, assigned_to, resolution, notes, resolved_at |

Rules: store only synthetic data, never real PII, and keep `policy_version` and `model_version` on every decision for reproducibility.

---

## 8. API design

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/v1/applications` | Submit application, triggers decisioning |
| GET | `/v1/applications/{id}` | Status and latest decision |
| GET | `/v1/applications/{id}/decision` | Outcome, reason codes, applicant-facing message |
| GET | `/v1/applications/{id}/audit` | Full audit trail |
| POST | `/v1/applications/{id}/retry` | Retry a PENDING application |
| POST | `/v1/applications/{id}/review` | Record a manual-review resolution |
| GET | `/v1/policy/current` | Active policy version |
| POST | `/v1/policy` | Create a new policy version (admin stub) |
| GET | `/v1/metrics/summary` | Aggregate metrics for dashboard |
| GET | `/health` | Liveness check |

### Example response

```json
{
  "application_id": "app_01H...",
  "outcome": "REFER",
  "reason_codes": ["FOIR_BORDERLINE"],
  "applicant_message": "We need to review a few details before we can proceed. Our team will contact you.",
  "internal_detail": {
    "failed_rules": [],
    "triggered_soft_rules": [{"id": "R05", "observed": 0.58, "band": [0.50, 0.65]}],
    "score": null,
    "policy_version": "2026-10-v1",
    "model_version": "lr-v1"
  },
  "tat_ms": 412
}
```

Keep **internal detail** and **applicant-facing message** separate. Applicants should never see raw rule thresholds.

---

## 9. ML scorecard plan

### 9.1 Dataset
- Choose **one** public credit dataset (for example "Give Me Some Credit" or German Credit). Record source, licence, row count, target definition.
- Document that it is a proxy and does not represent the prototype's synthetic applicants exactly.

### 9.2 Method
1. EDA: missing values, outliers, class imbalance.
2. Train/validation/test split (stratified, fixed seed). Test set stays untouched until final evaluation.
3. **Baseline:** majority class and a simple logistic regression without tuning.
4. **Model:** logistic regression with class weights; compare against at least one alternative imbalance strategy only if justified (SMOTE is optional, not default).
5. Feature handling: scaling, binning or WOE only if it improves interpretability or performance; document choices.
6. Calibrate probabilities if scores are used as thresholds.

### 9.3 Evaluation (report only measured values)
- ROC-AUC, PR-AUC, precision, recall, F1 at chosen threshold, confusion matrix
- Calibration plot
- Coefficient-based explanation (top positive and negative drivers)
- Threshold selection rationale for the approve and refer cutoffs (a prototype choice)

### 9.4 Fairness and responsible lending checks
- Choose available sensitive or proxy attributes in the dataset (for example age band). State clearly if none are suitable.
- Compare approval rate and error rates across groups; document gaps and limits.
- Do not use sensitive attributes as model features without justification.
- Write down what you checked, what you could not check, and why.

### 9.5 Artifacts
- `model_card.md`: intended use, data, metrics, limitations, ethical considerations
- Versioned model file and metadata (`model_version`, training date, data hash)

---

## 10. Four-week execution plan

### Week 1: Product definition (no code yet, except scaffolding)

| Day | Tasks | Output |
|---|---|---|
| 1 | Research digital lending journey (application, KYC, bureau, offer, decision, disbursal). Study 2 to 3 public lender flows. | Notes, journey map |
| 2 | Write problem statement, personas, goals, non-goals | PRD sections 1 to 3 |
| 3 | Finalise decision table, precedence rules, reason codes | `decision_table.md` |
| 4 | Write 10 to 12 user stories with acceptance criteria (Given/When/Then) | `user_stories.md` |
| 5 | Define metrics and guardrails; write first trade-offs | `metrics_definitions.md`, `tradeoffs.md` v1 |
| 6 | Repo setup: structure, Docker, linting, CI stub, README skeleton | Working empty project |
| 7 | Review and buffer | PRD v1 committed |

**Exit criteria:** PRD v1 and decision table reviewed; repo initialised.

### Week 2: Core engine

| Day | Tasks | Output |
|---|---|---|
| 1 | Pydantic schemas, FastAPI skeleton, health endpoint | App runs, Swagger visible |
| 2 | Policy config loader with validation and versioning | `policy.yaml` loads and validates |
| 3 | Rules engine (hard stops, soft rules) with reason codes | Unit-tested rules |
| 4 | Mock bureau, KYC, income services with failure injection | Adapters + tests |
| 5 | Orchestrator: dependency calls, timeout, retry, PENDING to REFER fallback | End-to-end decision flow |
| 6 | Outcome resolver and applicant-facing messages | Decision responses |
| 7 | Scenario tests covering every row of the decision table | Green test suite |

**Exit criteria:** Every decision-table row has an automated scenario test; a bureau timeout never produces REJECT.

### Week 3: Persistence, audit, scorecard

| Day | Tasks | Output |
|---|---|---|
| 1 | PostgreSQL schema and Alembic migrations | DB created via migration |
| 2 | Persist applications, decisions, rule results, dependency calls | Records saved |
| 3 | Append-only audit trail; retry and manual-review endpoints | Audit endpoint works |
| 4 | EDA, baseline model, train/test split | Notebook, baseline metrics |
| 5 | Train logistic regression, evaluate, calibrate, choose cutoffs | `evaluate.py`, metrics file |
| 6 | Integrate scorecard into orchestrator (runs only after rules pass) | Combined decisions |
| 7 | Fairness checks, model card | `fairness_report.md`, `model_card.md` |

**Exit criteria:** Decisions reproducible from stored `policy_version` and `model_version`; all reported ML numbers come from saved evaluation outputs.

### Week 4: Documentation, hardening, optional polish

| Day | Tasks | Output |
|---|---|---|
| 1 | Finalise PRD (v2), trade-offs, limitations, production-readiness gaps | Docs complete |
| 2 | README: problem, architecture diagram, quickstart, demo script, screenshots | Polished README |
| 3 | Test coverage review, edge cases, input validation, error handling | Coverage report |
| 4 | Swagger/OpenAPI cleanup with examples | Clear API docs |
| 5 | Optional: dashboard with 4 to 5 metrics | Streamlit app |
| 6 | Record 3 to 5 minute demo (Loom or similar); dry-run interview walkthrough | Demo video |
| 7 | Final review, resume bullets, GitHub cleanup | Ready to apply |

**Exit criteria:** A stranger can clone the repo, run `docker compose up`, and reproduce the demo in under 10 minutes.

---

## 11. User stories (starter set)

| ID | Story | Acceptance criteria |
|---|---|---|
| US1 | As a **credit policy owner**, I can change the FOIR threshold without a code deployment. | Given a new policy version is created, when an application is submitted after its effective date, then the new threshold is used and the decision records the new `policy_version`. |
| US2 | As an **applicant**, I see a plain-language reason for my outcome. | Given any decision, the response contains an applicant message with no internal thresholds or rule IDs. |
| US3 | As a **credit analyst**, I see all triggered rules and observed values for a referred case. | Given a REFER, the internal detail lists each triggered rule, observed value and threshold. |
| US4 | As an **operations lead**, a dependency timeout does not reject the applicant. | Given the bureau mock times out, then the status is PENDING, retries occur per config, and unresolved cases become REFER, never REJECT. |
| US5 | As an **auditor**, I can reconstruct why a decision was made. | Given a decision ID, the audit endpoint returns inputs, dependency results, rule results, score, policy and model versions. |
| US6 | As a **risk manager**, a hard-stop failure always results in REJECT regardless of score. | Given a hard-stop rule fails and the score is high, the outcome is still REJECT. |
| US7 | As a **product manager**, I can see conversion, outcome mix and TAT. | Metrics endpoint returns the defined metrics for a date range. |
| US8 | As a **data scientist**, I can swap the model version without changing rules code. | Given a new model artifact and config, the orchestrator uses it and records `model_version`. |
| US9 | As a **credit analyst**, I can resolve a referred case manually. | Given a REFER, when I submit a review resolution, then the final status and audit event are recorded. |
| US10 | As a **compliance reviewer**, I can see fairness check results and limitations. | `fairness_report.md` documents groups compared, metrics, and gaps. |

---

## 12. Product metrics and guardrails

| Metric | Definition | Notes |
|---|---|---|
| Application completion rate | Completed submissions / started applications | Needs UI events; mark as simulated if no UI |
| Approval rate | APPROVE / decided applications | Track by policy version |
| Rejection rate | REJECT / decided applications | Split by hard stop vs score band |
| Referral rate | REFER / decided applications | Primary conversion-vs-risk lever |
| Pending-to-resolved rate | Pending cases resolved within retries | Reliability proxy |
| Decision TAT | Time from submission to decision (p50, p95) | System TAT only; manual review tracked separately |
| Manual-review rate | Referred / total, plus reasons | Watch for rule over-triggering |
| Guardrails | Approval-rate parity across groups; no REJECT from system failure; reason code coverage 100% | Alerts if breached |

Run synthetic traffic scripts to produce metrics, and label them **simulated** in docs.

---

## 13. Testing strategy

| Layer | What to test |
|---|---|
| Unit | Each rule at boundaries (age 20/21/60/61, FOIR just below/above bands) |
| Scenario | One test per decision-table row, including combined conditions and precedence |
| Integration | API to DB, audit trail written, policy version stored |
| Failure injection | Timeout, 500, malformed response for each dependency |
| Config | Invalid policy rejected on load; version switching by effective date |
| ML | Model loads, scores in valid range, deterministic for fixed input |
| Regression | Frozen set of golden cases with expected outcomes |

Target: meaningful coverage of decision logic (aim high there), rather than chasing a coverage percentage everywhere.

---

## 14. PRD checklist (docs/PRD.md)

- [ ] Problem statement and evidence (wrongly declined customers, slow reviews, inconsistent policy)
- [ ] Personas: applicant, credit analyst, policy owner, ops, risk
- [ ] Goals, non-goals, assumptions
- [ ] Customer journey and where decisioning sits
- [ ] Decision table, precedence, reason codes
- [ ] User stories with acceptance criteria
- [ ] Functional and non-functional requirements (latency, availability, auditability)
- [ ] Success metrics and guardrails
- [ ] Rollout approach (shadow mode, then limited rollout, then monitoring)
- [ ] Experiment ideas (for example score-cutoff change, retry policy change) with hypothesis and success measure
- [ ] Trade-offs: conversion vs risk, automation vs manual review, strictness vs customer experience
- [ ] Risks, limitations, production-readiness gaps
- [ ] Open questions

### Trade-off notes to write (one paragraph each)
1. Why a timeout is Pending/Refer, not Reject
2. Why hard stops precede the model
3. Why rules and scorecard are separate components
4. Why borderline FOIR is Refer instead of Reject
5. Why thresholds are versioned config
6. Why class weights over SMOTE (or the reverse, based on your measured comparison)
7. What you would change before going to production

---

## 15. Production-readiness gaps (document honestly)

- Real bureau, KYC and income integrations, with consent and data-protection handling
- Authentication, authorisation and role-based access
- Regulatory review of credit policy, adverse-action messaging, and data retention
- Model monitoring for drift and performance decay; periodic revalidation
- Policy change approval workflow (maker-checker)
- Scalability, observability, alerting, disaster recovery
- Broader fairness analysis with proper legal and domain review

---

## 16. Optional polish (only if core is done)

1. **Dashboard:** outcome mix, referral reasons, TAT p50/p95, daily applications, fairness guardrail.
2. **Funnel analysis:** short notebook on a public dataset with stage-wise drop-off, clearly labelled as separate analysis.
3. **Simple UI:** application form and status page.

Add them in that order. Skip anything that threatens a clean README and demo.

---

## 17. Definition of done

- [ ] Every decision-table row has a passing automated test
- [ ] Bureau/KYC/income failure never produces REJECT
- [ ] All decisions stored with policy version, model version, reason codes, TAT
- [ ] Audit trail is append-only and retrievable
- [ ] Model evaluation reproducible from a script; metrics come from saved outputs
- [ ] PRD, user stories, trade-offs, model card, fairness report, limitations all committed
- [ ] README includes architecture diagram, quickstart, demo steps and "prototype / synthetic data" disclaimer
- [ ] `docker compose up` runs the stack
- [ ] Demo video recorded
- [ ] Resume bullets contain only implemented features and measured numbers

---

## 18. Resume bullets (fill in after building)

**Loan Eligibility & Decisioning Engine (Prototype)** | Python, FastAPI, PostgreSQL, scikit-learn

- Designed and built a configurable loan decisioning prototype with versioned credit-policy rules (hard stops, soft rules) and mock bureau, KYC and income integrations with timeout and retry fallbacks.
- Integrated a logistic regression scorecard (ROC-AUC `[measured]`, recall `[measured]` on a held-out test set) alongside policy rules, returning explainable Approve / Reject / Refer outcomes with reason codes and an append-only audit trail.
- Authored a PRD with `[N]` user stories, a decision table and trade-off analysis; documented REST APIs via OpenAPI; ran fairness checks and defined product metrics (referral rate, decision TAT, manual-review rate).

Replace every `[measured]` placeholder with a real number or remove the clause.

---

## 19. Interview preparation

Prepare 60 to 90 second answers to these:

1. Why did a bureau timeout not cause a rejection?
2. How does a policy change get introduced safely and traced later?
3. How would you explain a decline to an applicant without exposing policy internals?
4. How do you balance conversion against credit risk? Which lever would you adjust first and why?
5. Why separate the rules engine from the scorecard?
6. What does your referral rate tell you, and what would worry you if it were too high or too low?
7. How would you A/B test a change in the score cutoff responsibly?
8. What fairness checks did you run, and what could you not check?
9. What would you need before this could go to production?
10. If you had two more weeks, what would you build next and why?

Also be ready to walk through the PRD, the decision table, and one failure-injection demo live.

---

## 20. Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Scope creep (UI, dashboard, extra models) | High | Core-first rule; optional items only after Definition of Done |
| Time overrun on ML tuning | Medium | Cap at baseline + one improvement; document and move on |
| Over-claiming results | Medium | Metrics only from saved evaluation outputs |
| Weak PRD because coding dominates | Medium | Write PRD in Week 1; review in Week 4 |
| Environment issues (Docker, DB) | Low | Set up in Week 1; keep a Makefile and README quickstart |
| Dataset licence or privacy concerns | Low | Public datasets only; record licence; synthetic applicants |

---

## 21. Weekly rituals (lightweight Agile)

- **Start of week:** pick backlog items, define the week's exit criteria
- **Mid-week:** 15-minute self-review against the plan; cut scope if behind
- **End of week:** demo to yourself or a friend, update docs, commit with a changelog note
- Keep a simple board (GitHub Projects or Trello) with Backlog / In progress / Done, so you can truthfully say you ran it in sprints.

---

## 22. Next actions (today)

1. Create the GitHub repo and add this `PLAN.md`
2. Write the problem statement and personas (30 minutes)
3. Draft the decision table in `docs/decision_table.md`
4. Pick and download the public credit dataset; record source and licence
5. Set up Docker Compose with FastAPI and PostgreSQL
