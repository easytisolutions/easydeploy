# Agente 6: Sidebar Refactoring – EasyTI Style + Menu Categories

## ⚠️ LEITURA OBRIGATÓRIA ANTES DE COMEÇAR
**Leia o arquivo `.claude/e2e-flow-map.md` INTEIRO antes de implementar.**
A sidebar é o componente de navegação principal. Se quebrar os links ou 
a lógica de permissões, TODO o fluxo de navegação para de funcionar.

## Objetivo
Refatorar a sidebar para:
1. Visual moderno alinhado com a identidade EasyTI
2. Separar menus em duas categorias: **Usuário** e **Administração**
3. Ocultar TODA a seção de administração para perfis que não sejam `owner`
4. Manter 100% da funcionalidade de permissões, navegação e organização

## Fase 1: Exploração (Subagente Explore)
```
Use subagente Explore com thoroughness "thorough" para:
1. Ler dokploy/apps/dokploy/components/layouts/side.tsx COMPLETO (é o arquivo principal ~1250 linhas)
2. Ler dokploy/apps/dokploy/components/layouts/dashboard-layout.tsx
3. Ler dokploy/apps/dokploy/components/layouts/user-nav.tsx
4. Ler dokploy/apps/dokploy/components/ui/sidebar.tsx (primitives)
5. Ler dokploy/apps/dokploy/components/shared/logo.tsx
6. Identificar:
   - TODAS as queries tRPC usadas na sidebar
   - TODA a lógica de permissões (auth.role, permissions.*)
   - TODOS os links de navegação e seus paths
   - Como funciona o organization switcher
   - Como funciona o estado collapsed/expanded
7. Retornar: mapa completo de queries, permissões, links e componentes
```

## Fase 2: Implementação

### Arquivo a editar: `components/layouts/side.tsx`
**ATENÇÃO: Este é um arquivo EXISTENTE. Editar in-place, NÃO criar arquivo novo.**
A sidebar é compartilhada por TODAS as pages. Um arquivo novo não seria importado pelo layout.

### 🔴 REGRAS DE INTEGRIDADE (OBRIGATÓRIO)

**Queries tRPC que DEVEM permanecer (NÃO remover):**
```typescript
api.user.get.useQuery()                    // auth.role, user data
api.user.getPermissions.useQuery()         // permissions object
api.settings.isCloud.useQuery()            // cloud mode flag
api.settings.getDokployVersion.useQuery()  // version display
api.whitelabeling.get.useQuery()           // custom branding
api.organization.all.useQuery()            // org switcher
api.organization.active.useQuery()         // current org
api.organization.delete.useMutation()      // delete org
api.organization.setDefault.useMutation()  // set default org
api.user.session.useQuery()                // session data
api.user.getInvitations.useQuery()         // invitation bell
```

**Mutations que DEVEM permanecer:**
```typescript
authClient.organization.setActive()        // switch org
authClient.organization.acceptInvitation()  // accept invite
```

**Navegação que DEVE permanecer intacta:**
```
/dashboard/projects          → Projetos
/dashboard/deploy            → Novo Deploy
/dashboard/deployments       → Histórico
/dashboard/monitoring        → Monitoring
/dashboard/schedules         → Schedules
/dashboard/traefik           → Traefik
/dashboard/docker            → Docker
/dashboard/swarm             → Swarm
/dashboard/requests          → Requests
/dashboard/settings/*        → Todas as rotas de settings
```

### Estrutura do Novo Menu

