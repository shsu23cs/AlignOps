# AlignOps 🪬

AlignOps is a premium, user-friendly goal management and progress-tracking portal designed for modern teams. It makes it easy for organizations to create, align, approve, and track employee performance goals—from strategic planning at the beginning of the year to quarterly updates, manager feedback, and corporate reports.

---

## Folder Structure

The AlignOps repository is organized as a monorepo containing the frontend web application, Fastify API backend, Kubernetes infrastructure configurations, and a centralized DevOps control center:

```
alignops/
├── .github/                       # GitHub configurations
│   └── workflows/                 # CI/CD Orchestration and Reusable Pipelines
│       ├── ci.yml                 # Main CI path-filtering orchestrator
│       ├── cd.yml                 # Main CD tag-triggered release orchestrator
│       ├── reusable-backend.yml   # Reusable pipeline for Fastify backend testing
│       ├── reusable-frontend.yml  # Reusable pipeline for Next.js frontend checks
│       ├── reusable-infra.yml     # Reusable pipeline for IaC, K8s, and OPA policy checks
│       └── reusable-publish.yml   # Reusable pipeline for secure Docker publishing
├── backend/                       # Fastify API Server
│   ├── prisma/                    # ORM Schema and Migrations
│   │   ├── schema.prisma          # Database schema definition
│   │   ├── seed.ts                # Database seeding script
│   │   └── migrations/            # SQL migration history
│   ├── src/                       # Backend Source Code
│   │   ├── index.ts               # Server entry point
│   │   ├── jobs/                  # Automated background worker tasks
│   │   ├── lib/                   # Database clients & utility helpers
│   │   ├── modules/               # Domain-specific models (users, goals, cycles)
│   │   └── plugins/               # Fastify framework middleware plugins
│   ├── tests/                     # Vitest Integration and Unit Test suites
│   ├── Dockerfile                 # Hardened Backend container assembly blueprint
│   ├── package.json               # Backend script definitions & dependencies
│   └── tsconfig.json              # TypeScript compilation rules
├── frontend/                      # Next.js 14 App Router Client Portal
│   ├── app/                       # Application Pages & View Layer
│   │   ├── admin/                 # Admin & HR Workspace views
│   │   ├── employee/              # Employee dashboard views
│   │   ├── manager/               # Manager team review views
│   │   ├── login/                 # SSO & credential login gateway
│   │   ├── layout.tsx             # Root page wrappers and fonts
│   │   └── globals.css            # Global CSS styling system
│   ├── components/                # Reusable visual components (dials, tables, modals)
│   ├── lib/                       # API client and local helper utilities
│   ├── public/                    # Static asset storage
│   ├── Dockerfile                 # Hardened Frontend container assembly blueprint
│   ├── package.json               # Frontend script definitions & dependencies
│   └── next.config.ts             # Next.js engine runtime settings
├── devops/                        # Dedicated DevOps Workspace (Central Operations Suite)
│   ├── README.md                  # DevOps Master Architecture Handbook
│   ├── scripts/                   # System automation, hardening & recovery scripts
│   │   ├── db-backup.sh           # Database compression, checksum & rotating backup script
│   │   ├── deploy-env.sh          # Multi-env rollout script with automatic rollback logic
│   │   └── validate-docker.sh     # Static Dockerfile container best-practice auditor
│   ├── helm/                      # K8s Helm Deployment Packages
│   │   └── alignops/              # Templatized Helm Chart for the complete microservice stack
│   ├── gitops/                    # ArgoCD Bootstrappers & overlay overlays
│   │   ├── argocd-app.yaml        # ArgoCD self-healing application tracker
│   │   └── kustomize/             # Kustomize environment overlay directories
│   │       ├── base/              # Base dry definitions (referencing infrastructure/k8s)
│   │       └── overlays/          # Environmental staging/production overrides
│   ├── security/                  # Static vulnerability & secret scan policies
│   │   ├── gitleaks.toml          # GitLeaks configuration rules for secret prevention
│   │   └── trivy.yaml             # Container scanning rules and vulnerability filters
│   └── monitoring/                # Infrastructure Observability Configuration
│       ├── prometheus.yml         # Prometheus scraping and polling directives
│       └── grafana-dashboard.json # Pre-built importable Grafana APM dashboard panel
├── infrastructure/                # Legacy Cloud Infrastructure Manifests
│   ├── terraform/                 # IaC scripts provisioning AWS (VPC, RDS, ECS Fargate)
│   ├── k8s/                       # Raw Kubernetes manifest templates
│   ├── gitops/                    # Pre-refactor GitOps ArgoCD application definitions
│   ├── security/policy/           # Rego Policy-as-Code files for Conftest k8s audits
│   └── istio/                     # Service mesh policies (mTLS, Canary splits)
├── docker-compose.yml             # Local Docker Compose local stack runner
└── README.md                      
```

