#!/bin/sh
set -e

echo "==> [runner] Iniciando EasyDeploy (código em /app)"
cd /app

# Instala dependências se node_modules não existir ou package.json mudou
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules/.install_stamp" ]; then
    echo "==> [runner] Instalando dependências..."
    pnpm --filter=@dokploy/server --filter=./apps/dokploy install --frozen-lockfile || \
        pnpm --filter=@dokploy/server --filter=./apps/dokploy install
    touch node_modules/.install_stamp
    echo "==> [runner] Dependências instaladas"
fi

# Build do servidor (@dokploy/server — TypeScript → dist)
echo "==> [runner] Buildando @dokploy/server..."
pnpm --filter=@dokploy/server build

# Build do Next.js
echo "==> [runner] Buildando Next.js..."
pnpm --filter=./apps/dokploy run build

# Inicia
echo "==> [runner] Iniciando aplicação..."
cd apps/dokploy
exec pnpm start
