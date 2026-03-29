import re

file_path = "apps/dokploy/components/dashboard/settings/profile/profile-form.tsx"
with open(file_path, "r") as f:
    text = f.read()

translations = {
    '>First Name<': '>Nome<',
    'placeholder="John"': 'placeholder="João"',
    '>Last Name<': '>Sobrenome<',
    'placeholder="Doe"': 'placeholder="Silva"',
    '>Current Password<': '>Senha Atual<',
    'placeholder="Current Password"': 'placeholder="Senha Atual"',
    '>Password<': '>Nova Senha<',
    'placeholder="Password"': 'placeholder="Nova Senha"',
    '>Allow Impersonation<': '>Permitir representação<',
    '>Save<': '>Salvar<',
}

for eng, pt in translations.items():
    text = text.replace(eng, pt)

with open(file_path, "w") as f:
    f.write(text)

