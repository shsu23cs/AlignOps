# AlignOps Next-Generation DevOps Architecture Manual

Welcome to the centralized DevOps repository for AlignOps. This dedicated folder structure hosts the entire infrastructure-as-code, automation pipelines, continuous delivery charts, observability stack, and security compliance rules.

---

## 1. DevOps Folder Structure

The DevOps environment is systematically organized into dedicated pillars:

```
devops/
├── README.md                      # This master handbook
├── pipelines/                     # Pipeline templates and workflow utilities
│   └── templates/                 # Reusable pipeline workflow jobs
├── scripts/                       # High-utility automated scripts
│   ├── db-backup.sh               # Database maintenance and backup script
│   ├── deploy-env.sh              # Multi-environment deployment controller
│   └── validate-docker.sh         # Dockerfile policy checker and hardening tool
├── helm/                          # Deployments package manager (Helm charts)
│   └── alignops/                  # Consolidated Helm chart for all microservices
├── gitops/                        # ArgoCD GitOps definitions & environment state configs
│   ├── argocd-app.yaml            # ArgoCD core manifest
│   └── kustomize/                 # Kustomize environment overlays (base, staging, prod)
├── security/                      # DevSecOps auditing, secret scan & container scan rules
│   ├── gitleaks.toml              # GitLeaks security rules
│   └── trivy.yaml                 # Trivy container scanner config
└── monitoring/                    # Observability config (Prometheus & Grafana dashboard)
    ├── prometheus.yml             # Scraping configurations
    └── grafana-dashboard.json     # Standard APM Grafana visualization
```

---

## 2. Decoupled CI/CD Workflow Architecture

To optimize build speed, cache efficiency, and pipeline maintainability, all monolithic workflows in `.github/workflows/` have been decomposed into isolated, single-responsibility **Reusable Workflows**.

### The Orchestrators
- **`ci.yml`**: Uses high-performance path-filtering logic to analyze pull requests and pushes, triggering only the necessary reusable sub-pipelines.
- **`cd.yml`**: Coordinates tagged releases (`v*`) or manual dispatches. Runs security checks and builds optimized production packages.

### The Reusable Modules
- **`reusable-backend.yml`**: Encapsulates database service spin-up (PostgreSQL Alpine), npm vulnerability scanning, Prisma verification, database schema migration, unit testing (Vitest), and compilation checks.
- **`reusable-frontend.yml`**: Orchestrates Next.js caching optimization, ES linting validation, and production bundle builds.
- **`reusable-infra.yml`**: Houses Terraform code syntax linting, tfsec static vulnerability checking, YAML verification, and Open Policy Agent (OPA) conformance scanning via Conftest.
- **`reusable-publish.yml`**: Implements Docker buildx cache pooling, local container construction, Aqua Security Trivy image scanning, automatic SARIF security report uploading, and high-performance multi-architecture (`linux/amd64`, `linux/arm64`) publishing to GHCR.

---

## 3. High-Utility Automation Scripts

We provide hardened bash scripts in the `/devops/scripts/` folder to run utility jobs:
1. **`db-backup.sh`**: Handles scheduled automated backups, compression, checksum verification, and log rotation for the database.
2. **`deploy-env.sh`**: Manages rolling-update deployments, health sanity checks, environment injections, and automated Rollbacks upon failure.
3. **`validate-docker.sh`**: Scans and enforces container best practices (e.g. forbidding running as root, pinning specific tags, checking for multi-stage configuration).

---

## 4. Kubernetes Helm Deployment

Instead of manually maintaining raw YAML files, the `/devops/helm/alignops/` directory contains an enterprise-level Helm Chart. This packages:
- **`backend-deployment`**: Next-gen Fastify backend service configuration with resource controls, readiness/liveness probes, and HPA (Horizontal Pod Autoscaler) readiness.
- **`frontend-deployment`**: High-performance Next.js server configuration.
- **`postgres-statefulset`**: Stateful, volume-mounted database instance with persistence storage guarantees.
- **`ingress`**: NGINX / Istio ingress configuration mapping external traffic smoothly.

---

## 5. ArgoCD & GitOps Workflows

Our system uses declarative GitOps. ArgoCD monitors the `/devops/gitops/kustomize/` directory.
- `base/` defines the core Kubernetes templates.
- `overlays/staging/` and `overlays/production/` inject environment-specific database credentials, resource limits, replication metrics, and hostnames.
- The `argocd-app.yaml` file bootstraps this sync pipeline onto your Kubernetes cluster with a single command:
  ```bash
  kubectl apply -f devops/gitops/argocd-app.yaml
  ```

---

## 6. Enterprise Observability Stack

The system comes pre-configured with a dual-engine telemetry system:
- **Prometheus (`devops/monitoring/prometheus.yml`)**: Configured to poll Node Exporter and application endpoints, including health metrics, request counts, response latency, and memory consumption.
- **Grafana (`devops/monitoring/grafana-dashboard.json`)**: A pre-built, ready-to-import APM dashboard displaying CPU usage spikes, error ratios, query rates, and memory saturation in real time.
