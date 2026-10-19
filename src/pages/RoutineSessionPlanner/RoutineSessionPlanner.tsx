import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Info,
  CheckCircle2,
  Layers,
  ExternalLink,
} from "lucide-react";
import Button from "../../components/Button/Button";
import Badge from "../../components/Badge/Badge";
import SportTag from "../../components/SportTag/SportTag";
import FormField from "../../components/FormField/FormField";
import { rotinaService } from "../../services/rotinaService";
import { isRoutineActive, metricLabels } from "../../features/routines/routineModel";
import { getPreenchimentoLabel } from "../../features/metrics/metricModel";
import { authError } from "../../utils/authError";
import { parseAtividades, serializeAtividades } from "../../utils/activityParser";
import type {
  PlanejamentoRotinaResponseDTO,
  RotinaResponse,
  SessaoTreinoPlanejadaDTO,
} from "../../types/rotina";
import "./RoutineSessionPlanner.css";

interface ActivityBlock {
  id: string;
  title: string;
  description: string;
}

function defaultPlannedDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function formatDateBr(iso?: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!d) return iso;
  return `${d}/${m}/${y}`;
}

function parseSessionPreview(atividades?: string | null): {
  headline: string;
  items: string[];
} {
  const parsed = parseAtividades(atividades);
  const headline =
    parsed.sessionName ||
    (parsed.activities.length > 0 ? parsed.activities[0].title : "Sessão planejada");
  const items = parsed.activities.map((a) =>
    a.description ? `${a.title}: ${a.description}` : a.title
  );
  if (parsed.orientations) {
    items.push(`Orientações: ${parsed.orientations}`);
  }
  return { headline, items };
}