```typescript
// NOVA ORGANIZAÇÃO DO MENU: 2 categorias

const MENU: Menu = {
  // ─── SEÇÃO "USUÁRIO" ───────────────────────────────────
  // Visível para TODOS os perfis (owner, admin, member)
  // São as telas principais de uso diário
  user: [
    { title: "Projetos",          url: "/dashboard/projects",     icon: Folder },
    { title: "Novo Deploy",       url: "/dashboard/deploy",       icon: Rocket },
    { title: "Histórico",         url: "/dashboard/deployments",  icon: Rocket,
      isEnabled: ({ permissions }) => !!permissions?.deployment.read },
    { title: "Perfil",            url: "/dashboard/settings/profile", icon: User },
    { title: "Git Providers",     url: "/dashboard/settings/git-providers", icon: GitBranch,
      isEnabled: ({ permissions }) => !!permissions?.gitProviders.read },
    { title: "SSH Keys",          url: "/dashboard/settings/ssh-keys", icon: KeyRound,
      isEnabled: ({ permissions }) => !!permissions?.sshKeys.read },
    { title: "Registry",          url: "/dashboard/settings/registry", icon: Package,
      isEnabled: ({ permissions }) => !!permissions?.registry.read },
  ],

  // ─── SEÇÃO "ADMINISTRAÇÃO" ─────────────────────────────
  // Visível APENAS para owner (e opcionalmente admin)
  // Contém TUDO o resto: servidores, monitoramento, Docker, billing, etc
  admin: [
    // Infraestrutura
    { title: "Web Server",        url: "/dashboard/settings/server", icon: Activity,
      isEnabled: ({ permissions, isCloud }) => !!(permissions?.organization.update && !isCloud) },
    { title: "Remote Servers",    url: "/dashboard/settings/servers", icon: Server,
      isEnabled: ({ permissions }) => !!permissions?.server.read },
    { title: "Monitoring",        url: "/dashboard/monitoring", icon: BarChartHorizontalBigIcon,
      isEnabled: ({ isCloud, permissions }) => !isCloud && !!permissions?.monitoring.read },
    { title: "Docker",            url: "/dashboard/docker", icon: BlocksIcon,
      isEnabled: ({ permissions, isCloud }) => !!(permissions?.docker.read && !isCloud) },
    { title: "Swarm",             url: "/dashboard/swarm", icon: PieChart,
      isEnabled: ({ permissions, isCloud }) => !!(permissions?.docker.read && !isCloud) },
    { title: "Traefik",           url: "/dashboard/traefik", icon: GalleryVerticalEnd,
      isEnabled: ({ permissions, isCloud }) => !!(permissions?.traefikFiles.read && !isCloud) },
    
    // Gestão
    { title: "Usuários",          url: "/dashboard/settings/users", icon: Users,
      isEnabled: ({ permissions }) => !!permissions?.member.read },
    { title: "Schedules",         url: "/dashboard/schedules", icon: Clock,
      isEnabled: ({ isCloud, permissions }) => !isCloud && !!permissions?.organization.update },
    { title: "Audit Logs",        url: "/dashboard/settings/audit-logs", icon: ClipboardList,
      isEnabled: ({ permissions }) => !!permissions?.auditLog.read },
    { title: "Tags",              url: "/dashboard/settings/tags", icon: Tags,
      isEnabled: ({ permissions }) => !!permissions?.tag.read },
    { title: "Notificações",      url: "/dashboard/settings/notifications", icon: Bell,
      isEnabled: ({ permissions }) => !!permissions?.notification.read },
    
    // Integrações
    { title: "S3 Destinations",   url: "/dashboard/settings/destinations", icon: Database,
      isEnabled: ({ permissions }) => !!permissions?.destination.read },
    { title: "Certificates",      url: "/dashboard/settings/certificates", icon: ShieldCheck,
      isEnabled: ({ permissions }) => !!permissions?.certificate.read },
    { title: "Cluster",           url: "/dashboard/settings/cluster", icon: Boxes,
      isEnabled: ({ permissions, isCloud }) => !!(permissions?.organization.update && !isCloud) },
    { title: "Requests",          url: "/dashboard/requests", icon: Forward,
      isEnabled: ({ permissions, isCloud }) => !!(permissions?.docker.read && !isCloud) },
    
    // Sistema (owner only)
    { title: "AI",                url: "/dashboard/settings/ai", icon: BotIcon,
      isEnabled: ({ permissions }) => !!permissions?.organization.update },
    { title: "SSO",               url: "/dashboard/settings/sso", icon: LogIn,
      isEnabled: ({ permissions }) => !!permissions?.organization.update },
    { title: "Billing",           url: "/dashboard/settings/billing", icon: CreditCard,
      isEnabled: ({ auth, isCloud }) => !!(auth?.role === "owner" && isCloud) },
    { title: "License",           url: "/dashboard/settings/license", icon: Key,
      isEnabled: ({ auth }) => !!(auth?.role === "owner") },
    { title: "Whitelabeling",     url: "/dashboard/settings/whitelabeling", icon: Palette,
      isEnabled: ({ auth, isCloud }) => !!(auth?.role === "owner" && !isCloud) },
  ],

  help: [/* manter existente */],
};
```

