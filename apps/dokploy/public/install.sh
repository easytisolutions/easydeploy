#!/bin/sh
set -e

# ─────────────────────────────────────────────
#  EasyDeploy — Instalador Automático
#  Imagem Docker: easytisolutions/easydeploy
#  Repositório: https://github.com/easytisolutions/easydeploy
# ─────────────────────────────────────────────

EASYDEPLOY_IMAGE="easytisolutions/easydeploy"
EASYDEPLOY_TAG="${EASYDEPLOY_TAG:-latest}"
EASYDEPLOY_PORT="${EASYDEPLOY_PORT:-3000}"
POSTGRES_PASSWORD=$(openssl rand -hex 16)
POSTGRES_USER="easydeploy"
POSTGRES_DB="easydeploy"
BETTER_AUTH_SECRET=$(openssl rand -hex 32)

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║          EasyDeploy — Instalação             ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Detectar sudo ──────────────────────────────────
if [ "$EUID" -eq 0 ]; then
    SUDO_CMD=""
    echo "Executando como root."
else
    if sudo -n true 2>/dev/null; then
        SUDO_CMD="sudo"
        echo "Executando com sudo."
    else
        echo "Erro: usuário sem root requer sudo sem senha."
        echo "Configure com: echo '$USER ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/$USER"
        exit 1
    fi
fi

# ── Verificar OS ───────────────────────────────────
OS_TYPE=$(grep -w "ID" /etc/os-release 2>/dev/null | cut -d= -f2 | tr -d '"')
case "$OS_TYPE" in
    ubuntu|debian|raspbian|centos|fedora|rhel|ol|rocky|almalinux|amzn|arch|alpine) ;;
    *)
        echo "Sistema operacional '$OS_TYPE' não suportado. Use Ubuntu, Debian, Fedora, RHEL, Arch ou Alpine."
        exit 1
        ;;
esac

# ── Instalar Docker ────────────────────────────────
if command -v docker > /dev/null 2>&1; then
    echo "Docker já instalado ✅"
else
    echo "Instalando Docker..."
    curl -fsSL https://get.docker.com | $SUDO_CMD sh
    $SUDO_CMD systemctl enable docker --now 2>/dev/null || true
    echo "Docker instalado ✅"
fi

# ── Inicializar Docker Swarm ───────────────────────
if $SUDO_CMD docker info 2>/dev/null | grep -q "Swarm: active"; then
    echo "Docker Swarm já ativo ✅"
else
    ADVERTISE_ADDR=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}' || hostname -I | awk '{print $1}')
    $SUDO_CMD docker swarm init --advertise-addr "$ADVERTISE_ADDR"
    echo "Docker Swarm iniciado ✅"
fi

# ── Criar rede overlay ─────────────────────────────
if $SUDO_CMD docker network ls | grep -q "dokploy-network"; then
    echo "Rede dokploy-network já existe ✅"
else
    $SUDO_CMD docker network create --driver overlay --attachable dokploy-network
    echo "Rede dokploy-network criada ✅"
fi

# ── Criar diretórios ───────────────────────────────
$SUDO_CMD mkdir -p /etc/dokploy/traefik/dynamic
$SUDO_CMD mkdir -p /etc/dokploy/logs
$SUDO_CMD mkdir -p /etc/dokploy/applications
echo "Diretórios criados ✅"

# ── Iniciar PostgreSQL ─────────────────────────────
if $SUDO_CMD docker service ls 2>/dev/null | grep -q "easydeploy-postgres"; then
    echo "PostgreSQL já em execução ✅"
else
    $SUDO_CMD docker volume create easydeploy-postgres-data 2>/dev/null || true
    $SUDO_CMD docker service create \
        --name easydeploy-postgres \
        --network dokploy-network \
        --env POSTGRES_USER="$POSTGRES_USER" \
        --env POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
        --env POSTGRES_DB="$POSTGRES_DB" \
        --mount type=volume,source=easydeploy-postgres-data,target=/var/lib/postgresql/data \
        --constraint "node.role==manager" \
        postgres:16-alpine
    echo "PostgreSQL iniciado ✅"
    echo "Aguardando PostgreSQL ficar pronto..."
    sleep 10
fi

# ── Salvar configurações ───────────────────────────
POSTGRES_URL="postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@easydeploy-postgres:5432/${POSTGRES_DB}"

$SUDO_CMD tee /etc/dokploy/.env > /dev/null <<EOF
DATABASE_URL=${POSTGRES_URL}
PORT=${EASYDEPLOY_PORT}
NODE_ENV=production
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
EOF
echo "Arquivo .env salvo em /etc/dokploy/.env ✅"

# ── Iniciar EasyDeploy ─────────────────────────────
if $SUDO_CMD docker service ls 2>/dev/null | grep -q "easydeploy"; then
    echo "Atualizando EasyDeploy..."
    $SUDO_CMD docker service update \
        --image "${EASYDEPLOY_IMAGE}:${EASYDEPLOY_TAG}" \
        easydeploy
else
    $SUDO_CMD docker service create \
        --name easydeploy \
        --network dokploy-network \
        --publish published="${EASYDEPLOY_PORT}",target=3000,mode=host \
        --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
        --mount type=bind,source=/etc/dokploy,target=/etc/dokploy \
        --env-file /etc/dokploy/.env \
        --constraint "node.role==manager" \
        --health-cmd "curl -fs http://localhost:3000/api/trpc/settings.health || exit 1" \
        --health-interval 10s \
        --health-retries 10 \
        "${EASYDEPLOY_IMAGE}:${EASYDEPLOY_TAG}"
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║       EasyDeploy instalado com sucesso!      ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  Acesse: http://$(hostname -I | awk '{print $1}'):${EASYDEPLOY_PORT}  ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "⚠️  Guarde as credenciais abaixo em local seguro:"
echo "   POSTGRES_USER:     ${POSTGRES_USER}"
echo "   POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}"
echo "   POSTGRES_DB:       ${POSTGRES_DB}"
echo "   BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}"
echo ""
echo "Configurações salvas em: /etc/dokploy/.env"
