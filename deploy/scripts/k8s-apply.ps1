# Usage: .\deploy\scripts\k8s-apply.ps1 ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/codedolphin:TAG
param(
  [Parameter(Mandatory = $true)][string]$Image
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $Root

kubectl apply -f deploy/k8s/01-namespace.yaml
kubectl apply -f deploy/k8s/02-configmap.yaml
kubectl apply -f deploy/k8s/08-redis.yaml

(Get-Content deploy/k8s/03-deployment.yaml -Raw) -replace 'REPLACE_ME_ECR_IMAGE', $Image | kubectl apply -f -

kubectl apply -f deploy/k8s/04-service.yaml
kubectl apply -f deploy/k8s/05-ingress.yaml
kubectl apply -f deploy/k8s/06-hpa.yaml
kubectl apply -f deploy/k8s/07-servicemonitor.yaml

kubectl rollout status deployment/codedolphin-web -n codedolphin --timeout=300s
