# Agente 4: Build, QA & Verificação E2E

## ⚠️ LEITURA OBRIGATÓRIA
**Leia `.claude/e2e-flow-map.md` INTEIRO.** Este é o agente mais crítico.
Ele garante que TUDO funciona ponta a ponta antes de ir para produção.

## Objetivo
Verificar compilação, integridade backend, navegação entre telas e fluxo E2E completo.

---

## Fase 1: Build Completo
```bash
cd dokploy/apps/dokploy && pnpm build 2>&1 | tail -50
```

Se houver erros, corrigir na ordem:
1. **Import errors** → `@/components/...` path correto?
2. **Type errors** → `inferRouterOutputs<AppRouter>` correto?
3. **Module not found** → arquivo existe no path?
4. **JSX errors** → `"use client"` no topo?
5. **Unused vars** → remover ou prefixar com `_`

**LOOP**: corrigir → build → corrigir → build até 0 erros.

---

## Fase 2: Verificação de Integridade Backend (tRPC)

### 2.1 Deploy Wizard (`deploy-wizard-v2.tsx`)
Use subagente Explore para verificar:
```
Leia components/features/deploy/components/deploy-wizard-v2.tsx e CONFIRME que 
TODAS estas chamadas tRPC existem no código:

MUTATIONS (10 obrigatórias):
1. api.project.create.useMutation()
2. api.application.create.useMutation()
3. api.application.saveGithubProvider.useMutation()
4. api.application.saveGitlabProvider.useMutation()
5. api.application.saveBitbucketProvider.useMutation()
6. api.application.saveGitProvider.useMutation()
7. api.application.saveDockerProvider.useMutation()
8. api.application.saveBuildType.useMutation()
9. api.application.saveEnvironment.useMutation()
10. api.application.deploy.useMutation()

QUERIES (11 obrigatórias):
1. api.github.githubProviders.useQuery()
2. api.github.getGithubRepositories.useQuery()
3. api.github.getGithubBranches.useQuery()
4. api.gitlab.gitlabProviders.useQuery()
5. api.gitlab.getGitlabRepositories.useQuery()
6. api.gitlab.getGitlabBranches.useQuery()
7. api.bitbucket.bitbucketProviders.useQuery()
8. api.bitbucket.getBitbucketRepositories.useQuery()
9. api.bitbucket.getBitbucketBranches.useQuery()
10. api.server.withSSHKey.useQuery()
11. api.settings.isCloud.useQuery()

SEQUÊNCIA DE DEPLOY (ordem EXATA):
project.create → application.create → save{Provider}Provider → saveEnvironment → saveBuildType → deploy

REDIRECT PÓS-DEPLOY:
router.push(`/dashboard/project/${projectId}/services/application/${applicationId}`)

Retorne: PRESENTE ou AUSENTE para cada item, e a sequência de deploy.
```

### 2.2 Projects Page (`show-projects-v2.tsx`)
```
Leia components/features/projects/components/show-projects-v2.tsx e CONFIRME:

QUERIES:
1. api.project.all.useQuery()
2. api.user.get.useQuery()
3. api.user.getPermissions.useQuery()  (ou equivalente canCreate/canDelete)
4. api.tag.all.useQuery()

MUTATIONS:
5. api.project.remove.useMutation()

NAVEGAÇÃO:
- Click projeto → /dashboard/project/{projectId}/environment/{envId}
- Botão "Novo Deploy" → /dashboard/deploy
- Permissões: canCreate verificado antes de mostrar botão criar
- Permissões: canDelete verificado antes de mostrar botão deletar
```

### 2.3 Deploy History (`show-deployments-v2.tsx`)
```
Leia components/features/deployments/components/show-deployments-v2.tsx e CONFIRME:

QUERIES:
1. api.deployment.allCentralized.useQuery(undefined, { refetchInterval: 5000 })
   - refetchInterval: 5000 OBRIGATÓRIO

NAVEGAÇÃO:
- Botão "Open" → /dashboard/project/{id}/environment/{envId}/services/application/{appId}
- Tabs: router.query.tab com router.replace()

LÓGICA:
- getServiceInfo() gera paths corretos para Application E Compose
- filteredData filtra por status + type + globalFilter
- Paginação com pageSize selector + prev/next
```

### 2.4 Application Header (`application-header-v2.tsx`)
```
Leia components/features/deploy/components/application-header-v2.tsx e CONFIRME:

QUERIES:
1. api.application.one (dados da app)

MUTATIONS:
2. api.application.deploy (botão Redeploy)

PROPS:
- Recebe applicationId corretamente
- Não quebra tabs/conteúdo abaixo
```

