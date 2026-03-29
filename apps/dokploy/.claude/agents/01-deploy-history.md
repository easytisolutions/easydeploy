# Agente 1: Deploy History V2

## ⚠️ LEITURA OBRIGATÓRIA ANTES DE COMEÇAR
**Leia o arquivo `.claude/e2e-flow-map.md` INTEIRO antes de implementar qualquer coisa.**
Ele contém o mapa de fluxo completo, todas as chamadas tRPC obrigatórias, e as regras de integridade.

## Objetivo
Refatorar a página de histórico de deploys para ter visual moderno com animações,
MANTENDO 100% da integração backend e navegação entre telas.

## Fase 1: Exploração (Subagente Explore)
```
Use subagente Explore com thoroughness "thorough" para:
1. Ler dokploy/apps/dokploy/pages/dashboard/deployments.tsx
2. Ler dokploy/apps/dokploy/components/dashboard/deployments/show-deployments-table.tsx COMPLETO
3. Ler dokploy/apps/dokploy/components/dashboard/deployments/show-queue-table.tsx COMPLETO
4. Listar TODAS as chamadas tRPC (api.deployment.*, api.*)
5. Listar TODOS os Links/router.push e seus paths exatos
6. Listar TODOS os tipos TypeScript (DeploymentRow, getServiceInfo, statusVariants)
7. Retornar: estrutura completa com CADA chamada tRPC e CADA navegação
```

## Fase 2: Implementação

### Arquivo: `components/features/deployments/components/show-deployments-v2.tsx`

### 🔴 REGRAS DE INTEGRIDADE BACKEND (OBRIGATÓRIO)
Antes de escrever qualquer código, confirme que o componente CONTÉM:

1. **Query obrigatória**: `api.deployment.allCentralized.useQuery(undefined, { refetchInterval: 5000 })`
   - O `refetchInterval: 5000` é OBRIGATÓRIO (atualização em tempo real)
   - Sem ele, o usuário não verá deploys novos aparecendo
2. **Função `getServiceInfo()`**: COPIAR EXATAMENTE do original. Gera os links de navegação.
3. **Navegação "Open"**: Link `href={info.href}` onde href é:
   - App: `/dashboard/project/${projectId}/environment/${envId}/services/application/${appId}`
   - Compose: `/dashboard/project/${projectId}/environment/${envId}/services/compose/${composeId}`
   - Estes paths são os MESMOS para onde o Deploy Wizard redireciona pós-deploy
4. **Tab routing**: `router.query.tab` com `router.replace()` para trocar entre tabs
5. **Tipo DeploymentRow**: `inferRouterOutputs<AppRouter>["deployment"]["allCentralized"][number]`
6. **Status mapping**: `statusVariants` record com running/done/error/cancelled

### Requisitos Visuais:
1. Importar e usar componentes de `@/components/atoms/`:
   - `PageTransition`, `StaggerList`, `StaggerItem`, `FadeIn` de `animations/motion`
   - `StatusPulse` de `animations/animated-svgs`
   - `StatusBadge` de `badges/status-badge`
   - `EmptyProjectsIllustration`, `LoadingSkeleton` de `animations/animated-svgs`

2. **Header da página**:
   - Ícone Rocket com gradiente easyti-primary
   - Título "Histórico de Deploys"  
   - Subtítulo "Acompanhe todos os deploys dos seus projetos"
   - Tabs animados (Deploys | Fila) com indicador de tab ativa deslizante

3. **Filtros** (MANTER TODA lógica existente):
   - Search input com ícone Search (globalFilter + setGlobalFilter)
   - Select de status com StatusPulse (statusFilter)
   - Select de tipo Application/Compose (typeFilter)
   - A lógica de `filteredData = useMemo(...)` deve ser IDÊNTICA ao original

4. **Tabela** (MANTER @tanstack/react-table):
   - COPIAR a definição de `columns` inteira do original (todas 8 colunas)
   - COPIAR `useReactTable()` config exatamente
   - Adicionar `StaggerItem` wrapper nas TableRows para animação
   - Substituir Badge de status por `StatusBadge`
   - Hover: `hover:bg-muted/50 transition-colors`
   - Coluna "Open": MANTER o Link com `href={info.href}` exato

5. **Empty State**: "Nenhum deploy encontrado" com `EmptyProjectsIllustration`
6. **Loading State**: `LoadingSkeleton` com 5 rows
7. **Paginação**: COPIAR lógica existente (pageSize, pageIndex, previousPage, nextPage)

## Fase 3: Wiring
1. Editar `pages/dashboard/deployments.tsx`:
   - Trocar imports para novos componentes
   - Envolver em `PageTransition`
   - MANTER a lógica de tabs (router.query.tab)
2. NÃO deletar componentes originais

## Fase 4: Verificação Backend + Build
```bash
cd dokploy/apps/dokploy && pnpm build 2>&1 | tail -20
```

**Checklist obrigatório pós-implementação:**
```
□ api.deployment.allCentralized com refetchInterval: 5000 está presente?
□ getServiceInfo() gera os paths corretos para app E compose?
□ Link "Open" aponta para /dashboard/project/{id}/environment/{id}/services/...?
□ Tab routing funciona (router.query.tab + router.replace)?
□ Tipo DeploymentRow está correto (inferRouterOutputs)?
□ filteredData filtra por status, type E globalFilter?
□ Paginação funciona (pageSize selector + prev/next)?
□ Loading state exibe durante isLoading?
□ Build passa sem erros TypeScript?
```

## Padrão de Referência
- `show-projects-v2.tsx` para padrão de atoms + animações
- `show-deployments-table.tsx` (ORIGINAL) para toda lógica backend - COPIAR, não reescrever
