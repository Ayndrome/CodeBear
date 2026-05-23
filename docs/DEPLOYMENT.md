# Deployment

This document covers how CodeBear goes from source code on a developer's machine to a live, publicly accessible application at [codebear.space](https://codebear.space).

---

## Overview

```
Developer machine
      |
      | git push
      v
GitHub repository
      |
      | webhook trigger
      v
Jenkins CI/CD pipeline
      |
      +-- docker build (multi-stage)
      |
      +-- docker push --> AWS ECR (container registry)
      |
      +-- kubectl set image --> AWS EKS (Kubernetes)
                                      |
                          +-----------+-----------+
                          |                       |
                     Deployment                 Redis
                    (Next.js app)           (in-cluster)
                          |
                    ClusterIP Service
                          |
                    ALB Ingress (AWS)
                          |
                    HTTPS termination
                    (ACM certificate)
                          |
                    codebear.space
```

---

## Infrastructure: AWS EKS via Terraform

The cluster is provisioned with Terraform using the official AWS EKS and VPC modules. All resources live in `eu-north-1` (Stockholm).

### What gets created

**VPC** — a dedicated `/16` network (`10.0.0.0/16`) spread across 3 availability zones with public and private subnets. Public subnets carry the load balancer; application pods run in private subnets with outbound internet via a single NAT gateway.

**EKS cluster** — Kubernetes `1.29`, one managed node group running `m7i.flex.large` on-demand instances. The cluster endpoint is publicly accessible so `kubectl` works from developer machines.

**Subnet tags** — the `kubernetes.io/role/elb` and `kubernetes.io/role/internal-elb` tags on the subnets tell the AWS Load Balancer Controller which subnets to place ALBs in.

### Key variables

| Variable | Default | Description |
|---|---|---|
| `aws_region` | `eu-north-1` | AWS region |
| `cluster_name` | `codedolphin-eks` | EKS cluster name |
| `cluster_version` | `1.29` | Kubernetes version |
| `vpc_cidr` | `10.0.0.0/16` | VPC address space |

### Provision the cluster

```bash
cd deploy/terraform
terraform init
terraform plan
terraform apply
```

Configure `kubectl` after apply:

```bash
aws eks update-kubeconfig --region eu-north-1 --name codedolphin-eks
```

---

## Container Image: Multi-stage Dockerfile

The build is split into three stages to keep the production image lean.

```
Stage 1 — deps
  node:20-bookworm-slim
  npm ci (install exact lockfile dependencies)

Stage 2 — builder
  Copies node_modules from deps
  Installs openssl (required by Prisma)
  Injects NEXT_PUBLIC_APP_URL build arg
  Runs: prisma generate + next build (standalone output)

Stage 3 — runner
  node:20-bookworm-slim (fresh, no dev tools)
  Installs openssl runtime libs
  Runs as non-root user (nextjs, uid 1001)
  Copies only: .next/standalone, .next/static, public/,
               prisma/, node_modules/.prisma, node_modules/@prisma
  Exposes port 3000
  CMD: node server.js
```

The `standalone` Next.js output mode traces exactly which files the app needs, so the final image contains no source code, no dev dependencies, and no build tooling.

**Build the image locally:**

```bash
docker build \
  --build-arg NEXT_PUBLIC_APP_URL=https://codebear.space \
  -t codedolphin-web:local .
```

**Run it locally:**

```bash
docker run -p 3000:3000 \
  --env-file .env.local \
  codedolphin-web:local
```

---

## Kubernetes Manifests

All manifests live in `deploy/k8s/` and are applied together via Kustomize.

```
deploy/k8s/
  01-namespace.yaml
  02-configmap.yaml
  03-deployment.yaml
  04-service.yaml
  05-ingress.yaml
  06-hpa.yaml
  07-servicemonitor.yaml
  08-redis.yaml
  kustomization.yaml
```

Apply everything at once:

```bash
kubectl apply -k deploy/k8s
```

Apply with a specific image tag (e.g. after a release):

```bash
kubectl apply -k deploy/k8s \
  --image=ACCOUNT.dkr.ecr.eu-north-1.amazonaws.com/codedolphin-web:TAG
```

---

### Namespace — `01-namespace.yaml`

All CodeBear resources run in the `codedolphin` namespace, isolated from system workloads.

---

### ConfigMap — `02-configmap.yaml`

