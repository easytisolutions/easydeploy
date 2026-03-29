import re

# 1. Update show-registry.tsx
file_path_show = "apps/dokploy/components/dashboard/settings/cluster/registry/show-registry.tsx"
with open(file_path_show, "r") as f:
    text_show = f.read()

# Fix icon color
text_show = text_show.replace('text-muted-foreground self-center', 'text-easyti-primary self-center')

translations_show = {
    '>Docker Registry<': '>Docker Registry<',
    'Manage your Docker Registry configurations': 'Gerencie as configurações do seu Docker Registry',
    'title="Delete Registry"': 'title="Excluir Registry"',
    'description="Are you sure you want to delete this registry configuration?"': 'description="Tem certeza de que deseja excluir esta configuração de registry?"',
}

for eng, pt in translations_show.items():
    text_show = text_show.replace(eng, pt)

with open(file_path_show, "w") as f:
    f.write(text_show)

# 2. Update handle-registry.tsx
file_path_handle = "apps/dokploy/components/dashboard/settings/cluster/registry/handle-registry.tsx"
with open(file_path_handle, "r") as f:
    text_handle = f.read()

translations_handle = {
    '<Button className="cursor-pointer space-x-3">': '<Button className="bg-easyti-primary text-white hover:bg-easyti-primary/90 cursor-pointer space-x-3">',
    '>Add a external registry<': '>Adicionar um registry externo<',
    'You can add your external docker registry to pull images from it.': 'Você pode adicionar seu docker registry externo para extrair imagens dele.',
    '>Registry Name<': '>Nome do Registry<',
    'placeholder="my-registry"': 'placeholder="meu-registry"',
    '>Username<': '>Usuário<',
    'placeholder="username"': 'placeholder="usuário"',
    '>Password{registryId && " (Optional)"}<': '>Senha{registryId && " (Opcional)"}<',
    'placeholder="password"': 'placeholder="senha"',
    '>Image Prefix<': '>Prefixo da Imagem<',
    'placeholder="username/project"': 'placeholder="usuario/projeto"',
    '>Registry URL<': '>URL do Registry<',
    'placeholder="https://index.docker.io/v1/"': 'placeholder="https://index.docker.io/v1/"',
    '>Server {!isCloud && "(Optional)"}<': '>Servidor {!isCloud && "(Opcional)"}<',
    'placeholder="Select a Server"': 'placeholder="Selecione um Servidor"',
    '>Test Connection<': '>Testar Conexão<',
    '>Create<': '>Criar<',
    '>Save<': '>Salvar<',
}

for eng, pt in translations_handle.items():
    text_handle = text_handle.replace(eng, pt)

with open(file_path_handle, "w") as f:
    f.write(text_handle)

