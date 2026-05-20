set -euo pipefail
IMAGE="${1:?Full ECR image URI required}"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

kubectl apply -f deploy/k8s/01-namespace.yaml
kubectl apply -f deploy/k8s/02-configmap.yaml
kubectl apply -f deploy/k8s/08-redis.yaml

sed "s|REPLACE_ME_ECR_IMAGE|${IMAGE}|g" deploy/k8s/03-deployment.yaml | kubectl apply -f -

kubectl apply -f deploy/k8s/04-service.yaml
kubectl apply -f deploy/k8s/05-ingress.yaml
kubectl apply -f deploy/k8s/06-hpa.yaml
kubectl apply -f deploy/k8s/07-servicemonitor.yaml

kubectl rollout status deployment/codedolphin-web -n codedolphin --timeout=300s