Holds non-sensitive runtime configuration injected into the pod as environment variables:

| Key | Value | Purpose |
|---|---|---|
| `NODE_ENV` | `production` | Node runtime mode |
| `HOSTNAME` | `0.0.0.0` | Bind address for Next.js |
| `REDIS_HOST` | `redis` | In-cluster Redis service name |
| `REDIS_PORT` | `6379` | Redis port |

Sensitive values (database URL, API keys, secrets) are kept in a separate `codedolphin-secrets` Kubernetes Secret and never committed to the repository.

---

### Deployment — `03-deployment.yaml`

| Setting | Value |
|---|---|
| Replicas | 1 (scaled by HPA, min 2 in production) |
| Image pull policy | `IfNotPresent` |
| Strategy | `RollingUpdate` (maxUnavailable: 1, maxSurge: 1) |
| CPU request / limit | 100m / 500m |
| Memory request / limit | 256Mi / 512Mi |
| Termination grace period | 30s |

**Probes:**

| Probe | Path | Initial delay | Period |
|---|---|---|---|
| Readiness | `/api/health/ready` | 15s | 10s |
| Liveness | `/api/health/live` | 45s | 20s |

The readiness probe prevents traffic from reaching a pod until the app, database connection, and Redis connection are all confirmed healthy. The liveness probe restarts a pod that has become unresponsive.

---

### Service — `04-service.yaml`

A `ClusterIP` service named `codedolphin-web` exposes port `80` inside the cluster, forwarding to container port `3000`. The Ingress targets this service.

---

### Ingress — `05-ingress.yaml`

Traffic enters the cluster through an **AWS Application Load Balancer** managed by the AWS Load Balancer Controller. Two Ingress resources share the same ALB via `alb.ingress.kubernetes.io/group.name: codedolphin`.

**codebear.space (group order 10)**
- Internet-facing ALB, target type `ip`
- HTTP on port 80 is automatically redirected to HTTPS 443
- TLS certificate from AWS Certificate Manager (`eu-north-1`)
- All paths (`/`) route to the `codedolphin-web` ClusterIP service

**grafana.codebear.space (group order 20)**
- Same ALB group and certificate
- Routes to the `kube-prometheus-grafana` service in the `monitoring` namespace
- Health check path overridden to `/api/health`

---

### HPA — `06-hpa.yaml`

The Horizontal Pod Autoscaler keeps CPU utilization around 60%, scaling between 2 and 8 replicas.

| Setting | Value |
|---|---|
| Min replicas | 2 |
| Max replicas | 8 |
| Scale trigger | CPU utilization > 60% |

---

### ServiceMonitor — `07-servicemonitor.yaml`

A Prometheus Operator `ServiceMonitor` tells the in-cluster Prometheus to scrape the app's `/api/metrics` endpoint every 30 seconds (timeout 10s). The `release: kube-prometheus` label makes it discoverable by the kube-prometheus-stack Helm release.

---

### Redis — `08-redis.yaml`

A single-replica Redis 7 (Alpine) pod running in the `codedolphin` namespace.

| Setting | Value |
|---|---|
| Image | `redis:7-alpine` |
| Max memory | 128 MB |
| Eviction policy | `allkeys-lru` |
| Storage | `emptyDir` (ephemeral — cache only, not durable) |
| Service | ClusterIP on port 6379, DNS: `redis.codedolphin.svc.cluster.local` |

The app connects using `REDIS_HOST=redis` from the ConfigMap, which resolves to this service within the namespace.

---

## CI/CD Pipeline: Jenkins

The Jenkinsfile at the repository root automates build, push, and deploy in two stages.

### Pipeline environment

| Variable | Value |
|---|---|
| `AWS_REGION` | `eu-north-1` |
| `ECR_REPOSITORY` | `codedolphin-web` |
| `K8S_NAMESPACE` | `codedolphin` |
| `DEPLOYMENT_NAME` | `codedolphin-web` |
| `CLUSTER_NAME` | `codedolphin-eks` |
| `NEXT_PUBLIC_APP_URL` | `https://codebear.space` |

AWS credentials are stored in Jenkins as a credential binding (`aws-credentials`) and never appear in the pipeline logs.

---

### Stage 1 — Docker build and push to ECR

