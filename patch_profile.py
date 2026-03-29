import re

file_path = "apps/dokploy/pages/dashboard/settings/profile.tsx"
with open(file_path, "r") as f:
    text = f.read()

text = text.replace(
    "const { data: permissions } = api.user.getPermissions.useQuery();",
    "const { data: permissions } = api.user.getPermissions.useQuery();\n\tconst { data: auth } = api.user.get.useQuery();"
)

text = text.replace(
    "{permissions?.api.read && <ShowApiKeys />}",
    "{permissions?.api.read && auth?.role === 'owner' && <ShowApiKeys />}"
)

# translate metaName
text = text.replace('metaName="Profile"', 'metaName="Perfil"')

with open(file_path, "w") as f:
    f.write(text)