---

## Why AlignOps?

In many organizations, tracking performance goals with spreadsheets and email threads creates confusion. Employees are often unsure how their individual tasks connect to company priorities, managers struggle to see real-time progress, and HR teams have to collect and merge fragmented data during annual appraisals.

**AlignOps** solves these problems by providing a single, clear, and digital center for goal management:
*   **Built-in Balanced Goals:** Simple rules ensure that goals are balanced and carry meaningful importance.
*   **Clear Workspaces for Everyone:** Tailored dashboard views designed specifically for Employees, Managers, and HR Administrators.
*   **Automatic Score Calculations:** Clear progress tracking that automatically scales and calculates performance scores based on the specific type of target set.
*   **Safe & Audit-Ready:** An automatic ledger logs structural updates, approvals, and overrides, keeping the system transparent and reliable.

---

## How AlignOps Works: User Roles & Responsibilities

AlignOps provides three distinct workspaces, ensuring that every user sees exactly what is relevant to their job.

### 1. The Employee Workspace
As an employee, the portal gives you full visibility and ownership of your professional growth:
*   **Draft Goals:** Build your quarterly goal sheets, assign weights to each goal, and choose how you want to measure success.
*   **Submit for Review:** Submit your completed sheet to your manager for review. Once submitted, your goals are saved to prevent accidental changes.
*   **Update Progress:** As the quarter progresses, log your actual achievements and see your progress dials update in real time.
*   **View Personal Scorecards:** Monitor your achievements through easy-to-read, color-coded visual progress rings.

### 2. The Manager Workspace
As an L1 Manager, the portal gives you the tools to guide, align, and support your direct reports:
*   **Team Dashboard:** View a summary of your direct reports, showing who has drafted, submitted, or completed their reviews.
*   **Collaborative Reviews:** Open any employee sheet, adjust targets or weightages if needed, and either approve it or return it for updates with helpful feedback comments.
*   **Push Departmental Goals:** Instantly push a shared company or department-level objective to multiple team member sheets, ensuring everyone is working toward the same big picture.
*   **Provide Check-in Feedback:** Log formal feedback comments during quarterly reviews to guide and document career discussions.

### 3. The Admin & HR Workspace
As an Administrator or HR Business Partner, you maintain high-level organizational health and compliance:
*   **Cycle Management:** Schedule and control the active calendar windows for goal setting and quarterly review phases.
*   **Global Progress Dashboards:** Monitor real-time completion rates across different company departments to see who has finalized their reviews.
*   **Emergency Adjustments:** Safely unlock an approved goal sheet if an employee needs to make urgent adjustments (this action is automatically logged for transparency).
*   **Export Governance Reports:** Generate and download comprehensive Planned vs. Actual achievement data directly to a CSV or Excel sheet for organization-wide analysis.

---

## Simple Business Rules & Goal Guidelines

To ensure goal sheets remain high-quality, balanced, and focused, AlignOps automatically enforces a few simple rules:

### 1. The Weightage Rule (Exactly 100%)
The combined weightage of all goals on your sheet must add up to **exactly `100%`** before you can submit it. This encourages thoughtful prioritization of your responsibilities.

### 2. Goal Focus Limits
*   **Minimum Weight:** Each individual goal must carry at least **`10%`** weight. This prevents you from writing small, low-impact tasks as major goals.
*   **Maximum Count:** You can have a maximum of **8 goals** per sheet. This keeps your focus sharp and prevents workload overload.

