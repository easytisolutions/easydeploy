# Agente 2: Application Detail V2

## ⚠️ LEITURA OBRIGATÓRIA ANTES DE COMEÇAR
**Leia o arquivo `.claude/e2e-flow-map.md` INTEIRO antes de implementar qualquer coisa.**
Este é o componente que o usuário vê APÓS o deploy wizard completar.
O redirect pós-deploy é: `/dashboard/project/{projectId}/services/application/{applicationId}`
Se este componente quebrar, TODO o fluxo de deploy fica sem feedback visual.

## Objetivo
Modernizar o header da página de detalhe de aplicação com status animado,
badges de tecnologia, e informações de deploy em tempo real.
MANTER 100% da funcionalidade backend (redeploy, queries, permissões).

## Fase 1: Exploração (Subagente Explore)
```
Use subagente Explore com thoroughness "thorough" para:
1. Ler dokploy/apps/dokploy/pages/dashboard/project/[projectId]/services/application/[applicationId].tsx
   - ATENÇÃO: pode estar em /[projectId]/ ou /environment/[envId]/ — buscar o path correto
2. Ler dokploy/apps/dokploy/components/dashboard/application/ (listar TODOS os arquivos)
3. Ler o componente principal de header/overview da aplicação
4. Listar TODAS as chamadas tRPC:
   - api.application.one (dados da app)
   - api.application.deploy (redeploy)
   - api.application.update (atualizar configs)
   - api.deployment.* (histórico de deploys da app)
   - Quaisquer outras
5. Listar TODOS os links de navegação (Link, router.push)
6. Listar TODOS os props passados para componentes filhos
7. Retornar: estrutura completa, cada query/mutation, cada navegação
```

## Fase 2: Implementação

### Arquivo: `components/features/deploy/components/application-header-v2.tsx`

### 🔴 REGRAS DE INTEGRIDADE BACKEND (OBRIGATÓRIO)
1. **Query principal**: `api.application.one` com o `applicationId` correto
   - Esta query retorna TODOS os dados da aplicação (nome, provider, status, domínios, etc)
2. **Mutation redeploy**: `api.application.deploy({ applicationId })`
   - DEVE funcionar. Este é o botão mais usado pelo usuário.
   - Deve mostrar loading state durante o deploy
   - Deve atualizar o StatusPulse após o deploy
3. **Permissões**: Verificar se o usuário tem permissão de deploy antes de mostrar botão
4. **Props para filhos**: NÃO quebrar os props que a page passa para tabs/conteúdo abaixo
5. **Este componente é APENAS o header** — não substituir a page inteira

### Requisitos Visuais:
1. **Hero Header**:
   - `StatusPulse` grande (size 16px) ao lado do nome da aplicação
   - `TechIcon` da stack detectada (se disponível no buildType)
   - `ProviderIcon` do source provider (github/gitlab/bitbucket/git/docker)
   - Nome do repositório como link externo
   - Branch com ícone GitBranch
   - Última data de deploy como "há X minutos/horas"

2. **Quick Actions Bar**:
   - Botão "Redeploy" com `DeployRocketAnimation` inline (mini, 24px)
   - Botão "Configurações" 
   - Dropdown de mais ações
   - **O Redeploy DEVE chamar `api.application.deploy`** — não pode ser só visual

3. **Status Cards Row** (mini cards horizontais):
   - Card "Status" com StatusPulse + label (Running/Stopped/Building)
   - Card "Deploys" com contagem total
   - Card "Último Deploy" com timestamp relativo
   - Card "Domínio" com link externo se disponível
   - Cada card com `FadeInUp` staggered

4. **Animações**:
   - `PageTransition` no wrapper
   - Header fade in suave
   - Cards com stagger de 100ms
   - Status pulse em tempo real

## Fase 3: Wiring
1. Identificar EXATAMENTE onde o header atual é renderizado na page
2. Substituir APENAS o header, mantendo tabs/conteúdo existentes intactos
3. **TESTAR**: o componente recebe as props necessárias?

**ATENÇÃO na integração:**
- O deploy wizard redireciona para esta page após deploy com sucesso
- Se o applicationId não for passado corretamente, a page quebra
- Verificar que `router.query.applicationId` é capturado pelo Next.js

## Fase 4: Verificação E2E
```bash
cd dokploy/apps/dokploy && pnpm build 2>&1 | tail -20
```

**Checklist obrigatório pós-implementação:**
```
□ api.application.one query funciona com applicationId da URL?
□ api.application.deploy mutation funciona no botão Redeploy?
□ StatusPulse reflete o status real da aplicação?
□ ProviderIcon mostra o provider correto (github/gitlab/etc)?
□ O componente NÃO quebra os tabs/conteúdo abaixo?
□ As props são compatíveis com a page pai?
□ O fluxo completo funciona: Deploy Wizard → redirect → esta page mostra a app?
□ Build passa sem erros TypeScript?
```
