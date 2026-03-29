# Agente 07 – Auto-Detecção de Stack + Dockerfile Obrigatório

> Este agente implementa 3 mudanças:
> 1. Auto-detecção de stack e Dockerfile no repositório (GitHub/GitLab/Bitbucket)
> 2. Geração automática de Dockerfile quando o repo não tem um
> 3. Remoção do buildType nixpacks/heroku/paketo/railpack — APENAS "dockerfile" é aceito
> 4. Na tela de projetos, remover criação direta (HandleProject) — obrigar uso do wizard

---

## PASSO 0 — Contexto Obrigatório

```
ANTES de tudo, leia estes 2 arquivos:
1. dokploy/apps/dokploy/CLAUDE.md
2. dokploy/apps/dokploy/.claude/e2e-flow-map.md

Entenda o fluxo completo antes de implementar.
```

---

## PASSO 1 — Backend: Criar tRPC para ler arquivos do repositório

### 1A. Adicionar função `getGithubRepoFiles` em `packages/server/src/utils/providers/github.ts`

Adicionar após a função `getGithubBranches`:

```typescript
/**
 * Lista arquivos na raiz (ou path) de um repositório GitHub para detecção de stack.
 * Retorna apenas nomes dos arquivos (não conteúdo).
 */
export const getGithubRepoFiles = async (
  githubId: string,
  owner: string,
  repo: string,
  branch: string,
  path?: string,
) => {
  const githubProvider = await findGithubById(githubId);
  const octokit = authGithub(githubProvider);
  
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: path || "",
      ref: branch,
    });
    
    if (Array.isArray(data)) {
      return data.map((item) => ({
        name: item.name,
        type: item.type as "file" | "dir",
        path: item.path,
      }));
    }
    
    // Se for um arquivo único, retorna como array de 1
    return [{ name: data.name, type: data.type as "file" | "dir", path: data.path }];
  } catch {
    return [];
  }
};

/**
 * Lê o conteúdo de um arquivo específico do repositório GitHub.
 * Usado para ler Dockerfile existente.
 */
export const getGithubFileContent = async (
  githubId: string,
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
) => {
  const githubProvider = await findGithubById(githubId);
  const octokit = authGithub(githubProvider);
  
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: branch,
    });
    
    if (!Array.isArray(data) && data.type === "file" && data.content) {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return null;
  } catch {
    return null;
  }
};
```

### 1B. Adicionar funções análogas para GitLab em `packages/server/src/utils/providers/gitlab.ts`

```typescript
/**
 * Lista arquivos na raiz de um repositório GitLab.
 */
export const getGitlabRepoFiles = async (
  gitlabId: string,
  repoId: number,
  branch: string,
  path?: string,
) => {
  const gitlabProvider = await findGitlabById(gitlabId);
  const token = await refreshGitlabToken(gitlabId);
  
  try {
    const response = await fetch(
      `https://gitlab.com/api/v4/projects/${repoId}/repository/tree?ref=${encodeURIComponent(branch)}&path=${encodeURIComponent(path || "")}&per_page=100`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    
    if (!response.ok) return [];
    const data = await response.json();
    
    return (data as Array<{name: string; type: string; path: string}>).map((item) => ({
      name: item.name,
      type: (item.type === "tree" ? "dir" : "file") as "file" | "dir",
      path: item.path,
    }));
  } catch {
    return [];
  }
};

/**
 * Lê conteúdo de um arquivo do GitLab.
 */
