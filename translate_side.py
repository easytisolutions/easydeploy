import re

file_path = "apps/dokploy/components/layouts/side.tsx"
with open(file_path, "r") as f:
    text = f.read()

translations = {
    'title: "Projects"': 'title: "Projetos"',
    'title: "Deployments"': 'title: "Deploys"',
    'title: "Servers"': 'title: "Servidores"',
    'title: "Schedules"': 'title: "Cronogramas"',
    'title: "Monitoring"': 'title: "Monitoramento"',
    'title: "Advanced"': 'title: "Avançado"',
    'title: "Traefik"': 'title: "Traefik"',
    'title: "Cluster"': 'title: "Cluster"',
    'title: "Swarm"': 'title: "Swarm"',
    'title: "Docker"': 'title: "Docker"',
    'title: "Settings"': 'title: "Configurações"',
    'title: "Profile"': 'title: "Perfil"',
    'title: "Users"': 'title: "Usuários"',
    'title: "Appearance"': 'title: "Aparência"',
    'title: "Server"': 'title: "Servidor"',
    'title: "Billing"': 'title: "Faturamento"',
    'title: "Invoices"': 'title: "Faturas"',
    'title: "Destinations"': 'title: "Destinos"',
    'title: "Git Providers"': 'title: "Provedores Git"',
    'title: "SSH Keys"': 'title: "Chaves SSH"',
    'title: "Registry"': 'title: "Registry"',
    'title: "Whitelabeling"': 'title: "Whitelabeling"',
    'title: "Documentation"': 'title: "Documentação"',
    'title: "Support"': 'title: "Suporte"',
    'title: "Logs"': 'title: "Logs"',
    'title: "Audit Logs"': 'title: "Logs de Auditoria"',
    'title: "Certificates"': 'title: "Certificados"',
    'title: "Server Logs"': 'title: "Logs do Servidor"',
    'title: "Easydeploy"': 'title: "Easydeploy"',
    'title: "Logout"': 'title: "Sair"',
    'isEnabled: ({ permissions }) => !!permissions?.sshKeys.read,': 'isEnabled: ({ auth }) => auth?.role === "owner",',
    '"Dokploy"': '"easyti"',
}

for eng, pt in translations.items():
    text = text.replace(eng, pt)

with open(file_path, "w") as f:
    f.write(text)

