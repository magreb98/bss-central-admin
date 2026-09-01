# BSS Central Admin

Build a superadmin control panel for BSS POS, a multi-tenant SaaS point-of-sale platform for Central Africa (Cameroon). The panel is used by platform operators ("landlord admins") to manage client companies (tenants), monitor provisioning, and view platform-wide statistics.

---

## Tech Stack

- React 18 + Vite

- Tailwind CSS + shadcn/ui components throughout

- TanStack Query v5 (react-query) for all server state

- Axios instance with Bearer token interceptor (Authorization: Bearer <token>)

- React Router v6

- react-hook-form + zod for all forms

- Recharts for charts

- All UI labels, messages, placeholders in French; all code (variables, functions, files) in English

---

## Authentication

Base URL: import.meta.env.VITE_API_URL (default http://localhost:8000)

Login:

  POST /admin/login

  Body: { email: string, password: string }

  Response 200: { token: string, user: { id: string, name: string, email: string } }

  Response 401: { message: string }

Store the token in localStorage under the key "bss_admin_token".

Every request must include: Authorization: Bearer <token> and Accept: application/json.

Current user (sidebar):

  GET /admin/me → { data: { id: string, name: string, email: string } }

  Call on app mount (inside ProtectedRoute). Store in a React context or TanStack Query.

  The sidebar bottom section displays this user's name and email.

Logout:

  POST /admin/logout → 200

Build a ProtectedRoute component: unauthenticated users are redirected to /login.

On 401 from any API call: clear the token and redirect to /login.

---

## Data Models

```typescript

interface Tenant {

  id: string;

  name: string;

  status: 'actif' | 'suspendu' | 'provisionning';

  provisioning_step: 0 | 1 | 2 | 3 | 4 | 5;

  provisioning_error: string | null;

  domains: Domain[];

  created_at: string; // ISO 8601

}

interface Domain {

  id: string;

  domain: string;

  tenant_id: string;

  created_at: string;

}

interface PlatformStats {

  total_tenants:           number;

  active_tenants:          number;

  tenants_in_provisioning: number;

  suspended_tenants:       number;

  new_this_month:          number;

  total_revenue_xaf:       number;  // bigint → integer JS

  total_sales:             number;

  period: { from: string; to: string };

}

interface TenantMetrics {

  tenant_id:           string;

  total_including_tax: number;   // XAF integer

  sale_count:          number;

  average_basket:      number;   // XAF integer

  active_users:        number;

  last_activity_date:  string | null;

  period: { from: string; to: string };

}

interface AdminUser {

  id:                string;   // UUID

  name:              string;

  email:             string;

  active:            boolean;

  last_connected_at: string | null;

  created_at:        string;

}

interface TenantUser {

  id:                string;

  first_name:        string;

  last_name:         string;

  phone:             string;

  email:             string;

  active:            boolean;

  last_connected_at: string | null;

  created_at:        string;

}

interface AuditLog {

  tenant_id:   string;

  tenant_name: string;

  tool:        string;        // e.g. "get_products"

  input:       object | null;

  output:      object | null;

  called_at:   string;        // ISO 8601

}

```

Provisioning step meanings:

- 0 = Non démarré

- 1 = Base de données créée

- 2 = Migrations appliquées

- 3 = Données de référence chargées

- 4 = Administrateur créé (tenant is ready to use)

- 5 = Abonnement activé

---

## App Layout

Persistent sidebar (fixed left, 240px wide):

- Background: #0f172a (slate-900)

- Header: "BSS POS" text (bold, white) + small "Admin" pill in orange

- Navigation links with Lucide icons:

  • Tableau de bord → / (icon: LayoutDashboard)

  • Entreprises → /tenants (icon: Building2)

  • Administrateurs → /admin-users (icon: Users)

  • Journaux d'audit → /audit-logs (icon: ClipboardList)

- Bottom: current user name + email + "Se déconnecter" button (ghost variant)

- Active link: orange-500/20 background with orange-500 text

- Hover: slate-800 background

Main content area: #f8fafc background, px-8 py-6 padding, takes remaining width.

---

## Page: /login

Centered vertically and horizontally (100vh).

White card (max-w-sm, shadow-lg, rounded-2xl, p-8).

"BSS POS" logo text at top (bold, slate-900, centered).

Below: "Espace administration" subtitle in slate-500.

Form:

  - Email field (label: "Adresse e-mail", type: email)

  - Password field (label: "Mot de passe", type: password)

  - Submit button: "Se connecter" (orange-500, full width, shows spinner when loading)

Error: red alert banner below the form on 401: "Identifiants invalides. Veuillez réessayer."

On success: navigate to /.

---

## Page: / (Dashboard)

On mount, fetch in parallel:

  GET /admin/stats?from={today-30days}&to={today}

  → { data: PlatformStats }

  GET /admin/tenants?sort=created_at&order=desc&per_page=5

  → { data: Tenant[], meta: { ... } }

  GET /admin/stats/daily?from={today-30days}&to={today}

  → { data: Array<{ date: string, sale_count: number, total_including_tax: number }> }

Page title: "Tableau de bord"

Top row: 4 KPI stat cards (grid-cols-4):

  1. Entreprises actives — active_tenants — icon Building2 in green

  2. Ce mois — new_this_month (from PlatformStats, NOT computed client-side) — icon TrendingUp in blue

  3. CA global — total_revenue_xaf (formatted as XAF) — icon CircleDollarSign in orange

  4. Ventes totales — total_sales — icon ShoppingCart in slate

Below KPIs: two-column grid (40% / 60%):

  Left card "Dernières entreprises": table of 5 most recent tenants with name, status badge, created_at date.

  Right card "Activité (30 derniers jours)": BarChart (Recharts) with date on X axis (format dd/MM) and sale_count on Y axis. Bar fill: #f97316. Responsive container.

---

## Page: /tenants (Tenant List)

Page title: "Entreprises"

Toolbar (flex, space-between):

  Left: search input ("Rechercher une entreprise...", debounced 300ms, updates URL param ?search=)

  Left: status filter Select ("Tous les statuts" / "Actif" / "Suspendu" / "En provisionnement")

  Left: sort Select ("Trier par : Date de création" / "Nom" / "Statut" / "Progression") — maps to ?sort=created_at|name|status|provisioning_step

  Left: order toggle button (↑ asc / ↓ desc) — maps to ?order=asc|desc, default desc

  Right: "Nouvelle entreprise" Button (orange, icon Plus) — opens NewTenantDialog

Fetch: GET /admin/tenants?search=&status=&sort=created_at&order=desc&page=1&per_page=15

Response: { data: Tenant[], meta: { total, current_page, per_page, last_page } }

Data table columns:

  - Entreprise: company name (font-medium) + primary domain in a small chip below

  - Statut: Badge — Actif (green), Suspendu (red), En provisionnement (amber)

  - Progression: provisioning_step / 5 shown as a thin progress bar + label "4/5"

  - Domaine: first domain or "—"

  - Créé le: formatted dd/MM/yyyy

  - Actions: three icon buttons — Eye (navigate to /tenants/:id) + toggle suspend/reactivate + Archive (Trash icon, opens confirm modal)

Suspend action: PATCH /admin/tenants/:id with body { status: 'suspendu' } or { status: 'actif' }

On success: invalidate tenant list query, show toast "Statut mis à jour."

Archive action: DELETE /admin/tenants/:id → 204

Confirm modal: "Archiver [name] ? Cette entreprise ne sera plus accessible. L'action est réversible manuellement."

On success: invalidate tenant list query, show toast "Entreprise archivée."

Pagination controls below the table.

---

## Page: /tenants/:id (Tenant Detail)

Fetch: GET /admin/tenants/:id → { data: Tenant }

Back link "← Entreprises" at top.

Page title: tenant.name

Two-column layout (w-1/3 / w-2/3), gap-6:

LEFT PANEL (sticky, top-24):

  Card:

    Company name (h2) + status badge

    "Créé le" date

    Section "Provisionnement":

    Vertical stepper with 6 steps. For each step index i (0-5):

      - i < provisioning_step: completed (filled orange circle + checkmark + label in text)

      - i === provisioning_step and provisioning_error: failed (red circle + X + label in red)

      - i === provisioning_step: current (orange ring + label in orange)

      - i > provisioning_step: upcoming (grey circle + label in muted)

    Step labels: ["Initialisé", "Base de données créée", "Migrations appliquées", "Données de référence chargées", "Administrateur créé", "Abonnement activé"]

    If provisioning_error !== null: red alert box with error message text + "Relancer le provisionnement" Button.

    POST /admin/tenants/:id/reprovision → 200: { data: Tenant }

    On success: invalidate tenant query, show toast "Provisionnement relancé."

    Separator

    Action button (full width):

      If status === 'actif': Button variant destructive "Suspendre ce compte"

      If status === 'suspendu': Button "Réactiver ce compte"

    PATCH /admin/tenants/:id body { status: ... }

RIGHT PANEL:

  Card "Statistiques":

    DateRangePicker (two date inputs: "Du" and "Au", default last 30 days).

    On date change: fetch GET /admin/tenants/:id/metrics?from=YYYY-MM-DD&to=YYYY-MM-DD

    Response: { data: TenantMetrics }

    Show four stat mini-cards: "CA période" (total_including_tax, XAF) · "Ventes" (sale_count) · "Panier moyen" (average_basket, XAF) · "Utilisateurs actifs" (active_users).

    Below: "Dernière activité" date (last_activity_date, or "—").

  Card "Utilisateurs":

    Fetch GET /admin/tenants/:id/users → { data: TenantUser[] }

    Table with columns: Nom complet (first_name + last_name) · Téléphone · Email · Statut (badge Actif/Inactif) · Dernière connexion (relative, e.g. "il y a 2 jours" ou "Jamais").

    If empty: placeholder "Aucun utilisateur trouvé."

    Read-only list (no create/edit from this panel — managed inside the tenant app).

  Card "Domaines":

    List each domain: domain string (monospace) + trash icon Button.

    DELETE /admin/tenants/:id/domains/:domainId → 204

    On success: invalidate tenant query, show toast "Domaine supprimé."

    "Ajouter un domaine" form (inline, flex row):

      Input (placeholder: "acme.bsspos.cm") + "Ajouter" Button

    POST /admin/tenants/:id/domains

    Body: { domain: string }

    Response 201: { data: Domain }

    Client validation: must match /^[a-z0-9][a-z0-9\-\.]+\.[a-z]{2,}$/

    On success: invalidate tenant query, clear input, show toast "Domaine ajouté."

---

## Dialog: NewTenantDialog (2-step wizard)

shadcn Dialog, opened from /tenants toolbar.

Title: "Nouvelle entreprise"

Step 1 of 2 — "Informations de l'entreprise":

  - "Nom de l'entreprise" input (required)

  - "Domaine principal" input (required), help text below: "Ex: monentreprise.bsspos.cm"

  Footer: "Annuler" Button (variant ghost) + "Suivant →" Button (orange)

  "Suivant" validates step 1 fields before advancing.

Step 2 of 2 — "Administrateur initial":

  - "Prénom" input (required)

  - "Nom de famille" input (required)

  - "Téléphone" input (required, placeholder: +237 6XX XXX XXX)

  - "Mot de passe temporaire" input (required, minLength: 8, show/hide toggle with Eye icon)

  Footer: "← Retour" Button (variant outline) + "Provisionner" Button (orange, shows spinner when loading)

On submit:

  POST /admin/tenants

  Body: { name: string, domain: string, initial_admin: { first_name, last_name, phone, password } }

  Response 201: { data: Tenant }

On success: close dialog, toast "Entreprise créée. Le provisionnement est lancé en arrière-plan.", navigate to /tenants/:id.

On 422: show field-level errors from response.data.errors using setError from react-hook-form.

---

## Page: /admin-users (Superadmin Users)

Page title: "Administrateurs"

Toolbar:

  Right: "Ajouter un administrateur" Button (orange, icon UserPlus) — opens AddAdminDialog.

Fetch: GET /admin/admin-users → { data: AdminUser[] }

Table columns:

  - Nom (font-medium)

  - Email (monospace, muted)

  - Statut: Badge — Actif (green) / Inactif (red)

  - Dernière connexion: formatted relative date or "Jamais"

  - Actions: icon buttons — Edit (opens EditAdminDialog) + Trash (opens confirm modal)

AddAdminDialog:

  Fields: Nom (required) · Adresse e-mail (required, email) · Mot de passe (required, min 8, show/hide)

  POST /admin/admin-users

  Body: { name: string, email: string, password: string }

  Response 201: { data: AdminUser }

  On success: invalidate list, close dialog, toast "Administrateur créé."

  On 422 DUPLICATE_EMAIL: display "Cette adresse e-mail est déjà utilisée."

EditAdminDialog:

  Prefill with selected user's name and email.

  Fields: Nom · Adresse e-mail · Actif (Switch toggle) · Nouveau mot de passe (optional, min 8)

  PATCH /admin/admin-users/:id

  Body: { name?, email?, active?, password? } (only changed fields)

  Response 200: { data: AdminUser }

  On success: invalidate list, close dialog, toast "Administrateur mis à jour."

Delete confirm modal:

  "Supprimer l'administrateur [name] ?" — body text: "Tous ses tokens d'accès seront révoqués immédiatement."

  DELETE /admin/admin-users/:id → 204

  On success: invalidate list, close modal, toast "Administrateur supprimé."

  Guard: if the current logged-in user's id === target id, show warning "Vous ne pouvez pas supprimer votre propre compte."

---

## Page: /audit-logs (MCP Audit Logs)

Page title: "Journaux d'audit MCP"

Toolbar (flex, space-between):

  Left:

    - Select "Entreprise" (all active tenants, or "Toutes les entreprises") — populates from GET /admin/tenants?status=actif&per_page=100

    - Input "Outil MCP" (placeholder: "Filtrer par outil…")

    - DatePicker "Du" + DatePicker "Au" (default last 7 days)

  Right: "Exporter CSV" button (secondary, disabled — placeholder for future)

Fetch: GET /admin/audit-logs?tenant_id=&tool=&from=YYYY-MM-DD&to=YYYY-MM-DD&page=N&per_page=25

Response: { data: AuditLog[], meta: { total, current_page, per_page, last_page } }

AuditLog interface:

  tenant_id:   string

  tenant_name: string

  tool:        string       // e.g. "get_products"

  input:       object | null

  output:      object | null

  called_at:   string       // ISO 8601

Table columns:

  - Entreprise: tenant_name (badge-style chip)

  - Outil: tool name in monospace code chip

  - Appelé le: full datetime (dd/MM/yyyy HH:mm:ss)

  - Détails: "Voir" icon button — expands an accordion row below showing raw JSON of input and output (collapsible, max-h-64 overflow-y-auto)

Pagination controls below table.

If no results: placeholder "Aucun journal trouvé pour les filtres sélectionnés."

---

## Design System

Fonts (load from Google Fonts): 'IBM Plex Sans' (400, 500, 600, 700) for all text.

Colors:

  Sidebar:        #0f172a background, #e2e8f0 text, #94a3b8 muted

  Page bg:        #f8fafc

  Card bg:        #ffffff, shadow-sm, border #e2e8f0, rounded-xl

  Primary accent: #f97316 (orange-500)

  Status Actif:   #22c55e (green-500)

  Status Suspendu:#ef4444 (red-500)

  Status Provis.: #f59e0b (amber-500)

  Text primary:   #0f172a

  Text secondary: #64748b

Shadcn components to use: Button, Input, Badge, Card, Table, Dialog, Select, Separator, Progress, Alert, Sonner (toasts).

---

## Error Handling

- HTTP 401: clear "bss_admin_token" from localStorage, navigate to /login

- HTTP 422: map response.data.errors to form fields via react-hook-form setError

- HTTP 500: Sonner toast "Une erreur serveur est survenue. Veuillez réessayer."

- Network error: Sonner toast "Impossible de joindre le serveur."

---

## Currency Formatting

All monetary amounts are integers in XAF (no decimal places). Format function:

const formatXAF = (n: number) =>

  new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

Example: 1500000 → "1 500 000 XAF"

---

## Environment

VITE_API_URL=http://localhost:8000

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0443757d-3641-4a6d-b769-e87514c3cd76).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
