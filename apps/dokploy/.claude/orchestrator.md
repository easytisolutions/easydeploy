# 🎯 Orquestrador Principal – EasyDeploy UI Refactoring

> Cole este prompt inteiro no Claude Code para iniciar a refatoração completa.
> O orquestrador vai executar cada tarefa usando subagentes especializados.

---

## Prompt do Orquestrador

```
Você é o orquestrador de refatoração do EasyDeploy. 

ANTES DE QUALQUER COISA, leia estes 2 arquivos na ordem:
1. dokploy/apps/dokploy/CLAUDE.md  (contexto do projeto)
2. dokploy/apps/dokploy/.claude/e2e-flow-map.md  (mapa de fluxo E2E obrigatório)

Seu trabalho é executar as tarefas de refatoração UI na ordem correta, delegando 
para subagentes Explore quando precisar investigar, e implementando diretamente 
quando for código.

### REGRA FUNDAMENTAL: INTEGRIDADE BACKEND
Toda refatoração é APENAS visual/UX. O backend (tRPC) NÃO muda.
- NUNCA remover uma chamada tRPC existente
- NUNCA mudar parâmetros de mutations
- NUNCA alterar paths de navegação (router.push / Link href)
- NUNCA quebrar a sequência de deploy (project.create → app.create → saveProvider → saveEnv → saveBuild → deploy)
- SEMPRE rodar pnpm build após cada componente

### Estado Atual (atualizar conforme progresso)
- [x] Atoms: motion.tsx, tech-icon.tsx, animated-svgs.tsx, status-badge.tsx
- [x] Deploy Wizard V2 (2 passos, backend 100% compatível)
- [x] Projects Page V2 (grid animado, backend 100% compatível)
- [ ] Auto-Detecção Stack + Dockerfile obrigatório + bloquear criação fora do wizard
- [ ] Sidebar Refactoring (estilo EasyTI + categorias User/Admin)
- [ ] Deploy History Page V2 (timeline + tabela moderna)
- [ ] Application Detail Page (header com status animado)
- [ ] Dashboard Home (cards com métricas animadas)
- [ ] Build & Verificação E2E completa
- [ ] Deploy no servidor

### Regras de Execução
1. ANTES de cada tarefa, leia o arquivo `.claude/e2e-flow-map.md` para lembrar do fluxo
2. ANTES de cada tarefa, use subagente Explore para ler os componentes originais COMPLETOS
3. Crie os novos componentes em `components/features/{domínio}/components/`
4. Mantenha os componentes originais em `components/dashboard/` intactos
5. Atualize apenas o import na page para apontar para o novo componente  
6. A SIDEBAR é editada in-place (não criar arquivo novo)
7. Após cada componente, rode `pnpm build` no diretório dokploy/apps/dokploy
8. Use a todo list para rastrear progresso
9. Após cada tarefa, VERIFIQUE o checklist do agente antes de prosseguir

### Sequência de Tarefas

**TAREFA 1: Auto-Detecção Stack + Dockerfile + Bloquear criação fora do Wizard**
Leia .claude/agents/07-auto-detect-dockerfile.md e execute.
Auto-detectar stack lendo arquivos do repo, gerar Dockerfile se não existir, buildType SEMPRE "dockerfile", remover HandleProject da tela de projetos (criar só pelo wizard).

**TAREFA 2: Sidebar Refactoring** ← (afeta navegação global)
Leia .claude/agents/06-sidebar-refactor.md e execute.
Separar menu em User/Admin, ocultar admin para non-owner, estilo EasyTI.

**TAREFA 3: Deploy History V2**
Leia .claude/agents/01-deploy-history.md e execute.
ATENÇÃO: manter api.deployment.allCentralized com refetchInterval: 5000.

**TAREFA 4: Application Detail V2** 
Leia .claude/agents/02-application-detail.md e execute.
ATENÇÃO: este é o destino do redirect pós-deploy. Se quebrar, o fluxo inteiro quebra.

**TAREFA 5: Dashboard Home V2**
Leia .claude/agents/03-dashboard-home.md e execute.
ATENÇÃO: usar APENAS queries que existem (project.all, deployment.allCentralized, server.withSSHKey).

**TAREFA 6: Build & Verificação E2E**
Leia .claude/agents/04-build-qa.md e execute.
Verificar: build, todas tRPC calls, todos paths de navegação, fluxo E2E completo.

**TAREFA 7: Deploy no Servidor**
Leia .claude/agents/05-deploy-server.md e execute.
PEDIR CONFIRMAÇÃO antes de push e deploy.

### Verificação de Fluxo Entre Tarefas
Após completar as tarefas 1-5, verificar este fluxo ANTES da tarefa 6:

1. Dashboard Home → click "Novo Deploy" → /dashboard/deploy → Deploy Wizard funciona?
2. Deploy Wizard → deploy com sucesso → redirect /dashboard/project/{id}/services/application/{id} → App Detail funciona?
3. Dashboard Home → click "Projetos" → /dashboard/projects → Projects Page funciona?
4. Projects Page → click projeto → /dashboard/project/{id}/environment/{id} → Routing funciona?
5. Dashboard Home → click "Histórico" → /dashboard/deployments → Deploy History funciona?
6. Deploy History → click "Open" → /dashboard/project/{id}/environment/{id}/services/... → Routing funciona?
7. Sidebar → TODOS os links da seção User navegam corretamente?
8. Sidebar → Seção Admin oculta para member? Visível para owner?

Comece pela primeira tarefa não completa. Após cada tarefa, atualize o estado 
e pergunte ao usuário se quer continuar para a próxima ou revisar.
```
