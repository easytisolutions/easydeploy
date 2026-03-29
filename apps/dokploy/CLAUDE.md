# EasyDeploy – Claude Code Orchestrator

> Este arquivo configura o Claude Code para entender o projeto e executar refatorações de forma orquestrada usando subagentes.

## Contexto do Projeto

EasyDeploy é um fork do Dokploy transformado em uma experiência similar ao Vercel/Netlify.

### Stack Técnica
- **Framework**: Next.js 16.2 (Pages Router), React 18, TypeScript
- **UI**: shadcn/ui + Radix UI + Tailwind CSS 3.4.17 + tailwindcss-animate
- **Dados**: tRPC 11.10 + @tanstack/react-query 5.90
- **Ícones**: lucide-react 0.469 + @icons-pack/react-simple-icons 13.13.0
- **Animações**: framer-motion
- **Auth**: better-auth 1.5.4
- **Monorepo**: pnpm workspace

### Estrutura de Diretórios
```
dokploy/apps/dokploy/
├── components/
│   ├── atoms/           # Componentes atômicos reutilizáveis
│   │   ├── animations/  # motion.tsx, animated-svgs.tsx
│   │   ├── badges/      # status-badge.tsx
│   │   └── icons/       # tech-icon.tsx
│   ├── features/        # Features por domínio
│   │   ├── deploy/      # Wizard de deploy
│   │   ├── projects/    # Lista de projetos
│   │   └── deployments/ # Histórico de deploys
│   ├── dashboard/       # Componentes originais do Dokploy (legado)
│   └── ui/              # shadcn/ui primitives
├── pages/dashboard/     # Pages Router
├── styles/globals.css   # CSS variables EasyTI
└── server/api/          # tRPC routers
```

### Componentes Já Criados (referência de padrão)
- `components/atoms/animations/motion.tsx` – Variants do framer-motion + wrappers (FadeIn, PageTransition, StaggerList)
- `components/atoms/icons/tech-icon.tsx` – TechIcon (19 techs) + ProviderIcon (5 providers)
- `components/atoms/animations/animated-svgs.tsx` – DeployRocket, StatusPulse, BuildProgress, EmptyProjects, LoadingSkeleton
- `components/atoms/badges/status-badge.tsx` – Badge com StatusPulse animado
- `components/features/deploy/components/deploy-wizard-v2.tsx` – Wizard 2 passos (Import → Configure & Deploy)
- `components/features/projects/components/show-projects-v2.tsx` – Grid de projetos com animações

### Convenções de Código
1. **Imports**: usar `@/components/...` para paths absolutos
2. **"use client"** no topo de todo componente com interatividade
3. **Animações**: sempre usar variants do `motion.tsx`, nunca criar inline
4. **Ícones**: usar TechIcon/ProviderIcon para techs, lucide-react para UI geral
5. **Estilo**: Tailwind classes, nunca CSS modules. Respeitar CSS variables do globals.css
6. **Idioma UI**: Português brasileiro para labels/mensagens
7. **Tipos**: TypeScript strict, inferir tipos do tRPC com `inferRouterOutputs`
8. **shadcn/ui**: sempre importar de `@/components/ui/...`

### Cores EasyTI (Tailwind)
- `easyti-primary` (azul principal), `easyti-secondary`, `easyti-accent`
- `easyti-success` (verde), `easyti-warning` (amarelo), `easyti-danger` (vermelho), `easyti-info`
- Dark mode: variáveis CSS em `globals.css` com `hsl(217 91% 60%)` como primary

### tRPC Routes Principais
```
api.project.create / all / remove
api.application.create / saveGithubProvider / saveGitlabProvider / saveBitbucketProvider
api.application.saveEnvironment / saveBuildType / deploy
api.deployment.allCentralized
api.github.getRepositories / getBranches
api.gitlab.getRepositories / getBranches  
api.bitbucket.getRepositories / getBranches
api.server.withSSHKey
api.settings.isCloud
```