### 3. State Management & Goal Sheet Locking
Your goal sheet moves through a simple, structured lifecycle to protect data accuracy:
1.  **Draft:** You can freely add, edit, or delete goals and adjust weightages.
2.  **Pending Approval:** Once you submit the sheet, it is sent to your manager. Edits are temporarily locked during the review.
3.  **Approved & Locked:** If your manager approves the sheet, it is officially locked. No changes can be made by you or your manager. This creates a secure, agreed-upon record for the review cycle.
4.  **Returned:** If your manager returns the sheet for adjustments, it reverts to the **Draft** state, allowing you to edit metrics, address their comments, and re-submit.
5.  **Administrative Unlock:** If an emergency change is needed after locking, an HR Admin can unlock the sheet, reverting it to **Draft**. The system automatically logs who unlocked it and why.

---

## Understanding Your Performance Score

To make progress reviews fair and objective, AlignOps calculates performance scores on a scale from `0%` to `100%` (stored in the system as `0.0` to `1.0`). Calculations depend on the **Unit of Measure (UoM)** you select for the goal:

| Unit of Measure | What it Means | How it is Calculated | Example |
| :--- | :--- | :--- | :--- |
| **Numeric Minimum** | Higher numbers are better. | Actual Achieved $\div$ Planned Target | Achieving a Sales Target of $120k on a $100k goal scores $100\%$ (capped). |
| **Numeric Maximum** | Lower numbers are better. | Planned Target $\div$ Actual Achieved | Reducing API response latency to 150ms on a 200ms target scores $100\%$. |
| **Timeline Target** | Delivery on or before a specific date. | $100\%$ if delivered on/before the date, else $0\%$ | Launching a feature on or before the June 1st deadline scores $100\%$. Late delivery scores $0\%$. |
| **Absolute Zero** | Success means zero occurrences. | $100\%$ if actual is exactly 0, else $0\%$ | Maintaining zero workplace safety incidents scores $100\%$. Any incident scores $0\%$. |

> [!TIP]
> **Why are scores capped at 100%?**
> Capping scores at `100%` ensures that hyper-performance in a single area (like doubling a sales target) does not artificially inflate your overall score to hide missed targets in other critical areas.

---

## System Design & Aesthetic: "Warm Industrial Editorial"

AlignOps features a distinct, custom visual style called **"Warm Industrial Editorial"**. Inspired by premium annual reports and precision-crafted dashboards, the portal combines a warm, welcoming feel with clean professionalism.

### The Corporate Color Palette
*   **The Backdrop (Parchment):** A warm, soft cream-grey background that reduces eye strain compared to harsh white screens.
*   **The Focus (Deep Forest Green):** Used for primary headers, navigation menus, and core actions, representing growth and professional structure.
*   **The Highlight (Warm Amber):** Used for badges, highlights, and secondary elements to add visual interest.
*   **The Text (Ink Black):** A soft, natural black for highly readable text.
*   **Status Indicators:** Classic red (terracotta rust), amber, and green (rich emerald) colors visually communicate your goal and submission statuses instantly.

### Typography Guidelines
*   **Headings (Fraunces serif):** Beautiful, publication-grade serif headings that give the portal an executive, annual-report-style look.
*   **Body Copy (DM Sans):** A friendly, readable sans-serif typeface used for clean forms, settings, and descriptions.
*   **Metrics & Numbers (JetBrains Mono):** A clean monospace typeface ensuring that targets, dates, scores, and weightages align perfectly in tables and dials.

---

## Easy Setup & Execution Guide

Running AlignOps on your machine is straightforward. Since the workspace is already connected directly to a hosted database, you do **not** need a database installed locally to run this project.

### Core Requirements
*   **Node.js:** version `20.x` or higher
*   **npm:** version `10.x` or higher

---

### Step 1: Run the Backend Services
Open a terminal in your project root folder and execute:

```powershell
# 1. Navigate to the backend folder
cd backend

# 2. Install package dependencies
npm install

# 3. Build and generate database connection clients
npx prisma generate

# 4. Start the backend developer server
npm run dev
```

*   **Service Address:** `http://localhost:3001/api/v1`
*   **Quick Health Check:** Open `http://localhost:3001/api/v1/cycles/active` in your browser to verify the service is running.

---

### Step 2: Run the Next.js Frontend Portal
Open a **new, separate terminal** in your project root folder and execute:

```powershell
# 1. Navigate to the frontend folder
cd frontend

# 2. Install package dependencies
npm install

# 3. Start the Next.js web server
npm run dev
```

*   **Web Portal Address:** `http://localhost:3000`
*   Open the link in your web browser to access the interactive portal.

