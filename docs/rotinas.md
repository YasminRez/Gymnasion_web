# Rotinas de Treino — frontend v2

Referência: seção 410:4928 do Figma. Backend conferido em `.agent/skill/gymnasion-api-routes/references/03-turmas-e-rotinas.md`.

## Rotas e Estado

- `/rotinas` agora reside sob `<PersonalProvider><PersonalLayout /></PersonalProvider>`, compartilhando barra lateral (`AppSidebar`), barra superior (`AppTopbar`), contadores de notificações e perfil autenticado.
- A rota suporta o parâmetro `?aluno=<id>`, vindo da listagem de alunos ou perfil, abrindo diretamente o modal de criação pré-preenchido com o aluno selecionado.
- Barra de ferramentas com abas de status:
  - **Todas** (contador total)
  - **Ativas** (contador de rotinas ativas)
  - **Encerradas** (contador de rotinas encerradas)
- Filtro por termo de busca em tempo real (insensível a acentos, consultando título da rotina, objetivos, modalidades ou alunos vinculados) e filtro por modalidade do catálogo oficial.
- Cards modernos com a paleta do Design System (`tokens.css`), badges de modalidade e frequência semanal (ex: `4x por semana`), tags de métricas com ícones específicos de tipo (`imgIconClock`, `imgIconHeart`, `imgIconText`, `imgIconHash`) e lista de alunos com avatares de iniciais.
- Menu de ações individuais por card:
  - **Vincular novos alunos**: abre modal dedicado com seleção apenas de alunos elegíveis (ativos e sem outra rotina ativa no momento).
  - **Reutilizar como modelo (US-25)**: clona a estrutura de métricas e modalidade para outro aluno sem copiar histórico, datas reais ou resultados anteriores, calculando as novas sessões a partir da data de início informada.
  - **Encerrar rotina (US-25)**: altera status para `ENCERRADA`, remove sessões futuras não executadas, desocupa o aluno para receber nova rotina e preserva todo o histórico de execuções passadas.
  - **Excluir rotina (US-12)**: exclusão física para rotinas sem treinos realizados; se o backend retornar `422 Unprocessable Entity` ("Não é possível excluir rotina com sessões já executadas"), o diálogo orienta e permite encerrar a rotina diretamente.
  - **Desvincular aluno**: permite remover aluno da rotina respeitando a regra de permanência de pelo menos 1 aluno ativo (RN-012).

## Contratos Usados

Endpoints sob `/api/personal-trainers/rotinas`:

| Fluxo | Método / Rota | Regras de Negócio / DRS |
|---|---|---|
| Listar rotinas | `GET /api/personal-trainers/rotinas` | US-09: Lista rotinas ativas e encerradas do personal |
| Detalhar rotina | `GET /api/personal-trainers/rotinas/{id}` | Retorna modalidade, frequência, alunos e métricas |
| Listar por aluno | `GET /api/personal-trainers/rotinas/aluno/{alunoId}` | US-11: Consulta rotinas de um aluno específico |
| Criar rotina | `POST /api/personal-trainers/rotinas` | US-09, RN-012: Mínimo 1 aluno ativo, 1 métrica da modalidade e frequência 1..7 |
| Vincular alunos | `POST /api/personal-trainers/rotinas/{id}/alunos` | US-11: Valida se aluno já possui rotina ativa |
| Desvincular aluno | `DELETE /api/personal-trainers/rotinas/{id}/alunos/{alunoId}` | RN-012: Exige que permaneça ao menos 1 aluno |
| Encerrar rotina | `PATCH /api/personal-trainers/rotinas/{id}/encerrar` | US-25: Encerra, descarta sessões futuras e libera aluno |
| Reutilizar modelo | `POST /api/personal-trainers/rotinas/{id}/reutilizar` | US-25: Cópia independente para novo aluno a partir de nova data |
| Excluir rotina | `DELETE /api/personal-trainers/rotinas/{id}` | US-12: Permitido apenas se não houver treinos concluídos |
| Planejamento semanal | `GET /api/personal-trainers/rotinas/{id}/planejamento` | US-10: Consulta árvore de semanas e sessões |

## Validação

- `npm run build` concluído com sucesso (TypeScript + Vite).
- `npm run lint` concluído com zero advertências e erros.
- `node --test tests/routines.test.mjs` (7 novos testes unitários adicionados) + suíte completa de 36 testes passando com sucesso.
