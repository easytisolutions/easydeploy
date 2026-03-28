#!/bin/sh
set -e

# ─────────────────────────────────────────────────────────────────
#  EasyDeploy — Instalador Automático
#  Repositório: https://github.com/easytisolutions/easydeploy
#
#  Modos de instalação (variável de ambiente INSTALL_MODE):
#    git    → clona o repositório e faz build local da imagem Docker
#    image  → usa a imagem pré-buildada easytisolutions/easydeploy
#
#  Padrão: git
#
#  Uso rápido:
#    curl -sSL https://seu-dominio.com/install.sh | sh
#
#  Forçar imagem pré-buildada:
#    INSTALL_MODE=image curl -sSL https://seu-dominio.com/install.sh | sh
# ─────────────────────────────────────────────────────────────────

INSTALL_MODE="${INSTALL_MODE:-git}"
GIT_REPO="https://github.com/easytisolutions/easydeploy.git"
GIT_BRANCH="${GIT_BRANCH:-main}"
EASYDEPLOY_IMAGE="easytisolutions/easydeploy"
EASYDEPLOY_TAG="${EASYDEPLOY_TAG:-latest}"
EASYDEPLOY_PORT="${EASYDEPLOY_PORT:-3000}"
INSTALL_DIR="/opt/easydeploy"

POSTGRES_PASSWORD=$(openssl rand -hex 16)
POSTGRES_USER="easydeploy"
POSTGRES_DB="easydeploy"
BETTER_AUTH_SECRET=$(openssl rand -hex 32)

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║           EasyDeploy — Instalação                ║"
echo "║  Modo: ${INSTALL_MODE}                                   ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Detectar sudo ────────────────────────────────────
if [ "$(id -u)" -eq 0 ]; then
    SUDO_CMD=""
    echo "Executando como root."
else
    if sudo -n true 2>/dev/null; then
        SUDO_CMD="sudo"
        echo "Executando como $(id -un) com sudo."
    else
        echo "Erro: usuário sem root requer sudo sem senha."
        echo "Configure com: echo '$(id -un) ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/$(id -un)"
        exit 1
    fi
fi

# ── Verificar OS ─────────────────────────────────────
OS_TYPE=$(grep -w "ID" /etc/os-release 2>/dev/null | cut -d= -f2 | tr -d '"')
case "$OS_TYPE" in
    ubuntu|debian|raspbian|centos|fedora|rhel|ol|rocky|almalinux|amzn|arch|alpine) ;;
    *)
        echo "Sistema operacional '$OS_TYPE' não suportado. Use Ubuntu, Debian, Fedora, RHEL, Arch ou Alpine."
        exit 1
        ;;
esac

# ── Instalar dependências básicas ────────────────────
command_exists() { command -v "$@" > /dev/null 2>&1; }

install_pkg() {
    case "$OS_TYPE" in
        ubuntu|debian|raspbian) $SUDO_CMD apt-get install -y -q "$@" ;;
        centos|rhel|ol|rocky|almalinux|amzn) $SUDO_CMD yum install -y "$@" ;;
        fedora) $SUDO_CMD dnf install -y "$@" ;;
        arch) $SUDO_CMD pacman -Sy --noconfirm "$@" ;;
        alpine) $SUDO_CMD apk add --no-cache "$@" ;;
    esac
}

if ! command_exists curl; then
    echo "Instalando curl..."
    install_pkg curl
fi
if ! command_exists git; then
    echo "Instalando git..."
    install_pkg git
fi

# ── Instalar Docker ──────────────────────────────────
if command_exists docker; then
    echo "Docker já instalado ✅"
else
    echo "Instalando Docker..."
    curl -fsSL https://get.docker.com | $SUDO_CMD sh
    $SUDO_CMD systemctl enable docker --now 2>/dev/null || true
    echo "Docker instalado ✅"
fi

# ── Inicializar Docker Swarm ─────────────────────────
if $SUDO_CMD docker info 2>/dev/null | grep -q "Swarm: active"; then
    echo "Docker Swarm já ativo ✅"
else
    ADVERTISE_ADDR=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}')
    if [ -z "$ADVERTISE_ADDR" ]; then
        ADVERTISE_ADDR=$(hostname -I | awk '{print $1}')
    fi
    $SUDO_CMD docker swarm init --advertise-addr "$ADVERTISE_ADDR"
    echo "Docker Swarm iniciado ✅"
fi

# ── Criar rede overlay ───────────────────────────────
if $SUDO_CMD docker network ls | grep -q "dokploy-network"; then
    echo "Rede dokploy-network já existe ✅"
else
    $SUDO_CMD docker network create --driver overlay --attachable dokploy-network
    echo "Rede dokploy-network criada ✅"
fi

