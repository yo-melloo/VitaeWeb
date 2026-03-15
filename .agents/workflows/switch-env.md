---
description: Alterna entre os perfis de Desenvolvimento (dev) e Produção (prod) do Docker.
---

1. Verificar qual perfil está rodando atualmente.
2. Parar todos os containers ativos para evitar conflitos de portas.
// turbo
3. Executar `docker-compose down`.
4. Perguntar ao usuário para qual perfil deseja mudar (dev ou prod) se não for óbvio, ou alternar automaticamente.
5. Se for para **DESENVOLVIMENTO**:
// turbo
    - Executar `docker-compose --profile dev up -d --build`.
6. Se for para **PRODUÇÃO**:
// turbo
    - Executar `docker-compose --profile prod up -d --build`.
7. Verificar se os containers subiram corretamente com `docker ps`.