```
1. Resolve image tag
   - Use IMAGE_TAG parameter if provided
   - Otherwise: git rev-parse --short HEAD  (e.g. a3f92c1)

2. Look up AWS account ID via STS
   -> builds ECR registry URL: ACCOUNT.dkr.ecr.eu-north-1.amazonaws.com

3. Create ECR repository if it doesn't exist

4. Authenticate Docker to ECR
   aws ecr get-login-password | docker login ...

5. docker build
   --build-arg NEXT_PUBLIC_APP_URL=https://codebear.space
   (runs 3-stage Dockerfile: deps -> builder -> runner)

6. docker tag  local_image -> ECR_REGISTRY/codedolphin-web:TAG

7. docker push  -> ECR

8. Write TAG and FULL_IMAGE to /tmp/.codebear-image.env
   (shared between stages within the same Jenkins agent)
```

### Stage 2 — Deploy to EKS

```
1. Read TAG and FULL_IMAGE from /tmp/.codebear-image.env

2. aws eks update-kubeconfig
   -> writes kubeconfig for codedolphin-eks into ~/.kube/config

3. kubectl set image deployment/codedolphin-web
   web=FULL_IMAGE
   -n codedolphin
   -> triggers a rolling update

4. kubectl rollout status  (timeout: 300s)
   -> waits for all new pods to pass readiness probe before succeeding
   -> pipeline fails if rollout does not complete within 5 minutes
```

---

## Request Path: End to End

```
Browser: https://codebear.space/dashboard
      |
      v
Route 53  (DNS A record -> ALB)
      |
      v
AWS ALB  (HTTPS 443, ACM certificate)
      |  HTTP->HTTPS redirect on port 80
      v
ALB Target Group  (target type: ip, health check: /api/health/ready)
      |
      v
codedolphin-web pod  (port 3000, Next.js standalone)
      |
      +-- PostgreSQL  (external, DATABASE_URL from Secret)
      +-- Redis       (redis:6379, in-cluster ClusterIP)
      +-- Gemini API  (outbound via NAT gateway)
      +-- GitHub API  (outbound via NAT gateway)
```

---

## Secrets Management

Sensitive values are stored in a Kubernetes Secret named `codedolphin-secrets` in the `codedolphin` namespace. The Secret is **not** committed to the repository. Create it once on the cluster:

```bash
kubectl create secret generic codedolphin-secrets \
  --namespace codedolphin \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=GITHUB_CLIENT_ID="..." \
  --from-literal=GITHUB_CLIENT_SECRET="..." \
  --from-literal=GITHUB_WEBHOOK_SECRET="..." \
  --from-literal=GITHUB_APP_ID="..." \
  --from-literal=GITHUB_PRIVATE_KEY="..." \
  --from-literal=GEMINI_API_KEY="..." \
  --from-literal=SENTRY_DSN="..." \
  --from-literal=SLACK_WEBHOOK_URL="..."
```

The Deployment references this Secret via `secretRef`, so all keys are injected as environment variables at pod startup.

---

## Monitoring

Grafana is accessible at [grafana.codebear.space](https://grafana.codebear.space) via the same ALB. It is deployed by the `kube-prometheus-stack` Helm chart in the `monitoring` namespace. The `ServiceMonitor` in `07-servicemonitor.yaml` connects Prometheus to the app's `/api/metrics` endpoint.

Key metrics scraped:

```
http_requests_total
http_request_duration_seconds
reviews_total
review_duration_seconds
cache_hits_total
circuit_breaker_state
llm_tokens_used_total
```

---

## Common Operations

**Check pod status:**
```bash
kubectl get pods -n codedolphin
```

**Tail application logs:**
```bash
kubectl logs -n codedolphin -l app=codedolphin -f
```

**Force a rolling restart (e.g. to pick up a new Secret value):**
```bash
kubectl rollout restart deployment/codedolphin-web -n codedolphin
```

**Roll back to the previous image:**
```bash
kubectl rollout undo deployment/codedolphin-web -n codedolphin
```

**Check HPA status:**
```bash
kubectl get hpa -n codedolphin
```

**Manually deploy a specific tag without running the full pipeline:**
```bash
ECR=ACCOUNT.dkr.ecr.eu-north-1.amazonaws.com/codedolphin-web
kubectl set image deployment/codedolphin-web web=${ECR}:TAG -n codedolphin
kubectl rollout status deployment/codedolphin-web -n codedolphin
```

---

Back to [README](../README.md)