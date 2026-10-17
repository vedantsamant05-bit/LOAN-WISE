# LoanWise — Design System

> **Product:** LoanWise  
> **Product type:** Rule-based loan eligibility and decisioning prototype  
> **Design direction:** Premium, minimalist fintech inspired by Monetary Work  
> **Status:** Design specification for implementation  
> **Important:** Use synthetic/demo data only. Do not imply this prototype makes real credit decisions.

---

## 1. Product experience principles

1. **Clarity before decoration.** Credit decisions, reasons, statuses, and next steps must be immediately understandable.
2. **Trust through restraint.** Use a quiet palette, strong alignment, generous whitespace, and subtle depth rather than flashy effects.
3. **Explainability by default.** Every decision should expose the policy checks, verification statuses, reason codes, and relevant model information.
4. **Product-quality interactions.** Forms, filters, navigation, policy editing, and retry actions must work—not merely look interactive.
5. **Responsible presentation.** Distinguish a policy result from an ML risk estimate. API failure must never be represented as an automatic rejection.
6. **Progressive complexity.** Keep the overview approachable; place detailed policy, model, and audit information on their dedicated pages.
7. **Performance and accessibility.** Visual polish must not compromise readability, keyboard use, responsiveness, or loading speed.

## 2. Visual identity

### Brand personality
- Calm, precise, modern, credible, and analytical.
- Enterprise fintech, not a consumer crypto product.
- Minimalist layouts with editorial typography and a small number of distinctive details.

### Colour tokens

Use these as the initial palette. If a Monetary Work screenshot or URL is later supplied, tune the tokens to match that reference more closely.

| Token | Hex | Intended use |
|---|---|---|
| `color-forest-950` | `#14251E` | Primary dark surfaces, sidebar, high-emphasis text |
| `color-forest-900` | `#1B3328` | Primary brand colour |
| `color-forest-800` | `#254737` | Hover and active emphasis |
| `color-sage-700` | `#587663` | Secondary brand accent |
| `color-sage-500` | `#8DA894` | Charts and secondary accents |
| `color-sage-200` | `#DCE7DD` | Selected surfaces and soft highlights |
| `color-sage-100` | `#EDF3EC` | Soft green card backgrounds |
| `color-ivory-50` | `#FAF9F5` | Main application background |
| `color-ivory-100` | `#F3F1E9` | Secondary background |
| `color-white` | `#FFFFFF` | Cards, dialogs, form surfaces |
| `color-ink-900` | `#202722` | Main text |
| `color-ink-700` | `#4E5851` | Secondary text |
| `color-ink-500` | `#737D75` | Muted labels and metadata |
| `color-border` | `#E4E7E1` | Borders, separators, table lines |
| `color-success` | `#2F6B4F` | Approved / passed states |
| `color-success-bg` | `#E8F2EA` | Approved badge background |
| `color-warning` | `#94651D` | Refer / manual review |
| `color-warning-bg` | `#F8F0DF` | Warning badge background |
| `color-danger` | `#A13D3D` | Rejected / failed checks |
| `color-danger-bg` | `#F8EAEA` | Rejection badge background |
| `color-neutral` | `#5E675F` | Pending / neutral status |
| `color-neutral-bg` | `#EEF0EC` | Pending badge background |

### Colour usage rules
- Use forest green for primary actions, selected navigation, and key brand moments.
- Use ivory for the page canvas and white for most content cards.
- Use sage for secondary emphasis, selected states, and chart series.
- Reserve semantic colours for actual statuses. Never communicate status using colour alone; pair colour with a text label and, where useful, an icon.
- Avoid bright neon green, electric blue gradients, saturated multi-colour charts, and low-contrast grey text.
- Keep chart palettes limited and consistent.

## 3. Typography

- **Preferred font:** Inter or Geist Sans.
- **Fallback:** system sans-serif.
- Use tabular numerals for money, counts, percentages, and timestamps.
- Prefer sentence case; avoid excessive uppercase headings.
- Use uppercase only for compact environment labels such as `DEMO` and small table metadata.

