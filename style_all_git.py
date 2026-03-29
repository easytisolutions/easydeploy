import os
import glob

base_dir = "apps/dokploy/components/dashboard/settings/git/"
files = glob.glob(base_dir + "**/*.tsx", recursive=True)

translations = {
    "Unsure if you already have an app?": "Não tem certeza se já tem um aplicativo?",
    "Create GitHub App": "Criar App GitHub",
    'className="self-end"': 'className="self-end bg-easyti-primary text-white hover:bg-easyti-primary/90"',
    'isLoading={form.formState.isSubmitting}': 'isLoading={form.formState.isSubmitting} className="bg-easyti-primary text-white hover:bg-easyti-primary/90"',
    '<Button type="submit">': '<Button type="submit" className="bg-easyti-primary text-white hover:bg-easyti-primary/90">',
    '<Button\n\t\t\t\t\t\ttype="submit"': '<Button className="bg-easyti-primary text-white hover:bg-easyti-primary/90"\n\t\t\t\t\t\ttype="submit"',
    '>Create<': '>Criar<',
    '>Update<': '>Atualizar<',
    '<span>Github</span>': '<span>GitHub</span>',
    '<span>GitLab</span>': '<span>GitLab</span>',
    '<span>Bitbucket</span>': '<span>Bitbucket</span>',
    '<span>Gitea</span>': '<span>Gitea</span>',
}

for file_path in files:
    with open(file_path, "r") as f:
        text = f.read()

    for eng, pt in translations.items():
        text = text.replace(eng, pt)
        
    with open(file_path, "w") as f:
        f.write(text)

print("Done styling.")
