# Prompts Rápidos – Copiar e Colar no Claude Code

> Cada prompt abaixo é independente. Cole diretamente no Claude Code (VS Code ou CLI).

---

## 🔍 Prompt: Explorar Componente Antes de Refatorar

```
Explore o componente [NOME_DO_COMPONENTE] no projeto EasyDeploy.

Leia o CLAUDE.md em dokploy/apps/dokploy/ para contexto.

Quero saber:
1. Estrutura completa do componente (props, state, hooks)
2. Queries tRPC utilizadas
3. Componentes filhos importados
4. O que pode ser melhorado visualmente usando os atoms já criados:
   - motion.tsx (FadeIn, PageTransition, StaggerList)
   - tech-icon.tsx (TechIcon, ProviderIcon)
   - animated-svgs.tsx (StatusPulse, DeployRocket, EmptyProjects)
   - status-badge.tsx (StatusBadge)

Retorne um plano de refatoração detalhado.
```

---

## 🎨 Prompt: Criar Novo Atom

```
Leia o CLAUDE.md em dokploy/apps/dokploy/ para contexto do projeto.

Crie um novo componente atom em components/atoms/[CATEGORIA]/[NOME].tsx seguindo 
o padrão dos atoms existentes:
- Leia motion.tsx, tech-icon.tsx, animated-svgs.tsx como referência de estilo
- Use "use client" no topo
- Use framer-motion para animações
- Use Tailwind + CSS variables EasyTI para cores
- Exporte como named export
- TypeScript strict com interface de props

Componente a criar: [DESCREVA O QUE PRECISA]
```

---

## 🔄 Prompt: Refatorar Página Existente

```
Leia o CLAUDE.md em dokploy/apps/dokploy/ para contexto do projeto.

Refatore a página [CAMINHO_DA_PAGE] seguindo o padrão já estabelecido:

1. PRIMEIRO: Explore o componente atual com subagente para entender a estrutura
2. Crie o novo componente em components/features/[DOMÍNIO]/components/[nome]-v2.tsx
3. Use os atoms disponíveis:
   - PageTransition, FadeInUp, StaggerList, StaggerItem (de atoms/animations/motion)
   - StatusPulse, EmptyProjectsIllustration, LoadingSkeleton (de atoms/animations/animated-svgs)
   - StatusBadge (de atoms/badges/status-badge)
   - TechIcon, ProviderIcon (de atoms/icons/tech-icon)
4. Mantenha toda lógica de negócio (queries tRPC, filtros, paginação)
5. Atualize apenas o import na page
6. Rode pnpm build para verificar

Referência de padrão: show-projects-v2.tsx e deploy-wizard-v2.tsx
```

---

## 🐛 Prompt: Corrigir Erros de Build

```
Leia o CLAUDE.md em dokploy/apps/dokploy/ para contexto.

Rode o build do projeto:
cd dokploy/apps/dokploy && pnpm build

Para cada erro encontrado:
1. Identifique o arquivo e linha
2. Leia o arquivo para entender o contexto
3. Corrija o erro (import path, tipo TypeScript, "use client" faltando, etc)
4. Rode build novamente para confirmar

Continue até o build passar sem erros.
```

---

## 🚀 Prompt: Deploy Completo

```
Leia o CLAUDE.md em dokploy/apps/dokploy/ para contexto.

Execute o pipeline de deploy completo:
1. cd dokploy/apps/dokploy && pnpm build (verificar que compila)
2. git add -A && git status (mostrar mudanças)
3. PARAR e me mostrar o que será commitado
4. Após minha confirmação: git commit e git push
5. Após minha confirmação: SSH no servidor e atualizar serviço

IMPORTANTE: Pedir minha confirmação antes de push e deploy.
```

---

## 🏗️ Prompt: Criar Feature Completa

```
Leia o CLAUDE.md em dokploy/apps/dokploy/ para contexto.

Preciso criar a feature [NOME_DA_FEATURE]. Execute assim:

1. **Explore**: Use subagente para investigar componentes existentes relacionados
2. **Plan**: Crie um plano com os arquivos que serão criados/modificados
3. **Atoms**: Crie novos atoms necessários (se algum não existir ainda)
4. **Feature**: Crie o componente principal em features/[domínio]/components/
5. **Wire**: Atualize a page para importar o novo componente
6. **Verify**: Rode pnpm build e corrija erros
7. **Report**: Liste tudo que foi criado/modificado

Siga todos os padrões do CLAUDE.md. Use os atoms existentes ao máximo.
Feature: [DESCREVA AQUI]
```
