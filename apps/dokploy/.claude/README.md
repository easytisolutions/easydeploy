# 🤖 EasyDeploy – Sistema de Agentes Claude Code

Sistema de orquestração para refatoração UI do EasyDeploy usando recursos nativos do Claude Code (VS Code Copilot Chat + Claude CLI).

## 📁 Estrutura

```
dokploy/apps/dokploy/
├── CLAUDE.md                          ← Contexto global (lido automaticamente pelo Claude)
└── .claude/
    ├── orchestrator.md                ← Prompt do orquestrador principal
    ├── e2e-flow-map.md                ← Mapa de fluxo E2E (referência obrigatória)
    ├── prompts.md                     ← Prompts rápidos para tarefas individuais
    └── agents/
        ├── 01-deploy-history.md       ← Agente: Refatorar histórico de deploys
        ├── 02-application-detail.md   ← Agente: Refatorar header de aplicação
        ├── 03-dashboard-home.md       ← Agente: Refatorar homepage do dashboard
        ├── 04-build-qa.md             ← Agente: Build, QA e verificação E2E
        ├── 05-deploy-server.md        ← Agente: Deploy no servidor
        ├── 06-sidebar-refactor.md     ← Agente: Sidebar EasyTI + categorias User/Admin
        └── 07-auto-detect-dockerfile.md ← Agente: Auto-detect stack + Dockerfile + bloquear criação fora wizard
```

## 🚀 Como Usar

### Opção 1: Orquestrador Completo (recomendado)

Executa todas as tarefas em sequência com paradas para revisão.

**No VS Code (Copilot Chat com Claude):**
1. Abra o Copilot Chat (`Ctrl+L` ou `Cmd+L`)
2. Copie e cole o conteúdo de `.claude/orchestrator.md` (a parte dentro do bloco de código)
3. O Claude vai:
   - Ler o `CLAUDE.md` automaticamente para contexto
   - Executar cada tarefa na ordem
   - Usar subagentes Explore para investigar código
   - Parar após cada tarefa e perguntar se quer continuar

**No Claude Code CLI:**
```bash
# Navegar até o diretório do app
cd dokploy/apps/dokploy

# Opção A: Cole o prompt do orchestrator.md diretamente
claude

# Opção B: Pipe o prompt
cat .claude/orchestrator.md | claude
```

### Opção 2: Tarefa Individual

Execute apenas uma tarefa específica.

**No VS Code (Copilot Chat):**
1. Abra `.claude/agents/01-deploy-history.md` (ou qualquer outro agente)
2. Copie o conteúdo e cole no chat com prefixo:
```
Leia o CLAUDE.md em dokploy/apps/dokploy/ e execute as instruções abaixo:

[COLE O CONTEÚDO DO ARQUIVO DE AGENTE AQUI]
```

### Opção 3: Prompts Rápidos

Para tarefas pontuais sem necessidade do fluxo completo.

1. Abra `.claude/prompts.md`
2. Escolha o prompt adequado:
   - 🔍 **Explorar Componente** – investigar antes de refatorar
   - 🎨 **Criar Novo Atom** – criar componente atômico
   - 🔄 **Refatorar Página** – modernizar uma página existente
   - 🐛 **Corrigir Build** – rodar build e corrigir erros
   - 🚀 **Deploy Completo** – pipeline git + servidor
   - 🏗️ **Criar Feature** – feature completa do zero
3. Substitua os placeholders `[...]` e cole no chat

## 🧠 Como Funciona

### CLAUDE.md (Contexto Automático)
O arquivo `CLAUDE.md` na raiz do app é lido automaticamente pelo Claude Code CLI. No VS Code, os agentes instruem o Claude a lê-lo. Contém:
- Stack técnica completa
- Estrutura de diretórios
- Convenções de código
- Cores e design tokens
- tRPC routes disponíveis

### Subagentes Explore
Cada agente usa subagentes `Explore` para investigar código antes de implementar:
- **Quick**: busca rápida de um arquivo ou pattern
- **Medium**: investigação de 3-5 arquivos relacionados
- **Thorough**: análise profunda de um domínio inteiro

### Padrão de Implementação
Todos os agentes seguem o mesmo fluxo:
1. **Ler e2e-flow-map.md** → entender fluxo e chamadas backend obrigatórias
2. **Explorar** → subagente lê componentes existentes
3. **Implementar** → cria novo componente em `features/` (ou edita in-place para sidebar)
4. **Wire** → atualiza import na page
5. **Verificar backend** → confirmar que TODAS tRPC calls e paths de navegação estão presentes
6. **Build** → `pnpm build` para garantir que compila

### Segurança
- Componentes originais NUNCA são deletados (exceto sidebar que é editada in-place)
- Integração backend NUNCA é modificada (apenas visual/UX)
- Deploy no servidor requer confirmação explícita
- Build verification antes de qualquer push
- Checklist E2E obrigatório após cada componente

## 📊 Estado da Refatoração

| # | Tarefa | Status | Agente |
|---|--------|--------|--------|
| 0 | Atoms (motion, icons, svgs, badge) | ✅ Pronto | Manual |
| 1 | Deploy Wizard V2 (2 passos) | ✅ Pronto | Manual |
| 2 | Projects Page V2 (grid animado) | ✅ Pronto | Manual |
| 3 | Auto-Detect Stack + Dockerfile + Bloquear criação | ⬜ Pendente | `07-auto-detect-dockerfile.md` |
| 4 | Sidebar EasyTI (categorias User/Admin) | ⬜ Pendente | `06-sidebar-refactor.md` |
| 5 | Deploy History V2 | ⬜ Pendente | `01-deploy-history.md` |
| 6 | Application Detail V2 | ⬜ Pendente | `02-application-detail.md` |
| 7 | Dashboard Home V2 | ⬜ Pendente | `03-dashboard-home.md` |
| 8 | Build & QA E2E | ⬜ Pendente | `04-build-qa.md` |
| 9 | Deploy Servidor | ⬜ Pendente | `05-deploy-server.md` |

## 💡 Dicas

### Parar no meio
Se o Claude parar ou a sessão cair, basta reabrir e colar:
```
Continue a refatoração do EasyDeploy. Leia o CLAUDE.md e o orchestrator.md  
para ver o estado atual. A última tarefa completada foi [X].
Continue a partir da tarefa [Y].
```

### Adicionar nova tarefa
1. Crie um arquivo `.claude/agents/06-nova-tarefa.md` seguindo o pattern dos existentes
2. Adicione a referência no `orchestrator.md`
3. Atualize a tabela de estado neste README

### Customizar um agente
Cada arquivo de agente é independente. Edite livremente os requisitos em qualquer
arquivo `.claude/agents/*.md` para ajustar o resultado antes de executar.

### Ver componentes de referência
Os melhores exemplos para entender o padrão desejado:
- **Wizard**: `components/features/deploy/components/deploy-wizard-v2.tsx`
- **Grid Page**: `components/features/projects/components/show-projects-v2.tsx`
- **Animations**: `components/atoms/animations/animated-svgs.tsx`
- **Icons**: `components/atoms/icons/tech-icon.tsx`
