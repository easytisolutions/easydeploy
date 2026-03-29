import re

file_path = "apps/dokploy/pages/dashboard/settings/ssh-keys.tsx"
with open(file_path, "r") as f:
    text = f.read()

text = text.replace('if (!user || user.role === "member") {', 'if (!user || user.role !== "owner") {')
with open(file_path, "w") as f:
    f.write(text)

