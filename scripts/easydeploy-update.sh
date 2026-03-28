#!/bin/bash
# /usr/local/bin/easydeploy-update
# Atualiza o EasyDeploy sem rebuild de imagem Docker.
# Uso: easydeploy-update [--skip-pull]
set -e

REPO_DIR="/opt/easydeploy"
SERVICE_NAME="easydeploy"
RUNNER_IMAGE="easytisolutions/easydeploy-runner:latest"

cd "$REPO_DIR"

if [ "$1" != "--skip-pull" ]; then
    echo "==> Atualizando código (git pull)..."
    git pull origin main
fi

echo "==> Reiniciando serviço $SERVICE_NAME..."
docker service update --force "$SERVICE_NAME"

echo ""
echo "✓ EasyDeploy atualizado! O container está fazendo build e iniciando."
echo "  Acompanhe os logs com: docker service logs -f $SERVICE_NAME"
