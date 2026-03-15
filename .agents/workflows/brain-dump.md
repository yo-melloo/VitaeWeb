---
description: Resume o progresso da sessão e atualiza o Obsidian.
---

1. Analisar detalhadamente as mudanças feitas nos arquivos do projeto e no Obsidian.
2. Gerar uma explicação técnica educativa no arquivo `B2/Projetos/VitaeWeb-Master-Plan.md` (ou em notas de estudo específicas), detalhando o "porquê" das decisões de código para facilitar a revisão e manutenção futura do usuário.
// turbo
3. Executar `git add .` e `git commit -m "Antigravity Sync: Atualização de progresso e documentação técnica"` na pasta do projeto.
// turbo
4. Fazer o mesmo na pasta `docs-obsidian` para garantir que suas notas foram salvas no GitHub.- [ ] **Feedback de Carregamento (UX)**: Implementado! (Movido para concluído se validado).

### 🛠️ Regras de Entrada (Entrada de Dados):
1. **Relato de Erro**: Sempre que o usuário relatar um erro ou bug, adicionar IMEDIATAMENTE ao arquivo `VitaeWeb-Fix-Log.md` sob a seção "🔴 Erros Ativos".
2. **Nova Ideia/Alteração**: Sempre que o usuário expor uma ideia nova ou mudança de regra de negócio, adicionar ao arquivo `VitaeWeb-Tasks.md`.
3. **Escopo Atômico**: Transformar pedidos grandes em etapas pequenas e organizadas para facilitar o aprendizado e o versionamento (commits).

### 7. Estratégia de Commit:
   - Sempre que uma tarefa no `VitaeWeb-Tasks.md` for marcada como concluída [x], o agente DEVE sugerir um commit específico para os arquivos alterados.
   - Usar Mensagens de Commit Semânticas (feat, fix, refactor, docs).
   - Não acumular mais de 2 tarefas concluídas sem realizar um commit.
