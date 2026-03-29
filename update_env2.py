import re

file_path = "apps/dokploy/pages/dashboard/project/[projectId]/environment/[environmentId].tsx"
with open(file_path, "r") as f:
    content = f.read()

# removing the 'Criar Serviço' button block
content = re.sub(r'\{!projectServicesCount\s+&&\s+permissions\?\.service\.create\s+&&\s+\(\s*<Button\s+className="bg-easyti-primary[^>]*>\s*onClick=\{[\s\S]*?Criar Serviço\s*</Button>\s*\)\}', '', content)

with open(file_path, "w") as f:
    f.write(content)
