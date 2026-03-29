# Agente 5: Deploy no Servidor

## Objetivo
Fazer o deploy das mudanças no servidor de produção.

## ⚠️ IMPORTANTE
Este agente requer confirmação do usuário antes de cada passo destrutivo.
Pergunte antes de executar qualquer push ou atualização de serviço.

## Fase 1: Git Commit
```bash
cd /home/vinicius/Projetos/easytiphp/easyti-cloud
git add -A
git status
```
**PARAR e mostrar o status ao usuário. Pedir confirmação para commit.**

```bash
git commit -m "feat(ui): refatoração completa - wizard 2 passos, animações, dashboard moderno

- Novo deploy wizard V2 (2 passos: Import → Configure & Deploy)
- Página de projetos com animações e stagger effects
- Histórico de deploys modernizado com StatusBadge
- Header de aplicação com status em tempo real
- Dashboard home com métricas e quick actions
- Atomic design: motion.tsx, tech-icon.tsx, animated-svgs.tsx, status-badge.tsx
- framer-motion + @icons-pack/react-simple-icons"
```

## Fase 2: Push
**PEDIR CONFIRMAÇÃO ao usuário antes de executar.**
```bash
git push origin main
```

## Fase 3: Atualizar Servidor
**PEDIR CONFIRMAÇÃO ao usuário antes de executar.**
```bash
sshpass -p 'EasyTI@2026' ssh -o StrictHostKeyChecking=no root@app.easyti.cloud \
  'cd /opt/easydeploy && git pull origin main && docker service update --force easydeploy'
```

## Fase 4: Verificação
```bash
# Aguardar 3 minutos para o build completar
sleep 180

# Verificar se o serviço está rodando
sshpass -p 'EasyTI@2026' ssh root@app.easyti.cloud \
  'docker service ls | grep easydeploy && docker service logs easydeploy --tail 20'
```

## Fase 5: Relatório Final
- URL de acesso: https://app.easyti.cloud
- Status do serviço
- Tempo total do deploy