### 🔑 Lógica de Visibilidade da Seção Admin

```typescript
// A SEÇÃO INTEIRA "Administração" só aparece para owner/admin
// Dentro dela, cada item ainda tem seu próprio isEnabled
const showAdminSection = auth?.role === "owner" || auth?.role === "admin";
```

**Para MEMBER**: vê APENAS a seção "Usuário" (Projetos, Deploy, Histórico, Perfil, Git, SSH, Registry)
**Para ADMIN**: vê AMBAS as seções, filtradas por permissões individuais
**Para OWNER**: vê TUDO

### Estilo Visual EasyTI

1. **Seção "Usuário"**:
   - Label: ícone User + "Meus Projetos" (ou apenas sem label, limpo)
   - Item ativo: `bg-easyti-primary/10 text-easyti-primary border-l-2 border-easyti-primary`
   - Item hover: `hover:bg-muted/60 transition-colors duration-150`
   - Ícone ativo: `text-easyti-primary`

2. **Seção "Administração"**:
   - Label: ícone ShieldCheck + "Administração" 
   - Separador visual com `Separator` entre as seções
   - Estilo mais sutil, texto `text-muted-foreground` 
   - Item ativo: mesmo estilo do "Usuário" para consistência

3. **Logo/Header**:
   - Manter organization switcher funcional
   - Adicionar gradiente sutil `from-easyti-primary/5 to-transparent` no header
   
4. **Footer**:
   - Manter UserNav + versão + UpdateServerButton
   - Adicionar borda sutil `border-t border-border/50`

5. **Geral**:
   - Transições suaves: `transition-all duration-200`
   - Manter suporte a `collapsed` (ícones only) e `expanded`
   - Manter suporte mobile (isMobile)
   - Scrollbar custom se muitos items: `scrollbar-thin`

### Funções a Modificar

1. **`createMenuForAuthUser()`**: 
   - Adicionar filtro da seção admin inteira por role
   - Manter filtro individual por `isEnabled` dentro de cada seção
   - Retornar: `{ user, admin, help }` ao invés de `{ home, settings, help }`

2. **`findActiveNavItem()`**: 
   - Buscar em AMBAS as seções (user + admin)

3. **Render do `<Page>`**:
   - Render seção "Usuário" com SidebarGroup
   - Render separador
   - Render seção "Administração" com SidebarGroup (condicionado a `showAdminSection`)
   - Render seção "Extra/Help"

## Fase 3: Verificação E2E

### Cenário 1: Usuário OWNER
```
□ Vê seção "Usuário" com: Projetos, Novo Deploy, Histórico, Perfil, Git, SSH, Registry
□ Vê seção "Administração" com: TODOS os items de infra, gestão, sistema
□ Todos os links navegam para os paths corretos
□ Organization switcher funciona
□ Invitation bell funciona
□ UserNav dropdown funciona
□ Collapsed mode mostra apenas ícones
```