| Style | Size | Weight | Usage |
|---|---:|---:|---|
| Display | 32–36 px | 600 | Login/marketing heading only |
| Page title | 24–28 px | 600 | Main page heading |
| Section title | 16–18 px | 600 | Cards and page sections |
| Body | 14–16 px | 400 | Standard content |
| Table/body compact | 13–14 px | 400–500 | Dense data tables |
| Label | 12–13 px | 500 | Form labels and metadata |
| Caption | 11–12 px | 400 | Supporting details |

Use a clear hierarchy and comfortable line height. Do not make dashboard headings excessively large.

## 4. Layout, spacing, and shape

### Grid and shell
- Desktop-first enterprise application.
- Sidebar: approximately 232–256 px expanded; collapsible on smaller screens.
- Top bar: approximately 64–72 px high.
- Main content max width: 1440 px, with responsive side padding.
- Use a 12-column grid for complex desktop layouts and collapse to fewer columns on tablet/mobile.

### Spacing
Use an 8 px base scale:
- `space-1`: 4 px
- `space-2`: 8 px
- `space-3`: 12 px
- `space-4`: 16 px
- `space-5`: 24 px
- `space-6`: 32 px
- `space-7`: 40 px
- `space-8`: 48 px
- `space-9`: 64 px

### Shape and depth
- Standard card radius: 12 px.
- Input and button radius: 8–10 px.
- Pill radius only for compact status badges.
- Use 1 px borders and subtle shadows; avoid heavy elevation.
- Avoid putting every section inside a separate card. Use spacing and dividers to create hierarchy.

## 5. 3D and decorative background

Use 3D as a restrained brand detail, not as the primary interface.

### Recommended placement
- Login / welcome screen: one abstract 3D composition.
- Overview page: optional small decorative shape in the welcome area, behind content and never behind charts or text.
- Do not add decorative 3D objects to every card or data table.

### Visual treatment
- Matte forest-green sphere or torus.
- Translucent sage or frosted-glass geometric form.
- Soft ambient shadows and a gentle ivory-to-sage radial glow.
- Limited depth of field; avoid excessive reflections or metallic effects.
- No distracting particle systems or continuous spinning animations.

### Implementation
- Prefer CSS radial gradients, pseudo-elements, and layered shapes for lightweight effects.
- Use Three.js / React Three Fiber only if it adds a clear benefit.
- Keep the scene small, lazy-load it, and provide a static fallback.
- Respect `prefers-reduced-motion`; no motion should be required to understand the page.
- Ensure decorative elements are `aria-hidden` and do not intercept pointer events.

## 6. Application shell and navigation

### Sidebar
Brand block:
- Wordmark: `LoanWise`
- Descriptor: `Lending Intelligence`
- Minimal geometric decision-tree icon.

Navigation order:
1. Overview
2. Applications
3. Decision Engine
4. Credit Policy
5. Risk Scorecard
6. Analytics
7. Audit Trail
8. Settings

Sidebar behavior:
- Active item uses a pale sage background and forest-green text/icon.
- Hover state is subtle and consistent.
- Use one icon family (Lucide or equivalent line icons).
- Collapse to an icon rail on desktop when requested; use a drawer on mobile.

### Top bar
- Breadcrumbs and page context.
- Search where relevant.
- `DEMO` environment indicator.
- Notifications, if functional.
- User avatar and menu.
- Avoid adding controls that have no working action.

## 7. Components and interaction states

### Buttons
- Primary: forest-green fill, white text.
- Secondary: white/ivory fill, neutral border.
- Tertiary: text button.
- Destructive: muted red, reserved for destructive actions.
- Include hover, focus-visible, disabled, and loading states.
- Use concise, action-oriented labels.

### Cards
- White surface on ivory canvas.
- 1 px border in `color-border`.
- 12 px radius.
- Minimal shadow only when separation is needed.
- Consistent internal padding, typically 20–24 px.

### Forms
- Labels above fields.
- Inline helper text for thresholds and formats.
- Show validation near the affected field.
- Do not rely on placeholder text as the only label.
- Preserve entered data when validation fails.
- Clearly distinguish required and optional fields.

