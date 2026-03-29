import os
import glob

base_dir = "apps/dokploy/components/dashboard/settings/git/"
files = glob.glob(base_dir + "**/*.tsx", recursive=True)

translations = {
    # Github texts
    "Github Provider <GithubIcon": "Provedor Github <GithubIcon",
    "To integrate your GitHub account with our services, you'll need": "Para integrar sua conta do GitHub com nossos serviços, você precisará",
    "to create and install a GitHub app. This process is": "criar e instalar um aplicativo GitHub. Esse processo é",
    "straightforward and only takes a few minutes. Click the button": "simples e leva apenas alguns minutos. Clique no botão",
    "below to get started.": "abaixo para começar.",
    "Organization?": "Organização?",
    'placeholder="Organization name"': 'placeholder="Nome da Organização"',
    ">Setup Github<": ">Configurar Github<",

    # Bitbucket texts
    "Bitbucket settings": "Configurações do Bitbucket",
    "read:repository:bitbucket": "read:repository:bitbucket (Leitura de repositório)",
    ">Name<": ">Nome<",
    'placeholder="Your Bitbucket Provider, eg: my-personal-account"': 'placeholder="Seu provedor Bitbucket, ex: minha-conta-pessoal"',
    ">Bitbucket Username<": ">Usuário Bitbucket<",
    'placeholder="Your Bitbucket username"': 'placeholder="Seu usuário Bitbucket"',
    ">Bitbucket Email<": ">Email Bitbucket<",
    'placeholder="Your Bitbucket email"': 'placeholder="Seu email Bitbucket"',
    ">API Token<": ">Token de API<",
    'placeholder="Paste your Bitbucket API token"': 'placeholder="Cole seu token de API do Bitbucket"',
    ">Workspace Name (optional)<": ">Nome do Workspace (opcional)<",
    'placeholder="For organization accounts"': 'placeholder="Para contas de organização"',
    ">Add<": ">Adicionar<",
    ">Save<": ">Salvar<",
    ">Cancel<": ">Cancelar<",
    ">Create<": ">Criar<",
    ">Bitbucket Provider<": ">Provedor Bitbucket<",

    # Gitlab texts
    ">Gitlab Provider<": ">Provedor Gitlab<",
    ">Navigate to Applications<": ">Navegue para Aplicações<",
    ">Name: Dokploy<": ">Nome: easyti<",
    "Scopes: api, read_user, read_repository": "Escopos: api, read_user, read_repository",
    'placeholder="Random Name eg(my-personal-account)"': 'placeholder="Nome, ex: minha-conta-pessoal"',
    ">Gitlab URL<": ">URL do Gitlab<",
    ">Internal URL (Optional)<": ">URL Interna (Opcional)<",
    ">Redirect URI<": ">URI de Redirecionamento<",
    ">Application ID<": ">Application ID<",
    'placeholder="Application ID"': 'placeholder="ID da Aplicação"',
    ">Application Secret<": ">Application Secret<",
    'placeholder="Application Secret"': 'placeholder="Secret da Aplicação"',
    ">Group Name (optional)<": ">Nome do Grupo (opcional)<",
    'placeholder="For organization/group access use the slugish name of the group eg: my-org"': 'placeholder="Para acesso de organização/grupo use o nome slug do grupo ex: minha-org"',
    
    # Gitea texts
    ">Gitea Provider<": ">Provedor Gitea<",
    ">Create a new OAuth2 application<": ">Crie uma nova aplicação OAuth2<",
    ">Name: Dokploy<": ">Nome: easyti<",
    ">Redirect URIs:<": ">URIs de Redirecionamento:<",
    ">Gitea URL<": ">URL do Gitea<",
    ">Client ID<": ">Client ID<",
    'placeholder="Client ID"': 'placeholder="ID do Cliente"',
    ">Client Secret<": ">Client Secret<",
    'placeholder="Client Secret"': 'placeholder="Secret do Cliente"',

    # General / Other
    ">Available Providers<": ">Provedores Disponíveis<",
    ">Create your first Git Provider<": ">Adicione seu primeiro Provedor Git<",
}

for file_path in files:
    with open(file_path, "r") as f:
        text = f.read()

    for eng, pt in translations.items():
        text = text.replace(eng, pt)
        
    with open(file_path, "w") as f:
        f.write(text)

print("Done patching.")
