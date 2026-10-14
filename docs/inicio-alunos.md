# Início e Alunos — frontend v2

Referência: seção 410:4919 do Figma. Backend conferido em c316185.
Somente o frontend recebeu alterações de implementação. O backend foi atualizado de origin/main e reconstruído no Docker.

## Rotas e estado

- /home é o destino do login de personal e apresenta indicadores, RPE, pendentes, últimos aceitos, alunos sem rotina e notificações.
- /alunos possui busca por nome/e-mail, filtros por status e modalidade, paginação de oito itens e modais de convite/status/vínculo.
- Os endereços antigos de notificações, últimos aceitos e sem treino redirecionam às seções do Início.
- PersonalProvider mantém os dados compartilhados ao navegar entre Início e Alunos.
- Ações alteram o estado somente após sucesso do servidor. Depois, os dados são reconciliados com a API.
- Atualização adicional ao voltar à janela e a cada 30 segundos enquanto a página estiver visível. Não há WebSocket no backend.
- Requisições têm timeout de 20 segundos. Respostas anteriores a uma mutação não sobrescrevem seu resultado.

## Contratos usados

Todos sob /api/personal-trainers:

| Fluxo | Endpoint |
|---|---|
| Lista completa de alunos | GET /alunos |
| Aprovar / recusar / desativar / reativar | PATCH /alunos/{id}/{acao} |
| Convite de 15 minutos | POST /convites, com modalidadeId |
| Rotinas e turmas | GET /rotinas e GET /turmas |
| Vincular rotina existente | POST /rotinas/{id}/alunos, com alunosIds |
| Histórico por aluno | GET /rotinas/aluno/{id}/historico |
| Notificações | GET /notificacoes |
| Marcar uma como lida | PATCH /notificacoes/{id}/ler |
| Marcar todas como lidas | PATCH /notificacoes/ler-todas |

O catálogo usa o serviço de modalidades existente. A consulta de históricos limita a quatro requisições simultâneas.

## Indicadores e limites

- Sessões da semana: concluídas, desde segunda-feira até hoje, por dataReal, deduplicadas pelo ID da sessão.
- Gráfico: média diária de nivelCansaco (RPE) informado em sessões concluídas, com janelas de 7/30/90 dias. Ausência de RPE não vira zero.
- Não existe definição de um índice normalizado de desempenho na API; portanto, o gráfico mostra RPE com sua escala explícita, sem misturar unidades de métricas diferentes.
- Última sessão da tabela: maior dataReal concluída do histórico do aluno.
- Sem rotina: somente alunos ativos sem vínculo a rotina ativa. Rotinas encerradas não bloqueiam essa lista.
- Últimos aceitos: aprovações realizadas durante a permanência na área Início/Alunos; a API não retorna data de aprovação nem histórico de aceites. Recarregar a página limpa essa lista local.
- Notificações e leitura são persistidas no servidor. Ler uma notificação não resolve pendências de métricas.
- O backend tem e-mails automáticos de eventos, mas não oferece endpoint para enviar convite por e-mail. O modal gera e copia o link; não simula envio.
- Nome do personal vem de nomePersonal na lista de alunos; conta sem alunos usa a saudação genérica.
- Modalidades, Evolução, Relatórios e Configurações da barra lateral aguardam suas respectivas telas. Strava continua indisponível.

## Validação

- npm run build
- ESLint dos arquivos alterados
- node --test tests/auth.test.mjs tests/personal.test.mjs
- Navegador: conta real sem alunos (antes da atualização), cenários isolados de aprovação/recusa/status, erro de servidor, paginação, busca vazia, convite, leitura de notificações, histórico e vínculo de rotina.
- Layout desktop e mobile (390 px), incluindo rolagem restrita à tabela.

Os cenários isolados de navegador não gravam alunos, sessões ou notificações na conta real.
