import os

show_file = "apps/dokploy/components/dashboard/settings/git/show-git-providers.tsx"
with open(show_file, "r") as f:
    text = f.read()

text = text.replace("Create your first Git Provider", "Adicione seu primeiro Provedor Git")
text = text.replace("Available Providers", "Provedores Disponíveis")

with open(show_file, "w") as f:
    f.write(text)