export const getGitlabFileContent = async (
  gitlabId: string,
  repoId: number,
  branch: string,
  filePath: string,
) => {
  const gitlabProvider = await findGitlabById(gitlabId);
  const token = await refreshGitlabToken(gitlabId);
  
  try {
    const response = await fetch(
      `https://gitlab.com/api/v4/projects/${repoId}/repository/files/${encodeURIComponent(filePath)}/raw?ref=${encodeURIComponent(branch)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
};
```

### 1C. Para Bitbucket — mesmo pattern

Usar API `https://api.bitbucket.org/2.0/repositories/{owner}/{slug}/src/{branch}/` para listar e ler arquivos.

### 1D. Exportar as novas funções em `packages/server/src/index.ts`

Verificar que as novas funções são re-exportadas.

### 1E. Criar tRPC endpoints no router de GitHub

Em `server/api/routers/github.ts`, adicionar:

```typescript
getGithubRepoFiles: protectedProcedure
  .input(z.object({
    githubId: z.string(),
    owner: z.string(),
    repo: z.string(),
    branch: z.string(),
    path: z.string().optional(),
  }))
  .query(async ({ input }) => {
    return await getGithubRepoFiles(
      input.githubId, input.owner, input.repo, input.branch, input.path,
    );
  }),

getGithubFileContent: protectedProcedure
  .input(z.object({
    githubId: z.string(),
    owner: z.string(),
    repo: z.string(),
    branch: z.string(),
    filePath: z.string(),
  }))
  .query(async ({ input }) => {
    return await getGithubFileContent(
      input.githubId, input.owner, input.repo, input.branch, input.filePath,
    );
  }),
```

Mesma coisa para GitLab router (`server/api/routers/gitlab.ts`) e Bitbucket router.

---

## PASSO 2 — Frontend: Auto-Detecção de Stack no Wizard V2

### Arquivo: `components/features/deploy/components/deploy-wizard-v2.tsx`

### 2A. Mapa de detecção de stack por arquivos

Criar constante acima de `generateDockerfileContent`:

```typescript
// ─── Stack Detection Rules ────────────────────────────────────────
interface DetectionRule {
  files: string[];        // Arquivos que indicam esta stack
  stackId: string;        // ID do STACKS array
  priority: number;       // Maior = mais específico = prioridade
}

const DETECTION_RULES: DetectionRule[] = [
  // Frameworks específicos (alta prioridade)
  { files: ["next.config.js", "next.config.mjs", "next.config.ts"], stackId: "nextjs", priority: 10 },
  { files: ["nuxt.config.ts", "nuxt.config.js"], stackId: "nuxt", priority: 10 },
  { files: ["nest-cli.json"], stackId: "nestjs", priority: 10 },
  { files: ["vue.config.js", "vite.config.ts", "vite.config.js"], stackId: "react", priority: 8 },  // Vite (React ou Vue)
  { files: ["angular.json"], stackId: "react", priority: 9 },  // Angular → React template (Node)
  
  // Frameworks backend
  { files: ["manage.py", "settings.py"], stackId: "django", priority: 10 },
  { files: ["artisan", "composer.json"], stackId: "laravel", priority: 9 },
  { files: ["Gemfile", "config.ru"], stackId: "rails", priority: 8 },
  { files: ["go.mod"], stackId: "go", priority: 9 },
  
  // Genéricos (baixa prioridade)
  { files: ["requirements.txt", "pyproject.toml", "Pipfile"], stackId: "python", priority: 5 },
  { files: ["package.json"], stackId: "react", priority: 3 },  // Node genérico → React template
  { files: ["index.html"], stackId: "static", priority: 1 },   // Último recurso
];

/**
 * Detecta a stack com base nos arquivos encontrados na raiz do repositório.
 * Retorna o stackId mais provável ou null se não detectar nada.
 */
function detectStackFromFiles(fileNames: string[]): string | null {
  const matches = DETECTION_RULES
    .filter((rule) => rule.files.some((f) => fileNames.includes(f)))
    .sort((a, b) => b.priority - a.priority);
  
  return matches.length > 0 ? matches[0].stackId : null;
}
```

### 2B. Hook de detecção automática

Após a seleção de repositório + branch, disparar a detecção:

```typescript
// Dentro do componente DeployWizard, criar estado para detecção
const [isDetecting, setIsDetecting] = useState(false);
const [detectedStack, setDetectedStack] = useState<string | null>(null);
const [hasDockerfile, setHasDockerfile] = useState(false);
const [existingDockerfile, setExistingDockerfile] = useState<string | null>(null);

// Função de detecção (chamada quando repo + branch estão prontos)
const detectStack = async () => {
  if (!config.sourceType) return;
  
  setIsDetecting(true);
  setDetectedStack(null);
  setHasDockerfile(false);
  setExistingDockerfile(null);
  
  try {
    let files: { name: string; type: string }[] = [];
    
    if (config.sourceType === "github" && config.githubId && config.githubRepoOwner && config.githubRepoName) {
      files = await utils.client.github.getGithubRepoFiles.query({
        githubId: config.githubId,
        owner: config.githubRepoOwner,
        repo: config.githubRepoName,
        branch: config.githubBranch || "main",
      });
    } else if (config.sourceType === "gitlab" && config.gitlabId && config.gitlabRepoId) {
      files = await utils.client.gitlab.getGitlabRepoFiles.query({
        gitlabId: config.gitlabId,
        repoId: config.gitlabRepoId,
        branch: config.gitlabBranch || "main",
      });
    }
    // Bitbucket: similar
    
    const fileNames = files.map((f) => f.name);
    
    // 1. Verificar se já existe Dockerfile
    const dockerfileExists = fileNames.includes("Dockerfile");
    setHasDockerfile(dockerfileExists);
    
    if (dockerfileExists) {
      // Ler conteúdo do Dockerfile existente (para preview)
      if (config.sourceType === "github") {
        const content = await utils.client.github.getGithubFileContent.query({
          githubId: config.githubId!,
          owner: config.githubRepoOwner!,
          repo: config.githubRepoName!,
          branch: config.githubBranch || "main",
          filePath: "Dockerfile",
        });
        setExistingDockerfile(content);
      }
      // GitLab/Bitbucket: similar
    }
    
    // 2. Detectar stack
    const detected = detectStackFromFiles(fileNames);
    setDetectedStack(detected);
    
    // 3. Auto-selecionar a stack se detectada
    if (detected) {
      handleStackSelect(detected);
      toast.success(`Stack detectada: ${STACKS.find(s => s.id === detected)?.name}`);
    }
  } catch (error) {
    console.error("Stack detection failed:", error);
    // Silencioso — o usuário pode selecionar manualmente
  } finally {
    setIsDetecting(false);
  }
};
```

### 2C. Trigger da detecção

Chamar `detectStack()` automaticamente quando:
- GitHub: `config.githubRepoName` e `config.githubBranch` ficam definidos
- GitLab: `config.gitlabRepoId` e `config.gitlabBranch` ficam definidos
- Bitbucket: `config.bitbucketRepoSlug` e `config.bitbucketBranch` ficam definidos
- Git URL: NÃO detectar (não temos API para repos arbitrários)
- Docker: NÃO detectar (é imagem, não repo)

Usar `useEffect` ou chamar no handler de seleção de branch.

### 2D. UI de feedback de detecção

Na ConfigureDeployStep, antes da seleção de stack, mostrar badge de detecção:

```tsx
{isDetecting && (
  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
    <TechScannerAnimation className="w-6 h-6" />
    <span className="text-sm text-muted-foreground">Analisando repositório...</span>
  </div>
)}

{detectedStack && !isDetecting && (
  <div className="flex items-center gap-2 p-3 bg-easyti-primary/10 border border-easyti-primary/20 rounded-lg">
    <TechIcon name={STACKS.find(s => s.id === detectedStack)?.iconKey || "node"} size={20} />
    <span className="text-sm">
      Stack detectada: <strong>{STACKS.find(s => s.id === detectedStack)?.name}</strong>
    </span>
    {hasDockerfile && (
      <Badge variant="outline" className="ml-auto text-green-600 border-green-600">
        Dockerfile encontrado ✓
      </Badge>
    )}
  </div>
)}
```

---

## PASSO 3 — Build Type: SEMPRE Dockerfile

### 3A. Alterar o handleDeploy

No `handleDeploy`, substituir o bloco `saveBuildType` para SEMPRE usar `"dockerfile"`:

```typescript
// Build type — SEMPRE dockerfile
if (config.sourceType !== "docker") {
  let dockerfileContent: string | null = null;
  
  if (hasDockerfile && existingDockerfile) {
    // Repo já tem Dockerfile → usar o existente (buildType=dockerfile, dockerfile=null para usar o do repo)
    dockerfileContent = null; // null = usar o Dockerfile do repo em disco
  } else if (config.stackType) {
    // Repo NÃO tem Dockerfile → gerar a partir da stack selecionada
    dockerfileContent = generateDockerfileContent(
      config.stackType,
      config.installCommand || "",
      config.buildCommand || "",
      config.startCommand || "",
    );
  }
  
  await saveBuildType.mutateAsync({
    applicationId,
    buildType: "dockerfile",
    dockerfile: dockerfileContent,   // null = usar do repo, string = conteúdo inline gerado
    dockerContextPath: null,
    dockerBuildStage: null,
    herokuVersion: null,
    railpackVersion: null,
    publishDirectory: null,
    isStaticSpa: null,
  });
}
```

### 3B. Remover referências a nixpacks no wizard

1. **Tipo BuildType**: alterar de `"nixpacks" | "dockerfile" | "buildpack"` para apenas `"dockerfile"`
2. **Estado default**: `buildType: "dockerfile"` (em vez de `"nixpacks"`)
3. **handleStackSelect**: mudar `buildType: "nixpacks"` → `buildType: "dockerfile"`
4. **Environment variables**: REMOVER envio de `NIXPACKS_INSTALL_CMD`, `NIXPACKS_BUILD_CMD`, `NIXPACKS_START_CMD` como buildArgs. São inúteis quando buildType é dockerfile.

```typescript
// ANTES (remover):
const nixpacksBuildArgs: string[] = [];
if (config.sourceType !== "docker" && config.stackType) {
  if (config.installCommand) nixpacksBuildArgs.push(`NIXPACKS_INSTALL_CMD=${config.installCommand}`);
  if (config.buildCommand) nixpacksBuildArgs.push(`NIXPACKS_BUILD_CMD=${config.buildCommand}`);
  if (config.startCommand) nixpacksBuildArgs.push(`NIXPACKS_START_CMD=${config.startCommand}`);
}

// DEPOIS:
// Build commands are embedded in the Dockerfile, no need for NIXPACKS_ env vars
const nixpacksBuildArgs: string[] = [];
```

### 3C. UI de preview do Dockerfile

Na ConfigureDeployStep, mostrar preview do Dockerfile que será usado/gerado:

```tsx
{/* Dockerfile Preview */}
{config.stackType && (
  <div className="space-y-2 mt-4">
    <Label className="text-sm font-medium flex items-center gap-2">
      <FileCode className="w-4 h-4" />
      {hasDockerfile ? "Dockerfile do repositório" : "Dockerfile (auto-gerado)"}
    </Label>
    <div className="bg-zinc-950 text-zinc-100 rounded-lg p-4 font-mono text-xs max-h-48 overflow-y-auto">
      <pre className="whitespace-pre-wrap">
        {hasDockerfile ? existingDockerfile : generateDockerfileContent(
          config.stackType,
          config.installCommand || "",
          config.buildCommand || "",
          config.startCommand || "",
        )}
      </pre>
    </div>
    {!hasDockerfile && (
      <p className="text-xs text-muted-foreground">
        Este Dockerfile será gerado automaticamente para o build.
        Você pode alterá-lo depois nas configurações da aplicação.
      </p>
    )}
  </div>
)}
```

---

## PASSO 4 — Projects Page: Bloquear criação fora do Wizard

### Arquivo: `components/features/projects/components/show-projects-v2.tsx`

### 4A. Remover o componente HandleProject

Remover o import e o uso de `<HandleProject />` da página de projetos:

```tsx
// REMOVER esta linha de import:
import { HandleProject } from "@/components/dashboard/projects/handle-project";

// REMOVER o <HandleProject /> do JSX:
// ANTES:
<div className="flex gap-2">
  {permissions?.project.create && (
    <>
      <Button ... onClick={() => router.push("/dashboard/deploy")}>
        <Rocket className="w-4 h-4" />
        Novo Deploy
      </Button>
      <HandleProject />     {/* ← REMOVER */}
    </>
  )}
</div>

// DEPOIS:
<div className="flex gap-2">
  {permissions?.project.create && (
    <Button
      size="sm"
      className="bg-easyti-primary hover:bg-easyti-primary-dark text-white gap-1.5"
      onClick={() => router.push("/dashboard/deploy")}
    >
      <Rocket className="w-4 h-4" />
      Novo Deploy
    </Button>
  )}
</div>
```

### 4B. Atualizar empty state

No estado vazio (sem projetos), garantir que o botão leva ao wizard:

```tsx
{/* Empty state — apenas link pro wizard */}
<div className="flex flex-col items-center justify-center gap-4 min-h-[40vh]">
  <EmptyProjectsIllustration />
  <h3 className="text-lg font-semibold">Nenhum projeto ainda</h3>
  <p className="text-sm text-muted-foreground text-center max-w-md">
    Crie seu primeiro deploy importando um repositório Git ou uma imagem Docker.
  </p>
  {permissions?.project.create && (
    <Button
      className="bg-easyti-primary hover:bg-easyti-primary-dark text-white gap-2"
      onClick={() => router.push("/dashboard/deploy")}
    >
      <Rocket className="w-4 h-4" />
      Criar Primeiro Deploy
    </Button>
  )}
</div>
```

### 4C. Verificar outros locais que usam HandleProject

Buscar em TODA a codebase por `<HandleProject` e verificar se existe em outros contextos (ex: project settings). Se existir, avaliar caso a caso — em context menus de projetos existentes pode fazer sentido manter (é apenas para NOVO projeto que deve ir pelo wizard).

**IMPORTANTE**: O `HandleProject` é um Dialog que chama `api.project.create`. Este endpoint NÃO será removido do backend (existem aplicações existentes que dependem dele). Apenas o acesso visual na tela de projetos é removido.

---

## PASSO 5 — Verificação

### Checklist obrigatório

- [ ] `pnpm build` sem erros em `dokploy/apps/dokploy`
- [ ] GitHub detection: selecionar repo → detecta stack → sugere Dockerfile
- [ ] GitLab detection: mesmo fluxo
- [ ] Repo COM Dockerfile: detecta o existente, mostra preview, usa `buildType: "dockerfile"` com `dockerfile: null`
- [ ] Repo SEM Dockerfile: detecta stack, gera Dockerfile, usa `buildType: "dockerfile"` com `dockerfile: <conteúdo>`
- [ ] Seleção manual: se detecção falhar, dá pra selecionar manualmente
- [ ] Deploy completo funciona: project.create → app.create → saveProvider → saveEnv → saveBuildType(dockerfile) → deploy
- [ ] Projects page: NÃO tem botão HandleProject, só "Novo Deploy" que vai pro wizard
- [ ] Empty state: botão leva pro wizard
- [ ] Nenhuma referência a NIXPACKS_ como buildArgs no wizard
- [ ] `generateDockerfileContent()` é chamada e o conteúdo é passado para `saveBuildType`

### Cenários de teste manual

| Cenário | Repo | Esperado |
|---------|------|----------|
| Next.js com Dockerfile | github.com/user/next-app (tem Dockerfile) | Detecta nextjs, mostra Dockerfile existente, buildType=dockerfile, dockerfile=null |
| Next.js sem Dockerfile | github.com/user/next-app (sem Dockerfile) | Detecta nextjs, gera Dockerfile multi-stage, buildType=dockerfile, dockerfile=conteúdo |
| Laravel | github.com/user/laravel-app | Detecta laravel (composer.json + artisan), gera Dockerfile PHP |
| Python | github.com/user/fastapi-app | Detecta python (requirements.txt), gera Dockerfile python:3.11 |
| Git URL (sem detecção) | URL arbitrária | Não detecta, usuário seleciona manual, gera Dockerfile |
| Docker image | nginx:latest | Sem detecção, sem Dockerfile (é imagem pronta) |
| Projects page | /dashboard/projects | Só botão "Novo Deploy", sem HandleProject |

---

## REGRAS CRÍTICAS

1. **NÃO alterar o backend `saveBuildType`** — a mutation já aceita `dockerfile: string | null` e `buildType: "dockerfile"`. Não precisa mudar.
2. **NÃO alterar a tabela/schema do banco** — o enum `buildType` já tem "dockerfile". Não precisa de migration.
3. **NÃO deletar o componente HandleProject** — apenas remover o import/uso na tela de projetos. Ele pode ser usado em outros contextos.
4. **NÃO remover nixpacks/heroku/paketo do backend** — o backend continua suportando todos os buildTypes para apps JÁ existentes. A mudança é apenas no wizard (novas apps usam dockerfile).
5. **Detecção falha graciosamente** — se a API de leitura de arquivos falhar, o wizard funciona normalmente (seleção manual de stack).
6. **Git URL e Docker não têm detecção** — para repositórios via URL customizada (sem API), o usuário seleciona manualmente. Para Docker images, não se aplica.
