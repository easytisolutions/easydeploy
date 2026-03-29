import re

file_path = "apps/dokploy/pages/dashboard/project/[projectId]/environment/[environmentId].tsx"
with open(file_path, "r") as f:
    content = f.read()

# removing the dropdown
content = re.sub(r'\{permissions\?\.service\.create\s+&&\s+projectServicesCount\s+===\s+0\s+&&\s+\(\s*<DropdownMenu>[\s\S]*?</DropdownMenu>\s*\)\}', '', content)

with open(file_path, "w") as f:
    f.write(content)