# ── Criar diretórios ─────────────────────────────────
$SUDO_CMD mkdir -p /etc/dokploy/traefik/dynamic
$SUDO_CMD mkdir -p /etc/dokploy/logs
$SUDO_CMD mkdir -p /etc/dokploy/applications
echo "Diretórios criados ✅"

# ── Salvar .env antes de subir serviços ──────────────
POSTGRES_URL="postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@easydeploy-postgres:5432/${POSTGRES_DB}"

if [ ! -f /etc/dokploy/.env ]; then
    $SUDO_CMD tee /etc/dokploy/.env > /dev/null <<EOF
DATABASE_URL=${POSTGRES_URL}
PORT=${EASYDEPLOY_PORT}
NODE_ENV=production
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
EOF
    echo "Arquivo /etc/dokploy/.env criado ✅"
else
    echo "Arquivo /etc/dokploy/.env já existe, mantendo configurações ✅"
    # Recarrega variáveis do arquivo existente para exibir no resumo final
    # shellcheck disable=SC1091
    . /etc/dokploy/.env 2>/dev/null || true
fi

# ── Iniciar PostgreSQL ───────────────────────────────
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
    sleep 12
fi

# ── Build ou pull da imagem ──────────────────────────
if [ "$INSTALL_MODE" = "git" ]; then
    echo ""
    echo "── Clonando repositório do GitHub ──────────────────"
    if [ -d "$INSTALL_DIR/.git" ]; then
        echo "Repositório já existe em $INSTALL_DIR, atualizando..."
        $SUDO_CMD git -C "$INSTALL_DIR" fetch origin
        $SUDO_CMD git -C "$INSTALL_DIR" reset --hard "origin/${GIT_BRANCH}"
    else
        $SUDO_CMD git clone --depth=1 --branch "$GIT_BRANCH" "$GIT_REPO" "$INSTALL_DIR"
    fi
    echo "Repositório em $INSTALL_DIR ✅"

    echo ""
    echo "── Buildando imagem Docker (isso pode levar alguns minutos)..."
    # Copia o .env.production.example se necessário
    if [ ! -f "$INSTALL_DIR/.env.production" ]; then
        if [ -f "$INSTALL_DIR/apps/dokploy/.env.production.example" ]; then
            $SUDO_CMD cp "$INSTALL_DIR/apps/dokploy/.env.production.example" "$INSTALL_DIR/.env.production"
            $SUDO_CMD cp "$INSTALL_DIR/apps/dokploy/.env.production.example" "$INSTALL_DIR/apps/dokploy/.env.production"
        else
            $SUDO_CMD sh -c "echo 'PORT=3000' > $INSTALL_DIR/.env.production"
            $SUDO_CMD cp "$INSTALL_DIR/.env.production" "$INSTALL_DIR/apps/dokploy/.env.production"
        fi
    fi

    $SUDO_CMD docker build \
        --pull \
        --rm \
        -t "${EASYDEPLOY_IMAGE}:local" \
        -f "$INSTALL_DIR/Dockerfile" \
        "$INSTALL_DIR"

    DEPLOY_IMAGE="${EASYDEPLOY_IMAGE}:local"
    echo "Imagem buildada: ${DEPLOY_IMAGE} ✅"
else
    echo ""
    echo "── Baixando imagem ${EASYDEPLOY_IMAGE}:${EASYDEPLOY_TAG}..."
    $SUDO_CMD docker pull "${EASYDEPLOY_IMAGE}:${EASYDEPLOY_TAG}"
    DEPLOY_IMAGE="${EASYDEPLOY_IMAGE}:${EASYDEPLOY_TAG}"
    echo "Imagem disponível ✅"
fi

# ── Iniciar ou atualizar EasyDeploy ──────────────────
if $SUDO_CMD docker service ls 2>/dev/null | grep -q " easydeploy "; then
    echo "Atualizando serviço EasyDeploy..."
    $SUDO_CMD docker service update \
        --image "$DEPLOY_IMAGE" \
        --force \
        easydeploy
    echo "EasyDeploy atualizado ✅"
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
        --health-retries 15 \
        "$DEPLOY_IMAGE"
    echo "EasyDeploy iniciado ✅"
fi

SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║        EasyDeploy instalado com sucesso! 🚀      ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Acesse:  http://${SERVER_IP}:${EASYDEPLOY_PORT}           ║"
echo "║  Modo:    ${INSTALL_MODE}                                   ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "⚠️  Guarde as credenciais abaixo em local seguro:"
echo "   POSTGRES_USER:      ${POSTGRES_USER}"
echo "   POSTGRES_PASSWORD:  ${POSTGRES_PASSWORD}"
echo "   POSTGRES_DB:        ${POSTGRES_DB}"
echo "   BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}"
echo ""
echo "Configurações salvas em: /etc/dokploy/.env"
if [ "$INSTALL_MODE" = "git" ]; then
    echo "Código-fonte em:        ${INSTALL_DIR}"
fi
