# Functional Specification: Questionnaire Builder

## 1. Overview
Questionnaire Builder is a Next.js App Router application that lets administrators organize surveys into projects, build and share questionnaires, collect responses, and review analytics. Data is stored in Supabase tables for projects, questionnaires (with embedded questions/settings JSON), and responses.

## 2. User Roles
- **Administrator (Builder)**: Creates and edits projects and questionnaires, configures settings, reviews analytics/usage.
- **Respondent (User)**: Accesses public survey links, completes questionnaires (with optional passcode protection).

## 3. Functional Modules

### 3.1 Projects Dashboard
- Shows all projects as cards with name, description, questionnaire count, question count, total responses, and “This month” response badge.
- **Create Project** modal collects name (required) and description (optional); redirects into the new project.
- Card actions:
  - `Questionnaires` → project workspace (`/project/:id`)
  - `Usage` → project usage analytics (`/usage/:id`)

### 3.2 Project Workspace
- Inline edit for project name/description (auto-save on blur).
-.lists project questionnaires with question count, response count, status, and created/updated dates.
- Actions per questionnaire: View form (`/survey/:id`), Stats (`/stats/:id`), Edit (`/builder/:id`).
- `+ New Questionnaire` starts `/builder/new?projectId=:id`.

### 3.3 Questionnaire Builder
- Entry: `/builder/new` (or with `projectId`), and `/builder/:id` for editing.
- Loads existing questionnaire from Supabase or seeds a new draft with generated ID.
- **Question types**: text, number, date, boolean (yes/no), single-select, multi-select.
- **Question editing**: title, type, required toggle, options textarea (one option per line) for select types.
- **Visibility / logic rules**: per-question rules referencing earlier questions with operators `equals`, `not_equals`, `contains`; remove/reset available.
- **Drag & Drop**: reorder questions via drag handle (dnd-kit).
- **Share & integration panel** (toggle in sticky header):
  - Public URL uses `?hideNav=true` for embeddable view.
  - Optional toggle to embed passcode in URL/QR when a passcode exists.
  - Copyable public link, iframe embed snippet, and QR code preview.
- **Save & Publish**: persists questionnaire (questions + settings) to Supabase; new drafts redirect to their edit URL.

### 3.4 Settings (`/settings/:id`)
- **Questions per page**: default 5; set to `0` to show all on one page.
- **Webhook URL**: stored for future POST on submission (not currently invoked in code).
- **Access passcode**: optional; required for survey access when set.
- Saves back to questionnaire settings in Supabase.

### 3.5 Survey Viewer (`/survey/:id`)
- Enforces passcode when configured (query `?pass=` or in-form entry); blocks form until valid.
- Honors `hideNav=true` to hide global nav.
- Pagination driven by `questionsPerPage` (default 5; `0` = single page).
- Applies visibility rules before pagination to hide inapplicable questions.
- Renders inputs per question type, including boolean chips and multi-select checkboxes.
- Validation for required questions with inline error messaging; prevents Next/Submit until valid.
- Navigation: Next/Back (when paginated); Submit posts response to Supabase and shows “Thank you” confirmation.

### 3.6 Analytics & Reporting
- **Stats page** (`/stats/:id`): total response count plus per-question breakdown; option/multi-option distributions with percentages/bars; text answers listed (first 10) for non-select types.
- **Responses report** (`/report/:id`): tabular view of each submission (timestamp + answers per question), supports empty-state when no responses.

### 3.7 Usage & Billing Analytics
- **Global usage** (`/usage`):
  - Overall totals: projects, questionnaires, questions, responses.
  - This-month cards: new questionnaires, new responses.
  - Monthly response trend for last 6 months (bar visualization).
  - Per-project table: this-month responses badge and total responses with links to project workspace.
- **Per-project usage** (`/usage/:id`):
  - Totals for questionnaires, questions, responses.
  - This-month new questionnaires/responses.
  - 6-month response trend.
  - Per-questionnaire table with question counts and response totals; links to stats pages.

## 4. Data & Technical Specifications
- **Framework**: Next.js 14+ (App Router), TypeScript, client components for interactive flows.
- **Storage**: Supabase (`projects`, `questionnaires`, `responses` tables); questionnaire questions/settings stored as JSON.
- **State**: React hooks (`useState`, `useEffect`) with client-side Supabase server actions for CRUD and cache revalidation.
- **Styling**: Global CSS with utility classes (`btn`, `card`, etc.).
- **Dependencies**: `@supabase/supabase-js`, `qrcode.react` (QR generation), `@dnd-kit/*` (drag/drop).
- **Navigation**: Sticky top nav hidden when `hideNav` query param is present.
- **Environment**: Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 5. Recent Updates Log
- **2025-12-11**
  - Added project layer with dashboard cards, project workspace, and project-level usage analytics.
  - Implemented Supabase-backed storage for projects, questionnaires, and responses.
  - Introduced usage analytics (global and per-project) with monthly trends and per-entity tables.
  - Upgraded builder: drag-and-drop ordering, share/integration panel (link/QR/embed, passcode toggle), boolean question type, and visibility rules UI.
- **2025-12-10**
  - Passcode gating for surveys; QR code sharing; passcode include toggle in share links.
  - Default pagination (5/page), basic validation for required fields, and settings for pagination/webhook/passcode.
  - SVG icon set for view/stats/share/delete and timestamp display on dashboard cards.

---
*Update this document whenever functionality changes or new modules are added.*
