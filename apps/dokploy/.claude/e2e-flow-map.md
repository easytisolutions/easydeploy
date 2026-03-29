# EasyDeploy – Mapa de Fluxo End-to-End

> Este documento é a referência obrigatória para TODOS os agentes de refatoração.
> Garante que toda a integração backend e navegação entre telas funcione ponta a ponta.

## Sidebar – Navegação Global

A sidebar (`components/layouts/side.tsx`) é compartilhada por TODAS as pages.
Está dividida em duas categorias:

### Seção "Usuário" (todos os perfis: owner, admin, member)
```
Projetos          → /dashboard/projects
Novo Deploy       → /dashboard/deploy
Histórico         → /dashboard/deployments       [IF: deployment.read]
Perfil            → /dashboard/settings/profile
Git Providers     → /dashboard/settings/git-providers  [IF: gitProviders.read]
SSH Keys          → /dashboard/settings/ssh-keys       [IF: sshKeys.read]
Registry          → /dashboard/settings/registry       [IF: registry.read]
```

### Seção "Administração" (apenas owner + admin)
```
Web Server, Remote Servers, Monitoring, Docker, Swarm, Traefik,
Usuários, Schedules, Audit Logs, Tags, Notificações,
S3 Destinations, Certificates, Cluster, Requests,
AI, SSO, Billing (owner+cloud), License (owner), Whitelabeling (owner+!cloud)
```

### Queries tRPC da Sidebar (OBRIGATÓRIO manter)
```
api.user.get                    → role, user data
api.user.getPermissions         → permissions object
api.user.session                → session data
api.user.getInvitations         → invitation bell
api.settings.isCloud            → cloud mode
api.settings.getDokployVersion  → version badge
api.whitelabeling.get           → custom branding
api.organization.all            → org switcher
api.organization.active         → current org
api.organization.delete         → delete org (mutation)
api.organization.setDefault     → set default org (mutation)
authClient.organization.setActive         → switch org (better-auth)
authClient.organization.acceptInvitation  → accept invite (better-auth)
```

## Fluxo Principal do Usuário

```
┌─────────────────────┐
│  Dashboard Home     │ /dashboard
│  (métricas, atalhos)│
└─────────┬───────────┘
          │ Click "Novo Deploy" ou "Ver Projetos"
          ▼
┌─────────────────────┐     Click "Novo Deploy"     ┌──────────────────────┐
│  Projects Page      │ ──────────────────────────▶  │  Deploy Wizard       │
│  /dashboard/projects│                              │  /dashboard/deploy   │
└─────────┬───────────┘                              └──────────┬───────────┘
          │ Click no projeto                                    │ Deploy com sucesso
          ▼                                                     ▼
┌─────────────────────┐                              ┌──────────────────────┐
│  Project Environment│                              │  Application Detail  │
│  /dashboard/project/│                              │  /dashboard/project/ │
│  {projectId}/       │ ────────────────────────────▶│  {projectId}/services│
│  environment/{envId}│  Click na aplicação          │  /application/{appId}│
└─────────────────────┘                              └──────────────────────┘
          │                                                     │
          │ Menu lateral "Deployments"                          │ Tab "Deployments"
          ▼                                                     ▼
┌─────────────────────┐                              ┌──────────────────────┐
│  Deploy History     │                              │  App Deploy Logs     │
│  /dashboard/        │                              │  (dentro do detalhe) │
│  deployments        │                              │                      │
└─────────────────────┘                              └──────────────────────┘
```

## Chamadas tRPC por Tela (OBRIGATÓRIO manter)