export default function RoutineSessionPlanner() {
  const { routineId = "" } = useParams();
  const navigate = useNavigate();

  const [routine, setRoutine] = useState<RotinaResponse | null>(null);
  const [planning, setPlanning] = useState<PlanejamentoRotinaResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Semanas gerenciadas na tela
  const [extraWeeks, setExtraWeeks] = useState<number[]>([1]);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  // Estados do formulário de Nova Sessão (Padrão Figma 551:8884)
  const [sessionName, setSessionName] = useState("");
  const [plannedDate, setPlannedDate] = useState<string>(() => defaultPlannedDate());
  const [duration, setDuration] = useState("45 min");
  const [orientations, setOrientations] = useState("");

  // Lista de blocos de atividades da sessão (sem valores estáticos)
  const [activities, setActivities] = useState<ActivityBlock[]>([]);

  // Edição inline de um bloco existente
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Adição de novo bloco
  const [addingNewActivity, setAddingNewActivity] = useState(false);
  const [newActTitle, setNewActTitle] = useState("");
  const [newActDesc, setNewActDesc] = useState("");

  const loadData = useCallback(async () => {
    if (!routineId) return;
    setLoading(true);
    setError("");
    try {
      const [routineData, planningData] = await Promise.all([
        rotinaService.buscarPorId(routineId),
        rotinaService.consultarPlanejamento(routineId),
      ]);
      setRoutine(routineData);
      setPlanning(planningData);

      if (planningData.semanas && planningData.semanas.length > 0) {
        const weekNums = planningData.semanas.map((s) => s.numeroSemana);
        setExtraWeeks((prev) => Array.from(new Set([...prev, ...weekNums])).sort((a, b) => a - b));
      }
    } catch (err) {
      setError(authError(err, "Não foi possível carregar o planejamento da rotina.").message);
    } finally {
      setLoading(false);
    }
  }, [routineId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Todas as semanas disponíveis nas abas
  const allWeekNumbers = useMemo(() => {
    const fromBackend = (planning?.semanas || []).map((w) => w.numeroSemana);
    const merged = Array.from(new Set([1, ...extraWeeks, ...fromBackend])).sort((a, b) => a - b);
    return merged;
  }, [planning?.semanas, extraWeeks]);

  // Sessões da semana atualmente selecionada
  const currentWeekSessions = useMemo<SessaoTreinoPlanejadaDTO[]>(() => {
    const found = (planning?.semanas || []).find((w) => w.numeroSemana === selectedWeek);
    return found ? found.sessoes : [];
  }, [planning?.semanas, selectedWeek]);

  // Total de sessões em toda a rotina
  const totalSessionsCount = useMemo(() => {
    return (planning?.semanas || []).reduce((acc, w) => acc + w.sessoes.length, 0);
  }, [planning?.semanas]);

  const handleAddWeekTab = () => {
    const nextWeek = (allWeekNumbers[allWeekNumbers.length - 1] || 1) + 1;
    setExtraWeeks((prev) => Array.from(new Set([...prev, nextWeek])).sort((a, b) => a - b));
    setSelectedWeek(nextWeek);
  };

  // Manipulação de blocos de atividades
  const handleStartEditActivity = (act: ActivityBlock) => {
    setEditingActivityId(act.id);
    setEditTitle(act.title);
    setEditDesc(act.description);
  };

  const handleSaveEditActivity = (id: string) => {
    if (!editTitle.trim()) {
      toast.error("Informe o título do bloco de atividade.");
      return;
    }
    setActivities((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              title: editTitle.trim(),
              description: editDesc.trim(),
            }
          : a
      )
    );
    setEditingActivityId(null);
  };

  const handleDeleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const handleConfirmAddActivity = () => {
    if (!newActTitle.trim()) {
      toast.error("Informe o título da atividade.");
      return;
    }
    const newBlock: ActivityBlock = {
      id: `act-${Date.now()}`,
      title: newActTitle.trim(),
      description: newActDesc.trim() || "Conforme orientação",
    };
    setActivities((prev) => [...prev, newBlock]);
    setNewActTitle("");
    setNewActDesc("");
    setAddingNewActivity(false);
  };

  // Salvar Nova Sessão na Rotina (POST /api/personal-trainers/rotinas/{id}/sessoes)
  const handleCreateSession = async () => {
    if (!routine) return;

    if (!plannedDate) {
      toast.error("A data planejada é obrigatória.");
      return;
    }

    if (selectedWeek < 1) {
      toast.error("O número da semana deve ser no mínimo 1.");
      return;
    }

    const durMin = parseInt(duration.replace(/\D/g, ""), 10);
    if (!durMin || durMin < 1) {
      toast.error("A duração deve ser de no mínimo 1 minuto.");
      return;
    }

    if (activities.length === 0 && !sessionName.trim() && !orientations.trim()) {
      toast.error("Adicione ao menos uma atividade ou descrição para a sessão.");
      return;
    }

    setSaving(true);
    try {
      const serialized = serializeAtividades({
        sessionName,
        activities,
        orientations,
      });

      await rotinaService.adicionarSessao(routineId, {
        semana: selectedWeek,
        dataPlanejada: plannedDate,
        duracao: durMin,
        atividades: serialized,
      });

      toast.success(`Sessão adicionada à Semana ${selectedWeek} com sucesso!`);

      // Prepara o formulário para a próxima sessão da semana
      setSessionName("");
      setOrientations("");
      setActivities([]);
      const nextDate = new Date(plannedDate + "T12:00:00");
      if (!Number.isNaN(nextDate.getTime())) {
        nextDate.setDate(nextDate.getDate() + 2);
        setPlannedDate(nextDate.toISOString().slice(0, 10));
      }

      await loadData();
    } catch (err) {
      toast.error(authError(err, "Erro ao adicionar sessão à rotina.").message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="session-planner-loading" role="status">
        Carregando planejamento da rotina...
      </div>
    );
  }

  if (error || !routine) {
    return (
      <div className="session-planner-error" role="alert">
        <h2>Não foi possível carregar a rotina</h2>
        <p>{error || "Rotina não encontrada."}</p>
        <div className="session-planner-error__actions">
          <Button variant="secondary" onClick={() => navigate("/rotinas")}>
            Voltar às rotinas
          </Button>
          <Button onClick={() => void loadData()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  const active = isRoutineActive(routine);
  const targetFreq = routine.frequenciaSemanal || 1;
  const plannedInWeek = currentWeekSessions.length;
  const progressPct = Math.min(100, Math.round((plannedInWeek / targetFreq) * 100));
  const firstStudent = routine.alunos?.[0];

  const sportName = routine.nomeModalidade || routine.modalidade?.nome;

  return (
    <div className="session-planner-page">
      {/* Breadcrumb */}
      <nav className="session-planner__breadcrumb" aria-label="Navegação">
        <Link to="/rotinas">Rotinas</Link>
        <span>/</span>
        <span>{routine.titulo}</span>
        <span>/</span>
        <span>Planejar sessões</span>
      </nav>

      {/* Header */}
      <div className="session-planner__header">
        <div className="session-planner__title-section">
          <h1>Adicionar sessão · {routine.titulo}</h1>

          <div className="session-planner__meta-bar">
            <SportTag sport={sportName} />

            <Badge tone={active ? "success" : "neutral"}>
              {active ? "● Rotina ativa" : "● Rotina encerrada"}
            </Badge>

            <Badge tone="info">
              Meta: {targetFreq}× por semana
            </Badge>

            <span className="session-planner__meta-text">
              {totalSessionsCount}{" "}
              {totalSessionsCount === 1 ? "sessão cadastrada" : "sessões cadastradas"} no total ·{" "}
              {routine.alunos?.length || 0}{" "}
              {(routine.alunos?.length || 0) === 1 ? "aluno vinculado" : "alunos vinculados"}
            </span>
          </div>
        </div>

        <div className="session-planner__actions">
          <Button
            variant="secondary"
            onClick={() => navigate("/rotinas")}
            disabled={saving}
          >
            Voltar às rotinas
          </Button>
          {active && (
            <Button
              variant="primary"
              onClick={() => void handleCreateSession()}
              disabled={saving}
            >
              {saving ? "Salvando..." : `+ Salvar sessão na Semana ${selectedWeek}`}
            </Button>
          )}
        </div>
      </div>

      {/* Barra de Semanas & Meta de Frequência Semanal (US-09 C5 / RN-011) */}
      <section className="workspace-card session-planner__weeks-bar" aria-label="Semanas da rotina">
        <div className="session-planner__weeks-top">
          <div className="session-planner__week-tabs" role="tablist">
            {allWeekNumbers.map((weekNum) => {
              const count =
                (planning?.semanas || []).find((w) => w.numeroSemana === weekNum)?.sessoes.length ||
                0;
              const isSelected = weekNum === selectedWeek;
              return (
                <button
                  key={weekNum}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`session-planner__week-tab ${isSelected ? "is-active" : ""}`}
                  onClick={() => setSelectedWeek(weekNum)}
                >
                  <span>Semana {weekNum}</span>
                  <span className="week-tab-count">
                    {count}/{targetFreq}
                  </span>
                </button>
              );
            })}

            {active && (
              <button
                type="button"
                className="session-planner__add-week-btn"
                onClick={handleAddWeekTab}
                title="Adicionar nova semana ao planejamento"
              >
                <Plus size={14} /> Nova semana
              </button>
            )}
          </div>

          <div className="session-planner__freq-summary">
            <div className="freq-summary-text">
              <strong>
                {plannedInWeek} de {targetFreq} sessões planejadas na Semana {selectedWeek}
              </strong>
              {plannedInWeek < targetFreq ? (
                <Badge tone="warning">
                  Faltam {targetFreq - plannedInWeek} para a meta semanal
                </Badge>
              ) : plannedInWeek === targetFreq ? (
                <Badge tone="success">● Meta semanal atingida</Badge>
              ) : (
                <Badge tone="info">
                  ● Meta atingida (+{plannedInWeek - targetFreq} sessão extra)
                </Badge>
              )}
            </div>
            <div className="freq-progress-track" aria-hidden="true">
              <div
                className={`freq-progress-fill ${
                  plannedInWeek >= targetFreq ? "is-complete" : ""
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Grid Principal: Coluna Esquerda (Formulário padrão 551:8884) | Coluna Direita (Sessões da Semana & Métricas) */}
      <div className="session-planner__grid">
        {/* Coluna Esquerda: Formulário de Nova Sessão */}
        <div className="session-planner__left-col">
          {!active ? (
            <div className="workspace-card session-planner__card">
              <h2>Rotina encerrada</h2>
              <p className="session-planner__muted">
                Esta rotina já foi encerrada e não recebe novas sessões planejadas. Você pode
                consultar as sessões históricas ao lado ou reutilizar esta rotina como modelo.
              </p>
            </div>
          ) : (
            <>
              {/* Card 1: Dados da sessão */}
              <section
                className="workspace-card session-planner__card"
                aria-label="Dados da nova sessão"
              >
                <div className="session-planner__card-head">
                  <div>
                    <h2>Dados da sessão · Semana {selectedWeek}</h2>
                    <p>Configure a identificação, data prevista e duração estimada do treino</p>
                  </div>
                  <Badge tone="neutral">Sessão #{plannedInWeek + 1} da semana</Badge>
                </div>

                <div className="session-planner__form-row">
                  <FormField
                    id="planner-session-name"
                    label="Nome / foco da sessão"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="Ex: Recuperação ativa, Série de resistência..."
                  />

                  <FormField
                    id="planner-week-number"
                    label="Semana *"
                    type="number"
                    min={1}
                    value={String(selectedWeek)}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                      setSelectedWeek(val);
                      setExtraWeeks((prev) =>
                        Array.from(new Set([...prev, val])).sort((a, b) => a - b)
                      );
                    }}
                  />

                  <FormField
                    id="planner-planned-date"
                    label="Data planejada *"
                    type="date"
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                  />

                  <FormField
                    id="planner-duration"
                    label="Duração estimada *"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="45 min"
                  />
                </div>
              </section>

              {/* Card 2: Atividades planejadas (Padrão Figma 551:8884) */}
              <section
                className="workspace-card session-planner__card"
                aria-label="Atividades planejadas"
              >
                <header className="session-planner__activities-header">
                  <div>
                    <h2>Atividades planejadas</h2>
                    <p>Estruture os blocos de exercícios que o aluno executará nesta sessão</p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setAddingNewActivity(true)}
                  >
                    <Plus size={15} /> Adicionar atividade
                  </Button>
                </header>

                {addingNewActivity && (
                  <div className="session-planner__add-activity-box">
                    <h4>Novo bloco de atividade</h4>
                    <div className="activity-inputs">
                      <input
                        type="text"
                        placeholder="Título do bloco (ex: Aquecimento, Educativos, Série principal)"
                        value={newActTitle}
                        onChange={(e) => setNewActTitle(e.target.value)}
                        className="act-input-title"
                      />
                      <input
                        type="text"
                        placeholder="Descrição detalhada (ex: 4 × 50 m · pernada com prancha · descanso 20 s)"
                        value={newActDesc}
                        onChange={(e) => setNewActDesc(e.target.value)}
                        className="act-input-desc"
                      />
                    </div>
                    <div className="activity-buttons">
                      <Button
                        variant="ghost"
                        onClick={() => setAddingNewActivity(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleConfirmAddActivity}
                      >
                        Confirmar bloco
                      </Button>
                    </div>
                  </div>
                )}

                {activities.length === 0 ? (
                  <div className="session-planner__empty-activities">
                    <p>Nenhum bloco adicionado ainda. Clique em "+ Adicionar atividade" acima.</p>
                  </div>
                ) : (
                  <div className="session-planner__activities-list">
                    {activities.map((act, index) => (
                      <div key={act.id} className="session-planner__activity-item">
                        <div className="activity-num">{index + 1}</div>

                        {editingActivityId === act.id ? (
                          <div className="activity-edit-inline">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="act-input-title"
                              placeholder="Título"
                            />
                            <input
                              type="text"
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              className="act-input-desc"
                              placeholder="Descrição"
                            />
                            <div className="inline-act-actions">
                              <button
                                type="button"
                                className="inline-btn save"
                                onClick={() => handleSaveEditActivity(act.id)}
                                title="Salvar bloco"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                type="button"
                                className="inline-btn cancel"
                                onClick={() => setEditingActivityId(null)}
                                title="Cancelar"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="activity-details">
                              <div className="activity-title-line">
                                <strong>{act.title}</strong>
                              </div>
                              <span className="activity-desc">{act.description}</span>
                            </div>

                            <div className="activity-actions">
                              <button
                                type="button"
                                className="act-action-btn"
                                onClick={() => handleStartEditActivity(act)}
                                title="Editar atividade"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                type="button"
                                className="act-action-btn delete"
                                onClick={() => handleDeleteActivity(act.id)}
                                title="Remover atividade"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Card 3: Orientações ao aluno */}
              <section
                className="workspace-card session-planner__card"
                aria-label="Orientações"
              >
                <h2>Orientações ao aluno</h2>
                <div className="session-planner__orientations-box">
                  <textarea
                    rows={3}
                    value={orientations}
                    onChange={(e) => setOrientations(e.target.value.slice(0, 500))}
                    placeholder="Instruções de ritmo, respiração, intervalos ou cuidados específicos para esta sessão..."
                  />
                  <div className="orientations-footer">
                    <span className="char-count">{orientations.length}/500 caracteres</span>
                    <Button
                      variant="primary"
                      onClick={() => void handleCreateSession()}
                      disabled={saving}
                    >
                      {saving
                        ? "Adicionando..."
                        : `+ Adicionar sessão à Semana ${selectedWeek}`}
                    </Button>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Coluna Direita: Sessões da Semana Selecionada & Métricas da Rotina */}
        <div className="session-planner__right-col">
          {/* Card 1: Sessões já planejadas na Semana selecionada */}
          <section
            className="workspace-card session-planner__card"
            aria-label={`Sessões da Semana ${selectedWeek}`}
          >
            <header className="session-planner__card-head">
              <div>
                <h2>Sessões da Semana {selectedWeek}</h2>
                <p>
                  {currentWeekSessions.length === 0
                    ? "Nenhuma sessão cadastrada nesta semana ainda"
                    : `${currentWeekSessions.length} ${
                        currentWeekSessions.length === 1
                          ? "sessão planejada"
                          : "sessões planejadas"
                      }`}
                </p>
              </div>
              <Layers size={18} className="card-head-icon" />
            </header>

            {currentWeekSessions.length === 0 ? (
              <div className="session-planner__empty-week">
                <Calendar size={28} />
                <p>
                  Preencha o formulário ao lado e clique em{" "}
                  <strong>"+ Salvar sessão na Semana {selectedWeek}"</strong> para montar o
                  cronograma.
                </p>
              </div>
            ) : (
              <div className="session-planner__week-sessions-list">
                {currentWeekSessions.map((sess, idx) => {
                  const preview = parseSessionPreview(sess.atividades);
                  const isDone = Boolean(sess.concluidaAluno || sess.status === "CONCLUIDA");
                  const isValidated = Boolean(sess.validadaPersonal);

                  return (
                    <div key={sess.id} className="week-session-card">
                      <div className="week-session-card__top">
                        <div className="week-session-card__title">
                          <span className="session-index">#{idx + 1}</span>
                          <strong>{preview.headline}</strong>
                        </div>
                        {isValidated ? (
                          <Badge tone="success">● Validada</Badge>
                        ) : isDone ? (
                          <Badge tone="warning">● Concluída</Badge>
                        ) : (
                          <Badge tone="neutral">● Planejada</Badge>
                        )}
                      </div>

                      <div className="week-session-card__meta">
                        <span>
                          <Calendar size={13} /> {formatDateBr(sess.dataPlanejada)}
                        </span>
                        {sess.duracao && (
                          <span>
                            <Clock size={13} /> {sess.duracao} min
                          </span>
                        )}
                      </div>

                      {preview.items.length > 0 && (
                        <ul className="week-session-card__items">
                          {preview.items.slice(0, 3).map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                          {preview.items.length > 3 && (
                            <li className="more-items">
                              +{preview.items.length - 3} bloco(s)
                            </li>
                          )}
                        </ul>
                      )}

                      {firstStudent && (
                        <div className="week-session-card__actions">
                          {!isDone && !isValidated ? (
                            <Link
                              to={`/alunos/${firstStudent.id}/sessoes/${sess.id}/editar`}
                              className="week-session-link"
                            >
                              <Edit2 size={13} /> Editar sessão futura
                            </Link>
                          ) : (
                            <Link
                              to={`/alunos/${firstStudent.id}/sessoes/${sess.id}`}
                              className="week-session-link"
                            >
                              <ExternalLink size={13} /> Ver execução / validar
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Card 2: Métricas acompanhadas nesta rotina */}
          <section
            className="workspace-card session-planner__card"
            aria-label="Métricas da rotina"
          >
            <header className="session-planner__card-head">
              <div>
                <h2>Métricas desta rotina</h2>
                <p>
                  Da modalidade {routine.nomeModalidade || routine.modalidade?.nome || "Esporte"} ·
                  registradas em cada sessão
                </p>
              </div>
            </header>

            <div className="session-planner__metrics-list">
              {routine.metricas && routine.metricas.length > 0 ? (
                routine.metricas.map((m) => (
                  <div key={m.id} className="planner-metric-item">
                    <CheckCircle2 size={16} className="metric-check-icon" />
                    <div className="metric-check-text">
                      <strong>{m.titulo}</strong>
                      <span className="metric-type-hint">
                        {metricLabels[m.tipo] || m.tipo} · preenche:{" "}
                        {getPreenchimentoLabel(m.quemPreenche)}
                      </span>
                    </div>
                    <Badge tone={m.obrigatoria !== false ? "danger" : "info"}>
                      {m.obrigatoria !== false ? "Obrigatória" : "Opcional"}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="session-planner__muted">
                  Nenhuma métrica vinculada a esta rotina.
                </p>
              )}
            </div>
          </section>

          {/* Card 3: Informativo de Regras (US-09 C5 / US-10 C1 / US-21 C2) */}
          <div className="session-planner__info-box" role="status">
            <Info size={20} className="info-icon" />
            <div>
              <strong>Planejamento semanal flexível (US-09 / US-10)</strong>
              <p>
                A frequência de {targetFreq}× por semana serve como guia visual de planejamento,
                mas você pode adicionar sessões extras se desejar. Para alunos em rotina ativa,
                apenas a semana atual e a anterior ficam visíveis no aplicativo (US-21 C2).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