### Tables
- Left-align text; right-align monetary and numeric columns.
- Use tabular numerals.
- Keep row height comfortable, approximately 48–56 px.
- Use subtle separators, clear column headings, and restrained row hover.
- Provide search, filters, pagination, and empty states when relevant.
- On narrow screens, allow horizontal scrolling or switch to stacked record cards.

### Status badges
- Approved: green + “Approved”.
- Rejected: red + “Rejected”.
- Refer: amber + “Refer for review”.
- Pending: neutral + “Pending verification”.
- Always include text; do not communicate the status through colour alone.

### Feedback states
Every data-driven page should support:
- Loading skeleton.
- Empty state with a useful next action.
- Error state with a retry action where appropriate.
- Success confirmation.
- Disabled and permission-limited controls.
- Clear API timeout and retry states.

## 8. Product screens

### 8.1 Overview
Page heading: **“Lending overview”**  
Supporting text: “Monitor application decisions, policy performance, and risk signals.”

Include:
- `DEMO DATA` label.
- Date-range filter if supported.
- “New application” primary action.
- KPI cards: Total Applications, Approval Rate, Manual Review Rate, Average Decision Time.
- Application volume trend.
- Decision distribution.
- Decision turnaround trend.
- Top referral/rejection reasons.
- Recent applications table.

Only display metrics supported by the available dataset. Clearly identify illustrative values. Avoid presenting invented metrics as real outcomes.

### 8.2 Applications
- Search by application ID or fictional applicant name.
- Filter by status, date, and decision reason.
- Table columns: Application ID, Applicant, Requested Amount, Risk Score, Decision, Submitted At, Actions.
- Clicking a row opens an application detail page.
- Use synthetic identities and fictional IDs only.

### 8.3 New application
Use a multi-step workflow:
1. Applicant details.
2. Financial information.
3. Verification status.
4. Review and submit.

Fields may include age, employment type, monthly income, requested amount, tenure, and existing monthly obligations. Calculate FOIR consistently from the supplied values and clearly show the formula or explanation in helper text.

Show verification-service states for mock bureau, KYC, and income services. Handle unavailable services with a pending/retry path, not an automatic rejection.

### 8.4 Decision result
Make this the most explainable and polished workflow screen.

Display:
- Decision status.
- Application reference.
- Requested amount.
- Policy version and decision timestamp.
- Separate policy evaluation, verification, and ML assessment sections.
- Rule name, actual value, threshold, outcome, and severity.
- Human-readable reason codes.
- Audit trail link.
- Retry verification or send for manual review where permitted.

Distinguish a credit-bureau score from the model's predicted probability. Do not label them as the same metric. Show only fields the backend actually provides.

### 8.5 Decision Engine
Show the decision pipeline:

`Application → Verification → Hard-stop rules → Soft rules → ML scorecard → Final decision → Audit record`

Include stage-level status, service health, latency, policy version, and model version when available. Add a sample-application rule tester if it can be wired to the actual rules engine.

### 8.6 Credit Policy
Show a rules table with:
- Rule name and description.
- Operator and threshold.
- Severity: hard-stop or soft rule.
- Effective date.
- Enabled/disabled status.
- Last updated.

Support adding/editing rules, previewing a change, comparing policy versions, and confirming publication. Persist changes through the backend when available. Never make a “Save” or “Publish” button appear successful if no change was saved.

### 8.7 Risk Scorecard
Show:
- Model name/version.
- Dataset and split description.
- ROC-AUC, precision, recall, confusion matrix, and class distribution.
- Threshold configuration.
- Model limitations and intended use.
- Feature importance/explanation only if supported.

If measured model metrics are unavailable, show a clear empty state or label sample metrics as illustrative. Never fabricate evaluation results.

### 8.8 Analytics
Focus on:
- Application completion rate.
- Approval, rejection, and referral rates.
- Decision turnaround time.
- Manual-review backlog.
- Verification failure rate.
- Funnel abandonment only when event data exists.

Separate observed results from hypotheses and recommendations. Ensure metric definitions are consistent and documented.