### 1. Deploy Wizard (`deploy-wizard-v2.tsx`)
**Queries (leitura) – TODAS obrigatórias:**
| Query | Finalidade | Quando é chamada |
|-------|-----------|-----------------|
| `api.github.githubProviders` | Listar contas GitHub conectadas | Ao selecionar provider GitHub |
| `api.github.getGithubRepositories` | Listar repos do GitHub | Após selecionar conta GitHub |
| `api.github.getGithubBranches` | Listar branches | Após selecionar repo GitHub |
| `api.gitlab.gitlabProviders` | Listar contas GitLab conectadas | Ao selecionar provider GitLab |
| `api.gitlab.getGitlabRepositories` | Listar repos do GitLab | Após selecionar conta GitLab |
| `api.gitlab.getGitlabBranches` | Listar branches | Após selecionar repo GitLab |
| `api.bitbucket.bitbucketProviders` | Listar contas Bitbucket | Ao selecionar provider Bitbucket |
| `api.bitbucket.getBitbucketRepositories` | Listar repos Bitbucket | Após selecionar conta Bitbucket |
| `api.bitbucket.getBitbucketBranches` | Listar branches | Após selecionar repo Bitbucket |
| `api.server.withSSHKey` | Listar servidores disponíveis | Step 2 (configuração) |
| `api.settings.isCloud` | Verificar se é ambiente cloud | Montagem do componente |

**Mutations (escrita) – Sequência EXATA de deploy:**
```
1. api.project.create({ name, description? })
   → Retorna: { projectId }
   → Internamente cria environment padrão

2. api.application.create({ name, projectId })
   → Retorna: { applicationId, projectId }

3. api.application.save{Provider}Provider(...)
   Uma das 5 opções:
   ├─ saveGithubProvider({ applicationId, githubId, repository, owner, branch, buildPath? })
   ├─ saveGitlabProvider({ applicationId, gitlabId, repository, owner, branch, gitlabPathNamespace? })
   ├─ saveBitbucketProvider({ applicationId, bitbucketId, repository, owner, branch })
   ├─ saveGitProvider({ applicationId, customGitUrl, customGitBranch })
   └─ saveDockerProvider({ applicationId, dockerImage, username?, password? })

4. api.application.saveEnvironment({ applicationId, env?, buildArgs? })
   → Salva variáveis de ambiente e build args

5. api.application.saveBuildType({ applicationId, buildType: "dockerfile", dockerfile? })
   → buildType: SEMPRE "dockerfile" (wizard não usa mais nixpacks/heroku/paketo/railpack)
   → dockerfile: null = usar Dockerfile do repo | string = conteúdo gerado automaticamente
   → ANTES do saveBuildType: wizard detecta stack lendo arquivos do repo via API
   → Se repo tem Dockerfile → usa existente (dockerfile: null)
   → Se repo NÃO tem Dockerfile → gera com generateDockerfileContent() (dockerfile: conteúdo)

6. api.application.deploy({ applicationId })
   → Inicia o pipeline de deploy
   → Retorna imediatamente (deploy é assíncrono)
```

**Queries de detecção de stack (novas, chamadas no Step 2 do wizard):**
```
api.github.getGithubRepoFiles({ githubId, owner, repo, branch })   → lista arquivos do repo
api.github.getGithubFileContent({ githubId, owner, repo, branch, filePath })  → lê Dockerfile existente
api.gitlab.getGitlabRepoFiles({ gitlabId, repoId, branch })        → mesma coisa para GitLab
api.gitlab.getGitlabFileContent({ gitlabId, repoId, branch, filePath })  → mesma coisa para GitLab
```

**Redirect pós-deploy:**
```typescript
// Após 2000ms do deploy iniciado com sucesso:
router.push(`/dashboard/project/${projectId}/services/application/${applicationId}`)
```

### 2. Projects Page (`show-projects-v2.tsx`)
| Chamada | Tipo | Finalidade |
|---------|------|-----------|
| `api.project.all` | Query | Listar todos os projetos |
| `api.user.get` | Query | Obter usuário atual |
| `api.user.getPermissions` | Query | Verificar permissões (criar/deletar) |
| `api.tag.all` | Query | Listar tags para filtro |
| `api.project.remove` | Mutation | Deletar projeto |

**Navegação:**
- Click no projeto → `/dashboard/project/{projectId}/environment/{environmentId}`
- Botão "Novo Deploy" → `/dashboard/deploy`
- **NÃO existe mais criação direta de projeto (HandleProject removido)** — toda criação passa pelo wizard

