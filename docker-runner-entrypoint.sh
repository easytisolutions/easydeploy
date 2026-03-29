#!/bin/sh
set -e

echo "==> [runner] Iniciando EasyDeploy (código em /app)"
cd /app

# Instala dependências se node_modules não existir ou pnpm-lock.yaml mudou
# Na primeira vez: instala tudo (~2min). Nos updates (git pull): pula esta etapa.
LOCKFILE_HASH=""
if [ -f "pnpm-lock.yaml" ]; then
    LOCKFILE_HASH=$(md5sum pnpm-lock.yaml | cut -d' ' -f1)
fi
STAMP_FILE="node_modules/.install_stamp"
PREV_HASH=$(cat "$STAMP_FILE" 2>/dev/null || echo "")

if [ ! -d "node_modules" ] || [ "$LOCKFILE_HASH" != "$PREV_HASH" ]; then
    echo "==> [runner] Instalando dependências (lockfile mudou ou primeira vez)..."
    pnpm --filter=@dokploy/server --filter=./apps/dokploy install --frozen-lockfile 2>/dev/null || \
        pnpm --filter=@dokploy/server --filter=./apps/dokploy install
    echo "$LOCKFILE_HASH" > "$STAMP_FILE"
    echo "==> [runner] Dependências instaladas"
else
    echo "==> [runner] Dependências OK (sem mudanças no lockfile)"
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