---

### Running System Tests
The application includes automated tests to verify the scoring calculations and business logic.
To run the verification tests:
1.  Open your terminal in the `backend` folder.
2.  Execute:
    ```powershell
    npm run test
    ```

---

### Troubleshooting Port Conflicts
If port `3000` or `3001` is already in use, you can clear them with:

```powershell
# Clear standard backend and frontend ports
npx kill-port 3000
npx kill-port 3001
```

If the frontend displays outdated screens, clear the build cache and restart:
```powershell
cd frontend
Remove-Item -Recurse -Force .next
npm run dev
```

---

## Deployment

AlignOps is fully deployed and live using a zero-cost distributed PaaS setup:

| Layer | Platform | Details |
| :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | Next.js app deployed from the `frontend/` directory |
| **Backend** | [Render](https://render.com) | Fastify API deployed from the `backend/` directory |
| **Database** | [Neon](https://neon.tech) | Serverless PostgreSQL — connected to the Render backend |

### Environment Variables

**Backend (Render):**

| Key | Description |
| :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Primary token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `PORT` | `10000` (Render default) |
| `HOST` | `0.0.0.0` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | Frontend URL (or `*`) |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |

**Frontend (Vercel):**

| Key | Description |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Render backend URL, e.g. `https://alignops-backend.onrender.com/api/v1` |

---

## The Step-by-Step Goal Journey

Here is how a standard goal cycle moves through the portal:

### 1. Goal Calibration (The Goal-Setting Phase)
The employee logs into the portal and drafts their quarterly goal sheet. They choose how to measure each goal (such as Numeric or Timeline), set planned targets, and balance the weightages until they total exactly $100\%$. The employee then submits the sheet.

### 2. Collaborative Review & Locking
The L1 manager is notified. They review the employee's submitted sheet. If everything looks balanced, they approve it, locking the goals from further changes. If changes are needed, the manager returns it with written feedback so the employee can adjust and re-submit.

### 3. Periodic Updates & Feedback
During active quarterly windows, the employee inputs their actual achievements. The portal automatically calculates the performance scores and displays progress on interactive dashboard rings. The manager reviews these actuals and logs a formal check-in comment to guide the employee's growth.

### 4. HR Monitoring & Reporting
HR and Admin officers track progress across the company. They review completion dashboards to see which departments have completed their reviews, and export the planned vs. actual data directly to CSV files for organizational reporting.

---

## Platform Engineering & DevOps

AlignOps is equipped with a bleeding-edge, production-ready DevOps and DevSecOps infrastructure. This architecture includes multi-stage automation, cloud provisioning via **Infrastructure as Code (IaC)**, declarative **GitOps Continuous Deployment**, strict **Policy-As-Code (OPA)** compliance auditing, and a dedicated, production-ready **`/devops`** folder structure.

---

### 1. Decoupled CI/CD Reusable Pipeline Chunks

To optimize resource usage and guarantee speed, we have broken down all monolithic pipelines in .github/workflows/ into highly optimized, single-responsibility **Reusable Workflows**:

| Workflow File | Purpose / Trigger | Key Operations |
| :--- | :--- | :--- |
| ci.yml | Push/PR to `main`/`master` | **Orchestrator**: Uses path-filtering logic to trigger only required reusable sub-pipelines. |
| cd.yml | Releases (`v*`), push to `main` | **Orchestrator**: Invokes secure Docker build, Trivy scan, and publication flow. |
| reusable-backend.yml | Called by `ci.yml` | Spawns PostgreSQL Alpine service, runs security audit, validates Prisma schema, runs migrations, db:seed, lints, and executes Vitest checks. |
| reusable-frontend.yml | Called by `ci.yml` | Restores/saves Next.js compiler caching, checks ESLint styling, and runs production builds. |
| reusable-infra.yml | Called by `ci.yml` | Runs Terraform fmt/init/validate, tfsec scanning, Kubernetes manifest parsing, Kubeconform syntax analysis, and OPA policy validations via Conftest. |
| reusable-publish.yml | Called by `cd.yml` | Builds containers, scans with Aqua Trivy for critical CVEs, uploads SARIF logs to GitHub Security tab, compiles for `linux/amd64` and `linux/arm64`, and pushes to GHCR. |

---

### 2. Automated Operation Scripts

We maintain a collection of secure, POSIX-compliant helper utilities in devops/scripts/:

*   **Database Automated Maintenance (db-backup.sh)**: Creates timestamped, gzip-compressed PostgreSQL database backups. Generates SHA256 integrity checksum files and enforces a 7-day automated rolling deletion rule to preserve disk space.
*   **Deployment Controller (deploy-env.sh)**: Executes automated Helm upgrades, continuously polls the active microservice health check URL, and runs automatic rollbacks if the deployment probe fails to respond within the configured timeout window.
*   **Dockerfile Hardening Checker (validate-docker.sh)**: Performs static security analysis on Dockerfiles, blocking unpinned base tags (e.g. `:latest`), banning dangerous instructions (e.g. `ADD`), and mandating non-root execution (`USER`) and multi-stage architectures.

---

### 3. Kubernetes Helm Chart Orchestration

Raw duplicate Kubernetes files have been consolidated into an enterprise Helm chart in devops/helm/alignops/:

*   **Templatized Deployments**: Controls backend and frontend workloads with replica limits, resource boundaries, Horizontal Pod Autoscalers (HPA), and lifecycle probes (readiness/liveness).
*   **Stateful Services**: Spins up a robust Postgres StatefulSet mounted with 10Gi Persistent Volume Claims (PVC) to guarantee database persistence.
*   **Zero-Trust Networking**: Configures dynamic `NetworkPolicies` restricting database connections so only backend pods can access port 5432, blocking frontend and compromised containers.
*   **Unified Ingress & TLS**: Routes traffic between frontend and backend services, and requests automated SSL certificates from Let's Encrypt using Cert-Manager annotations.

---

### 4. GitOps Continuous Delivery

Our delivery workflow uses declarative GitOps configurations:

*   **ArgoCD App Manager (argocd-app.yaml)**: Boots up a self-healing deployment synchronization cycle in the cluster, pulling configurations directly from our Helm values and resolving configuration drifts automatically.
*   **Multi-Environment Kustomize Overlays (kustomize/)**:
    *   `base/`: References core raw Kubernetes resources from `infrastructure/k8s/` to avoid resource duplication.
    *   `overlays/staging/`: Lower replica constraints (1 replica) to optimize staging server cost.
    *   `overlays/production/`: Scale up backend and frontend to 3 active replicas to support production loads.

---

### 5. Prometheus & Grafana APM Observability

Our pre-configured telemetry stack is located in devops/monitoring/:

*   **Metrics Scraping (prometheus.yml)**: Regularly polls endpoints for Node Exporter, system processes, Fastify backend APIs, and Next.js frontend pages.
*   **APM Metrics Dashboard (grafana-dashboard.json)**: An importable JSON dashboard template mapping HTTP transaction volumes, request failure ratios, Prisma database pool status, memory footprints, and CPU load.

---

### 6. Cloud Topology (IaC)

A complete cloud topology modeled declaratively in **Terraform**:
*   **VPC Network Topology (`vpc.tf`)**: Isolates traffic into public, private app, and isolated database subnets using dual-NAT and Internet gateway setups.
*   **HA Database (`rds.tf`)**: Provisions a highly available **RDS PostgreSQL Multi-AZ** instance with Graviton CPU classes, KMS key storage encryption, auto-scaling storage, and automated backup schedules.
*   **Serverless Tasks (`ecs.tf`)**: Leverages serverless **AWS ECS Fargate** clusters with dedicated task roles and an **Application Load Balancer (ALB)** handling automated path routing.

---

### 7. DevSecOps: Policy-As-Code (OPA / Conftest)

*   **Rego Compliance Assertions (`k8s.rego`)**: Statically validates all Kubernetes deployment configurations.
*   Blocks execution in privileged modes (root protection).
*   Mandates CPU and Memory requests and limits.
*   Enforces label schemas.
*   Conftest processes these policies automatically inside the CI workflow.

---

### 8. Istio Service Mesh

*   **Canary Deployments (`mesh-routing.yaml`)**: Istio Gateway and VirtualService split API traffic: **90%** route to the stable backend, and **10%** route to a canary backend for safe production updates.
*   **Strict Mutual TLS (mTLS)**: Enforces `PeerAuthentication STRICT` and `DestinationRule ISTIO_MUTUAL` to guarantee all east-west pod communications are strictly encrypted.