### 8.9 Audit Trail
Use a searchable, filterable table:
- Timestamp.
- Application ID.
- Event type.
- Actor/system component.
- Policy version.
- Model version.
- Decision/status change.
- Reason code.

Treat audit history as append-only in the product design. Represent changes as new events rather than silently overwriting history.

### 8.10 Settings
Include only useful configuration:
- Profile and preferences.
- Environment/demo information.
- API connectivity status.
- Theme preference only if implemented.
- Access/role information only if backed by real authorization logic.

## 9. Charts and data visualisation

- Use a consistent, restrained palette based on forest green and sage.
- Keep axes and gridlines low contrast but readable.
- Use tooltips for precise values.
- Label chart units and time periods.
- Avoid 3D charts, decorative gauges, and unnecessary gradients.
- Do not infer causation from simple correlations.
- Include accessible legends and text summaries where practical.
- Ensure charts resize correctly and provide a useful empty state when data is unavailable.

## 10. Responsive behavior

### Desktop
- Full sidebar and multi-column dashboard.
- Tables use the available width.
- Keep a consistent content grid.

### Tablet
- Collapsible sidebar.
- Two-column KPI cards where space permits.
- Charts stack when necessary.

### Mobile
- Sidebar becomes a navigation drawer.
- KPI cards stack or use two columns only when readable.
- Tables switch to responsive cards or controlled horizontal scrolling.
- Forms use a single column.
- Dialogs fit the viewport.
- No horizontal page overflow.

## 11. Accessibility and motion

- Meet WCAG AA contrast targets where practical.
- All controls are keyboard accessible.
- Use visible focus rings.
- Use semantic headings and form labels.
- Announce important status changes accessibly.
- Never rely on colour alone for status.
- Honour `prefers-reduced-motion`.
- Keep animations short and purposeful.
- Ensure 3D and decorative visuals are not read by assistive technology.

## 12. Frontend implementation guidance

Preferred stack:
- React + TypeScript.
- Tailwind CSS.
- shadcn/ui or a similarly consistent component library.
- Lucide icons.
- Recharts for charts.
- FastAPI REST backend.
- PostgreSQL for persistent applications, policy versions, decisions, and audit events.

Implementation rules:
- Centralise design tokens; do not scatter raw colours across components.
- Use reusable components for cards, badges, tables, form fields, page headers, dialogs, and empty states.
- Separate API clients, types, UI components, and page layouts.
- Use a typed API layer and explicit loading/error handling.
- Keep demo fixtures separate from production API responses.
- Label demo mode clearly.
- Wire controls to actual behavior and persistence wherever backend endpoints exist.
- If endpoints are not yet available, isolate mock data behind a service layer so it can be replaced later.
- Do not store secrets in frontend code.
- Do not claim authentication, authorization, or real external integrations unless implemented.

## 13. Content and microcopy

Use concise, clear language. Prefer:
- “Review decision”
- “View policy checks”
- “Retry verification”
- “Send for manual review”
- “Policy version”
- “Decision reason”

Avoid:
- Vague AI claims.
- Overly technical error messages shown directly to users.
- Guarantees of approval.
- Language suggesting the model is always correct.
- Real customer information.

Add a small persistent demo disclaimer where appropriate:
**“Prototype environment — synthetic data; not for real lending decisions.”**

## 14. Definition of done

The UI is ready for demonstration when:
- Navigation between the main screens works.
- The application workflow validates inputs.
- A sample application produces a consistent, explainable decision through the configured demo/backend logic.
- Policy checks and reason codes match the decision response.
- API failures have safe, visible retry/manual-review states.
- Tables, filters, and detail views work.
- Policy edits persist when connected to the backend.
- Model metrics are sourced or explicitly marked illustrative.
- Loading, empty, error, and success states are present.
- The layout works at desktop, tablet, and mobile widths.
- The interface remains usable with reduced motion and keyboard navigation.
- Decorative 3D effects are restrained, performant, and never obscure content.

**Overall design goal:** a polished, premium, minimalist fintech risk platform with a forest-green and warm-ivory identity, subtle 3D accents, clear decision explanations, and a strong emphasis on trust, responsible lending, and product usability.