### Cenário 2: Usuário MEMBER
```
□ Vê APENAS seção "Usuário"
□ NÃO vê seção "Administração" (nem o label)
□ Projetos, Novo Deploy, Perfil sempre visíveis
□ Histórico visível se permission.deployment.read
□ Git/SSH/Registry visíveis se respectivas permissions
□ Todos os links navegam corretamente
□ Organization switcher funciona
□ Menu não tem items quebrados ou "fantasma"
```

### Cenário 3: Usuário ADMIN  
```
□ Vê AMBAS as seções
□ Items dentro de "Administração" filtrados por permissões
□ Billing NÃO visível (é owner-only)
□ License NÃO visível (é owner-only)
```

## Fase 4: Build
```bash
cd dokploy/apps/dokploy && pnpm build 2>&1 | tail -20
```

**Checklist pós-implementação:**
```
□ TODAS as 12 queries tRPC da sidebar estão presentes?
□ TODAS as mutations (org switch, delete, default, accept invite) funcionam?
□ Lógica de role (owner/admin/member) controla visibilidade da seção admin?
□ TODOS os paths de navegação estão corretos (comparar com e2e-flow-map.md)?
□ Organization switcher funciona normalmente?
□ Collapsed mode funciona (ícones only)?
□ Mobile mode funciona (hamburger)?
□ Breadcrumb reflete o item ativo?
□ UpdateServerButton visível só para admin/owner em non-cloud?
□ Version badge visível no footer?
□ Build passa sem erros TypeScript?
□ Estilo usa cores EasyTI (easyti-primary, etc)?
```

## Referência: Items Obrigatórios por Seção
```
SEÇÃO USUÁRIO (todos os perfis):
├── Projetos (/dashboard/projects)
├── Novo Deploy (/dashboard/deploy)  
├── Histórico (/dashboard/deployments)       [IF: deployment.read]
├── Perfil (/dashboard/settings/profile)
├── Git Providers (/dashboard/settings/git-providers)  [IF: gitProviders.read]
├── SSH Keys (/dashboard/settings/ssh-keys)            [IF: sshKeys.read]
└── Registry (/dashboard/settings/registry)            [IF: registry.read]

SEÇÃO ADMINISTRAÇÃO (owner + admin):
├── Web Server (/dashboard/settings/server)            [IF: org.update && !cloud]
├── Remote Servers (/dashboard/settings/servers)       [IF: server.read]
├── Monitoring (/dashboard/monitoring)                 [IF: !cloud && monitoring.read]
├── Docker (/dashboard/docker)                         [IF: docker.read && !cloud]
├── Swarm (/dashboard/swarm)                           [IF: docker.read && !cloud]
├── Traefik (/dashboard/traefik)                       [IF: traefikFiles.read && !cloud]
├── Usuários (/dashboard/settings/users)               [IF: member.read]
├── Schedules (/dashboard/schedules)                   [IF: !cloud && org.update]
├── Audit Logs (/dashboard/settings/audit-logs)        [IF: auditLog.read]
├── Tags (/dashboard/settings/tags)                    [IF: tag.read]
├── Notificações (/dashboard/settings/notifications)   [IF: notification.read]
├── S3 Destinations (/dashboard/settings/destinations) [IF: destination.read]
├── Certificates (/dashboard/settings/certificates)    [IF: certificate.read]
├── Cluster (/dashboard/settings/cluster)              [IF: org.update && !cloud]
├── Requests (/dashboard/requests)                     [IF: docker.read && !cloud]
├── AI (/dashboard/settings/ai)                        [IF: org.update]
├── SSO (/dashboard/settings/sso)                      [IF: org.update]
├── Billing (/dashboard/settings/billing)              [IF: owner && cloud]
├── License (/dashboard/settings/license)              [IF: owner]
└── Whitelabeling (/dashboard/settings/whitelabeling)  [IF: owner && !cloud]

SEÇÃO EXTRA/HELP:
├── Documentação (external link)
└── Suporte (external link)
```
