# 🧠 CONTEXTO MESTRE: Projeto VitaeWeb
**Data de Handoff**: 2026-03-15
**De**: Agente-Remoto (VPS)
**Para**: Agente-Local (Máquina do Usuário)

---

## 🚀 Visão Geral
Você está assumindo o desenvolvimento de um sistema de gestão de escalas de motoristas (VitaeWeb). O projeto foi estabilizado na VPS e passou por uma fase intensa de otimização e implementação de regras de negócio complexas.

### 🛠️ Stack Tecnológica
- **Backend**: Java 17, Spring Boot 3.2.x, PostgreSQL 15, Hibernate (JPA).
- **Frontend**: React 19, Vite, Tailwind CSS v4.
- **Infra**: Docker & Docker Compose (Perfis `dev` e `prod`).
- **Nginx**: Atua como proxy reverso em produção, servindo o frontend e redirecionando `/api`.

---

## ⚖️ Regras de Negócio (Lógica de Conformidade)
Este é o coração do sistema. As regras estão centralizadas no `CirandaService.java` e `TripService.java`.

1. **Interjornada (11h)**: O sistema impede/alerta se um motorista assumir uma viagem sem 11h de descanso após a chegada da anterior. 
   - *Atenção*: Corrigido bug de NPE onde viagens sem `actualArrivalTime` quebravam o cálculo. Agora usamos `departureTime` como fallback seguro.
2. **Dobra (Ciclo de 7 dias)**:
   - Motoristas podem trabalhar no máximo 6 dias consecutivos.
   - O 7º dia consecutivo de trabalho é automaticamente marcado como `isDobra = true`.
   - O ciclo reseta apenas após um descanso de **36h**.
3. **Limite Solo (5.5h)**: *Próxima etapa a implementar*. Verificação de direção contínua.

---

## ⚡ Otimizações Realizadas (Sessão Atual)
1. **Backend (N+1 Purge)**: 
   - O `TripRepository` foi otimizado com `@EntityGraph`. 
   - Reduzimos centenas de queries para **uma única query com JOINs** ao carregar a lista de viagens.
2. **Frontend (SWR-like Cache)**:
   - Implementado um objeto `dataCache` global no `App.jsx`.
   - A Dashboard agora carrega dados instantaneamente se já os tiver visto antes, revalidando em background (polling silencioso).
3. **UX (Feedback Visual)**:
   - Adicionados Skeletons e Loading Spinners em todos os modais e tabelas críticas.
   - Botões de ação (como "Confirmar Cancelamento") ficam desabilitados durante a requisição para evitar double-click.

---

## 📁 Estrutura de Arquivos e Workflow
- **Código**: `/home/ubuntu/VitaeWeb`
- **Obsidian**: `/home/ubuntu/docs-obsidian` (MOVIMENTADO HOJE: Repositório separado da VPS, não deve ser incluído no Git do projeto).
- **Commits**: Mantemos o padrão `feat(escopo)`, `fix(escopo)`, `docs`, `chore`.
- **Ambientes**:
  - `dev`: Hot Reload, API exposta na porta 8080.
  - `prod`: Build otimizado, Nginx na porta 80.

---

## 🚩 Status Atual e Pendências
- **Bug Tracker**: `VitaeWeb-Fix-Log.md` (no Obsidian) está limpo para as tarefas de hoje.
- **Tasks**: Focar na implementação do **Descanso Semanal de 36h** e **Rendição Solo**.
- **Infra**: A VPS está rodando o perfil `prod` agora. Para voltar ao desenvolvimento, use `/switch-env`.

---

## 🔑 Credenciais (Segurança)
- As senhas no `docker-compose.yml` foram protegidas com aspas simples `'` para evitar que o caractere `#` quebre a interpretação das envs no Docker. 
- Usuário DB: `vitae_db_admin`
- Password: `'Vitae_Secure#2026'`

---

*Assinado: Agente-Remoto VPS. Transmitindo sinal... Boa sorte, parceiro.*