### 3. Deploy History (`deployments.tsx`)
| Chamada | Tipo | Finalidade |
|---------|------|-----------|
| `api.deployment.allCentralized` | Query (refetch 5s) | Listar todos os deploys |

**Navegação:**
- Botão "Open" no deploy → `/dashboard/project/{projectId}/environment/{envId}/services/application/{appId}`
- Tabs: "deployments" | "queue" via `router.query.tab`

### 4. Application Detail (page existente)
| Chamada | Tipo | Finalidade |
|---------|------|-----------|
| `api.application.one` | Query | Dados da aplicação |
| `api.deployment.*` | Query | Deploys da aplicação |

### 5. Dashboard Home (a ser criado)
| Chamada | Tipo | Finalidade |
|---------|------|-----------|
| `api.project.all` | Query | Contagem de projetos |
| `api.deployment.allCentralized` | Query | Deploys recentes |
| `api.server.withSSHKey` | Query | Contagem de servidores |

## Tipos TypeScript Críticos

```typescript
// DeployConfig – Estado do wizard (NUNCA modificar a interface)
interface DeployConfig {
  source: "github" | "gitlab" | "bitbucket" | "git" | "docker";
  // GitHub
  githubId: string;
  githubRepoOwner: string;
  githubRepoName: string;
  githubBranch: string;
  // GitLab
  gitlabId: string;
  gitlabRepoOwner: string;
  gitlabRepoId: number;
  gitlabBranch: string;
  gitlabPathNamespace: string;
  // Bitbucket
  bitbucketId: string;
  bitbucketRepoOwner: string;
  bitbucketRepoSlug: string;
  bitbucketBranch: string;
  // Git URL
  customGitUrl: string;
  customGitBranch: string;
  // Docker
  dockerImage: string;
  dockerUsername: string;
  dockerPassword: string;
  // Build
  projectName: string;
  appName: string;
  buildType: "nixpacks" | "dockerfile";
  serverId: string;
  envVars: string;
  buildArgs: string;
  // Stack
  stackType: string;
  packageManager: string;
  installCommand: string;
  buildCommand: string;
  startCommand: string;
}

// DeploymentRow – Tipo do histórico (inferido do tRPC)
type DeploymentRow = inferRouterOutputs<AppRouter>["deployment"]["allCentralized"][number];

// Tem: application?, compose?, server?, buildServer?, status, title, createdAt
// Cada application/compose tem: environment.project.{projectId, name}, environment.{environmentId, name}
```

## Regras de Integridade para TODOS os Agentes

### ❌ NUNCA fazer:
1. Remover ou renomear qualquer chamada tRPC
2. Mudar a ordem das mutations no fluxo de deploy (1→2→3→4→5→6)
3. Alterar os parâmetros enviados para as mutations
4. Mudar os paths de navegação (router.push)
5. Alterar a interface DeployConfig
6. Remover o refetchInterval de 5s no allCentralized
7. Remover verificações de permissão (canCreate, canDelete)
8. Alterar a lógica de filtros (status, type, globalFilter)

### ✅ SEMPRE fazer:
1. Manter TODAS as queries e mutations existentes
2. Preservar os mesmos parâmetros de cada chamada tRPC
3. Manter os mesmos paths de navegação (router.push / Link href)
4. Preservar a sequência de mutations do deploy
5. Manter loading states durante chamadas assíncronas
6. Manter error handling (toast.error) em cada mutation
7. Manter a lógica canProceed / ready antes de avançar steps
8. Testar com `pnpm build` após cada modificação

## Checklist de Verificação Pós-Refatoração

```
Para CADA componente refatorado, verificar:

□ Todas as queries tRPC da tabela acima estão presentes?
□ Todas as mutations tRPC da tabela acima estão presentes?
□ Os parâmetros das mutations são idênticos ao original?
□ O router.push pós-deploy aponta para o path correto?
□ Os Links/hrefs de navegação estão corretos?
□ Os loading states (isLoading, isPending) são exibidos?
□ Os erros são tratados com toast/alert?
□ As permissões são verificadas (canCreate, canDelete)?
□ O componente compila sem erros TypeScript?
□ O "use client" está no topo do arquivo?
```
