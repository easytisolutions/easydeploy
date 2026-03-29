import re

file_path = "apps/dokploy/components/dashboard/deployments/show-queue-table.tsx"
with open(file_path, "r") as f:
    text = f.read()

translations = {
    '>Job ID<': '>ID do Job<',
    '>Label<': '>Rótulo<',
    '>Type<': '>Tipo<',
    '>State<': '>Estado<',
    '>Added<': '>Adicionado<',
    '>Processed<': '>Processado<',
    '>Finished<': '>Finalizado<',
    '>Error<': '>Erro<',
    '>Actions<': '>Ações<',
    '>No jobs in queue.<': '>Nenhum job na fila.<',
    '>Refresh<': '>Atualizar<',
}

for eng, pt in translations.items():
    text = text.replace(eng, pt)

with open(file_path, "w") as f:
    f.write(text)

