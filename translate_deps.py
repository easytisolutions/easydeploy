import re

file_path = "apps/dokploy/components/dashboard/deployments/show-deployments-table.tsx"
with open(file_path, "r") as f:
    text = f.read()

translations = {
    '>Service<': '>Serviço<',
    '>Project<': '>Projeto<',
    '>Environment<': '>Ambiente<',
    '>Server<': '>Servidor<',
    '>Status<': '>Status<',
    '>Time<': '>Tempo<',
    '>Date<': '>Data<',
    '>Actions<': '>Ações<',
    'placeholder="Search deployments..."': 'placeholder="Buscar deploys..."',
    '>All Statuses<': '>Todos os Status<',
    '>All Types<': '>Todos os Tipos<',
    '>Previous<': '>Anterior<',
    '>Next<': '>Próximo<',
    'No deployments found': 'Nenhum deploy encontrado',
}

for eng, pt in translations.items():
    text = text.replace(eng, pt)

with open(file_path, "w") as f:
    f.write(text)

