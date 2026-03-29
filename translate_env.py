import re

file_path = "apps/dokploy/pages/dashboard/project/[projectId]/environment/[environmentId].tsx"
with open(file_path, "r") as f:
    text = f.read()

translations = {
    'placeholder="Sort by..."': 'placeholder="Ordenar por..."',
    'placeholder="Filter services..."': 'placeholder="Filtrar serviços..."',
    'Recently deployed': 'Recentemente implantado',
    'Newest first': 'Mais recentes primeiro',
    'Oldest first': 'Mais antigos primeiro',
    '>Name (A-Z)<': '>Nome (A-Z)<',
    '>Name (Z-A)<': '>Nome (Z-A)<',
    '>Type (A-Z)<': '>Tipo (A-Z)<',
    '>Type (Z-A)<': '>Tipo (Z-A)<',
    '>Filter...<': '>Filtrar...<',
    'No services found with the current filters': 'Nenhum serviço encontrado com os filtros atuais',
    'Bulk Actions': 'Ações em Massa',
    'Start Services': 'Iniciar Serviços',
    'Stop Services': 'Parar Serviços',
    'Redeploy Services': 'Reimplantar Serviços',
    'Move Services': 'Mover Serviços',
    'Delete Services': 'Excluir Serviços',
    'Cancel': 'Cancelar',
    'Select a project': 'Selecione um projeto',
    'Select an environment': 'Selecione um ambiente',
    'Move': 'Mover',
}

for eng, pt in translations.items():
    text = text.replace(eng, pt)

with open(file_path, "w") as f:
    f.write(text)