### 2.5 Dashboard Home (`dashboard-home-v2.tsx`)
```
Leia components/features/dashboard/components/dashboard-home-v2.tsx e CONFIRME:

QUERIES (apenas existentes):
1. api.project.all
2. api.deployment.allCentralized
3. api.server.withSSHKey

NAVEGAÇÃO:
- "Novo Deploy" → /dashboard/deploy
- "Ver Projetos" → /dashboard/projects
- "Histórico" → /dashboard/deployments
- Click projeto → /dashboard/project/{id}/environment/{envId}
- Click deploy → path correto via getServiceInfo()
```

---

## Fase 3: Verificação de Navegação E2E (Fluxo Completo)

### Fluxo 1: Novo Deploy
```
1. Dashboard Home: click "Novo Deploy" → /dashboard/deploy ✓
2. Deploy Wizard Step 1: seleciona provider + repo + branch
3. Deploy Wizard Step 2: configura stack + env vars + deploy
4. Após deploy: redirect para /dashboard/project/{id}/services/application/{id} ✓
5. Application Detail: mostra status da app com StatusPulse
```
**Verificar**: O redirect do step 4 aponta para um path que EXISTE no Pages Router?

### Fluxo 2: Ver Projetos → Acessar App
```
1. Dashboard Home: click "Ver Projetos" → /dashboard/projects ✓
2. Projects Page: click no projeto → /dashboard/project/{id}/environment/{envId} ✓
3. Project Environment: click na aplicação → /dashboard/project/{id}/services/application/{id}
```
**Verificar**: Os paths gerados na Projects Page correspondem a pages existentes?

### Fluxo 3: Histórico de Deploys
```
1. Dashboard Home: click "Histórico" → /dashboard/deployments ✓
2. Deploy History: click "Open" em um deploy → /dashboard/project/{id}/environment/{id}/services/... ✓
```
**Verificar**: O path gerado por getServiceInfo() é o mesmo do fluxo 1?

### Fluxo 4: Redeploy
```
1. Application Detail: click "Redeploy"
2. api.application.deploy mutation é chamada
3. StatusPulse muda para "building"
4. Após deploy: status muda para "running" ou "error"
```
**Verificar**: A mutation está wired corretamente no botão?

---

## Fase 4: Verificação de Pages (imports atualizados)

Use subagente Explore para confirmar:
```
Para cada page, confirme que o import aponta para o componente V2 correto:

1. pages/dashboard/deploy.tsx → import de features/deploy/components/deploy-wizard-v2
2. pages/dashboard/projects.tsx → import de features/projects/components/show-projects-v2
3. pages/dashboard/deployments.tsx → import de features/deployments/components/show-deployments-v2
4. pages/dashboard/index.tsx → import de features/dashboard/components/dashboard-home-v2
5. Application page → import de features/deploy/components/application-header-v2

Se algum import ainda aponta para components/dashboard/ (legado), ATUALIZAR.
```

---

## Fase 5: Checklist de Atoms

```
Verificar que todos os atoms exportam o que é usado pelos features:

□ motion.tsx exports: FadeIn, FadeInUp, PageTransition, StaggerList, StaggerItem, staggerContainer, staggerItem
□ tech-icon.tsx exports: TechIcon, ProviderIcon
□ animated-svgs.tsx exports: DeployRocketAnimation, StatusPulse, BuildProgressAnimation, 
  EmptyProjectsIllustration, LoadingSkeleton, SuccessCheckmark, TechScannerAnimation
□ status-badge.tsx exports: StatusBadge
```

---

## Fase 6: Build Final
```bash
cd dokploy/apps/dokploy && pnpm build 2>&1
```
Build DEVE completar sem erros. Warnings são aceitáveis.

---

## Fase 7: Relatório Final

Gerar relatório com:

### Componentes
| Componente | Status | tRPC OK | Nav OK | Build OK |
|-----------|--------|---------|--------|----------|
| deploy-wizard-v2 | ✅/❌ | 21/21 | ✅/❌ | ✅/❌ |
| show-projects-v2 | ✅/❌ | 5/5 | ✅/❌ | ✅/❌ |
| show-deployments-v2 | ✅/❌ | 1/1 | ✅/❌ | ✅/❌ |
| application-header-v2 | ✅/❌ | 2/2 | ✅/❌ | ✅/❌ |
| dashboard-home-v2 | ✅/❌ | 3/3 | ✅/❌ | ✅/❌ |

### Fluxos E2E
| Fluxo | Status |
|-------|--------|
| Novo Deploy (wizard → app detail) | ✅/❌ |
| Projetos → App Detail | ✅/❌ |
| Histórico → App Detail | ✅/❌ |
| Redeploy (botão) | ✅/❌ |

### Problemas Encontrados e Corrigidos
- [listar cada problema e como foi resolvido]

### Status Final
- Build: PASS / FAIL
- tRPC: X/32 chamadas verificadas
- Navegação: X/X paths verificados
