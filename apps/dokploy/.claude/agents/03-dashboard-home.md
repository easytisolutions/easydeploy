# Agente 3: Dashboard Home V2

## ⚠️ LEITURA OBRIGATÓRIA ANTES DE COMEÇAR
**Leia o arquivo `.claude/e2e-flow-map.md` INTEIRO antes de implementar qualquer coisa.**
O Dashboard Home é o HUB de navegação. Todos os links devem apontar para os paths 
corretos das outras telas refatoradas.

## Objetivo
Transformar a página inicial do dashboard em um overview moderno com métricas
animadas, deploys recentes e acesso rápido a projetos.
GARANTIR que todos os links de navegação apontem para os paths corretos.

## Fase 1: Exploração (Subagente Explore)
```
Use subagente Explore com thoroughness "thorough" para:
1. Ler dokploy/apps/dokploy/pages/dashboard/index.tsx (ou homepage do dashboard)
   - Se não existir, verificar qual é a rota padrão do /dashboard/
2. Verificar quais queries tRPC estão REALMENTE disponíveis:
   - api.project.all → lista projetos (CONFIRMADO)
   - api.deployment.allCentralized → lista deploys (CONFIRMADO)
   - api.server.withSSHKey → servidores (CONFIRMADO)
   - Testar se existem queries de contagem ou aggregation
3. Retornar: página atual, queries existentes, paths de navegação
```

## Fase 2: Implementação

### Arquivo: `components/features/dashboard/components/dashboard-home-v2.tsx`

### 🔴 REGRAS DE INTEGRIDADE DE NAVEGAÇÃO (OBRIGATÓRIO)
Os links DEVEM apontar para os paths exatos usados por toda a aplicação:
```
/dashboard/deploy        → Deploy Wizard (wizard 2 passos)
/dashboard/projects      → Lista de projetos (show-projects-v2)
/dashboard/deployments   → Histórico de deploys (show-deployments-v2)
/dashboard/project/{id}/environment/{envId} → Detalhe do projeto
/dashboard/project/{id}/environment/{envId}/services/application/{appId} → Detalhe da app
```

**NÃO inventar paths novos. Usar EXATAMENTE os paths acima.**

### 🔴 QUERIES tRPC (usar APENAS queries que existem)
```tsx
// CONFIRMADAS - podem usar:
api.project.all                    // Lista de projetos
api.deployment.allCentralized      // Todos os deploys
api.server.withSSHKey              // Servidores

// DERIVAR dados destas queries:
// - Total de projetos: data.length
// - Deploys recentes: data.slice(0, 5)
// - Deploys hoje: data.filter(d => isToday(d.createdAt)).length
// - Aplicações ativas: contar status === "running" nos deploys
// - Servidores: servers.length
```

**NÃO chamar queries que não existem (ex: api.stats.*, api.metrics.*).**

### Requisitos Visuais:

1. **Welcome Header**:
   - "Bem-vindo ao EasyDeploy" com FadeInUp
   - Subtítulo com data atual formatada em pt-BR
   - Botão "Novo Deploy" com ícone Rocket → Link para `/dashboard/deploy`

2. **Métricas Cards** (row de 4 cards):
   - Total de Projetos (ícone FolderKanban, contagem de `api.project.all`)
   - Aplicações Ativas (ícone Rocket, com `StatusPulse` running)
   - Deploys Hoje (ícone GitCommitHorizontal, contar deploys de hoje)
   - Servidores (ícone Server, contagem de `api.server.withSSHKey`)
   - Cada card: `FadeInUp` com stagger, border-l-4 com cor easyti

3. **Deploys Recentes** (lista dos últimos 5):
   - Usar dados de `api.deployment.allCentralized`
   - Cada item: nome do serviço + `StatusBadge` + tempo relativo
   - **Link CORRETO**: usar a mesma lógica `getServiceInfo()` do deploy history
     para gerar o href correto para a app/compose
   - `StaggerList` para animação de entrada
   - Se vazio: "Nenhum deploy recente" com ícone

4. **Projetos Grid** (últimos 6 projetos):
   - Mini card de cada projeto com ícone e contagem de serviços
   - Hover effect translate-y e shadow
   - **Link CORRETO**: `/dashboard/project/{projectId}/environment/{firstEnvId}`
   - "Ver todos" → link para `/dashboard/projects`

5. **Quick Actions**:
   - "Importar Repositório" → `/dashboard/deploy` (EXATO)
   - "Ver Projetos" → `/dashboard/projects` (EXATO)
   - "Histórico" → `/dashboard/deployments` (EXATO)
   - Cards com ícones e descrição curta, hover com scale

## Fase 3: Wiring
1. Editar a page do dashboard para usar o novo componente
2. Envolver em `PageTransition`

## Fase 4: Verificação E2E
```bash
cd dokploy/apps/dokploy && pnpm build 2>&1 | tail -20
```

**Checklist obrigatório pós-implementação:**
```
□ api.project.all query está presente e funcional?
□ api.deployment.allCentralized query está presente?
□ api.server.withSSHKey query está presente?
□ Link "Novo Deploy" aponta para /dashboard/deploy?
□ Link "Ver Projetos" aponta para /dashboard/projects?
□ Link "Histórico" aponta para /dashboard/deployments?
□ Links de projetos apontam para /dashboard/project/{id}/environment/{envId}?
□ Links de deploys recentes usam getServiceInfo() com paths corretos?
□ Nenhuma query inexistente é chamada?
□ Build passa sem erros TypeScript?
```

## Componentes a Importar
```tsx
import { PageTransition, FadeInUp, StaggerList, StaggerItem } from "@/components/atoms/animations/motion";
import { StatusPulse, EmptyProjectsIllustration, LoadingSkeleton } from "@/components/atoms/animations/animated-svgs";
import { StatusBadge } from "@/components/atoms/badges/status-badge";
import { TechIcon } from "@/components/atoms/icons/tech-icon";
```
