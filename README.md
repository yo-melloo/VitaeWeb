# Vitae Web 🚌🛣️

O **Vitae Web** é um sistema premium de roteirização e gestão de escalas de ônibus, desenvolvido para empresas de transporte rodoviário. Ele permite que as bases operacionais gerenciem a atribuição de motoristas, trechos de viagem e garantam a conformidade com as leis trabalhistas (Saldo de dias, lógica de "Dobra" e períodos de descanso obrigatórios (11h/36h)).

## 🚀 Principais Funcionalidades

- **Escalabilidade Dinâmica**: Gerencie serviços e trechos de viagens com sequências ordenadas.
- **Conformidade Trabalhista**: Alertas automatizados para "Dobra" (hora extra) e descanso obrigatório (11h interjornada e 36h semanal).
- **Dashboard Interativo**: Monitoramento em tempo real com cards clicáveis para navegação fluida entre motoristas e escalas.
- **Gestão de Faltas e Substituições**: Registro ágil de ausências com motor de sugestão inteligente para reposição imediata.
- **Geração de Escalas em Lote**: Automação para criação de escalas mensais/semanais respeitando perfis operacionais e sequências de serviços.
- **Segurança e Perfis (RBAC)**: Controle de acesso granular, incluindo visualização restrita para motoristas (Mobile-First).
- **Documentação de API**: Integração nativa com Swagger para facilitar o desenvolvimento e integrações.

## 🏗️ Stack Tecnológica

- **Backend**: Java 17, Spring Boot, Spring Data JPA, OpenAPI/Swagger.
- **Frontend**: React, Vite, Tailwind CSS v4.
- **Banco de Dados**: PostgreSQL.
- **DevOps**: Docker, Docker Compose.

## 📖 Documentação da API

Com o backend rodando, a documentação interativa do Swagger está disponível em:
`http://localhost:8080/swagger-ui/index.html`

## 📦 Como Rodar

### Pré-requisito: Docker

Se você tem o Docker instalado, basta rodar:

```bash
docker-compose up --build
```

### Execução Manual

Consulte o `api/README.md` e `web/README.md` para instruções específicas.

## 🤖 Transparência e Uso de IA Generativa

Este projeto foi desenvolvido com alto foco em produtividade rápida, escalando a qualidade de engenharia de software e mantendo a prontidão para implantação comercial. Durante sua criação, **Inteligência Artificial Agêntica (LLMs via Fluxos de Trabalho Agênticos)** foi ativamente utilizada para auxiliar o desenvolvedor principal a construir a base de código, orquestrar configurações do Docker, debugar casos extremos e construir componentes de UI de forma ágil e otimizada.

> [!NOTE]
> O sistema está em fase final de ajustes finos, refinamento de dashboards e usabilidade para motoristas e operadores.

---

### ©️ Licença

Este software é fornecido sob um contrato de licença de usuário final (EULA) proprietário/comercial. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

Desenvolvido por [yo-melloo](https://github.com/yo-melloo)
