// src/pages/StudentSessionEdit/StudentSessionEdit.tsx
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Plus,
  Trash2,
  Edit2,
  Info,
  Shield,
  Check,
  X,
} from "lucide-react";
import Button from "../../components/Button/Button";
import FormField from "../../components/FormField/FormField";
import Badge from "../../components/Badge/Badge";
import SportTag from "../../components/SportTag/SportTag";
import Avatar from "../../components/Avatar/Avatar";
import Checkbox from "../../components/Checkbox/Checkbox";
import { sessionDetailService } from "../../services/sessionDetailService";
import { rotinaService } from "../../services/rotinaService";
import { authError } from "../../utils/authError";
import type { TrainingSession } from "../../types/personalDashboard";
import type { RotinaResponse } from "../../types/rotina";
import type { Sport } from "../../components/SportTag/SportTag";
import "./StudentSessionEdit.css";

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  altered?: boolean;
}

export default function StudentSessionEdit() {
  const { studentId = "", sessionId = "" } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [routine, setRoutine] = useState<RotinaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [sessionName, setSessionName] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [duration, setDuration] = useState("");
  const [orientations, setOrientations] = useState("");

  // Atividades
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Nova atividade inline
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Métricas selecionadas
  const [selectedMetrics, setSelectedMetrics] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    try {
      const sessionData = await sessionDetailService.obterSessao(sessionId);
      setSession(sessionData);

      if (sessionData.status === "CONCLUIDA" || sessionData.concluidaAluno) {
        toast.error("Não é possível editar uma sessão já executada.");
        navigate(`/alunos/${studentId}`);
        return;
      }

      setPlannedDate(sessionData.dataPlanejada || "");
      setDuration(sessionData.duracao ? `${sessionData.duracao} min` : "40 min");

      // Parse atividades
      if (sessionData.atividades) {
        const lines = sessionData.atividades.split("\n").filter((l) => l.trim().length > 0);
        const parsed: ActivityItem[] = lines.map((line, idx) => {
          const parts = line.split("·");
          const title = parts[0]?.trim() || `Atividade ${idx + 1}`;
          const description = parts.slice(1).join("·").trim() || line;
          return {
            id: `act-${idx}`,
            title,
            description,
          };
        });
        setActivities(parsed);
      } else {
        setActivities([
          { id: "1", title: "Aquecimento", description: "300 m · nado livre · ritmo leve" },
          { id: "2", title: "Educativos", description: "4 × 50 m · pernada com prancha · descanso 20 s" },
          { id: "3", title: "Nado contínuo", description: "800 m · ritmo confortável · FC até 135 bpm" },
        ]);
      }

      setSessionName(`Recuperação ativa`);
      setOrientations(
        "Intensidade baixa, foco em técnica e respiração. Se o ombro incomodar, troque a braçada por pernada."
      );

      // Carrega rotina para obter métricas da modalidade
      if (sessionData.rotinaTreinoId) {
        try {
          const routineData = await rotinaService.buscarPorId(sessionData.rotinaTreinoId);
          setRoutine(routineData);

          const initialMetrics: Record<string, boolean> = {};
          (routineData.metricas || []).forEach((m: { id: string }) => {
            initialMetrics[m.id] = true; // Por padrão, selecionadas
          });
          setSelectedMetrics(initialMetrics);
        } catch {
          // Rotina básica
        }
      }
    } catch (err) {
      setError(authError(err, "Não foi possível carregar a sessão.").message);
    } finally {
      setLoading(false);
    }
  }, [sessionId, studentId, navigate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="session-edit-loading" role="status">
        Carregando formulário de edição...
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="session-edit-error" role="alert">
        <h2>Sessão indisponível</h2>
        <p>{error || "A sessão não foi encontrada."}</p>
        <Link to={`/alunos/${studentId}`}>← Voltar ao perfil do aluno</Link>
      </div>
    );
  }

  const handleAddActivity = () => {
    if (!newTitle.trim()) {
      toast.error("Informe o título da atividade.");
      return;
    }
    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || newTitle.trim(),
      altered: true,
    };
    setActivities((prev) => [...prev, newAct]);
    setNewTitle("");
    setNewDesc("");
    setIsAddingActivity(false);
  };

  const handleSaveEditActivity = (id: string) => {
    if (!editTitle.trim()) return;
    setActivities((prev) =>
      prev.map((act) =>
        act.id === id
          ? {
              ...act,
              title: editTitle.trim(),
              description: editDesc.trim() || act.description,
              altered: true,
            }
          : act
      )
    );
    setEditingActivityId(null);
  };

  const handleDeleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((act) => act.id !== id));
  };

  const handleSaveSession = async () => {
    if (!plannedDate) {
      toast.error("A data planejada é obrigatória.");
      return;
    }

    setSaving(true);
    try {
      // Monta string de atividades
      const serializedActivities = activities
        .map((act) => `${act.title} · ${act.description}`)
        .join("\n");

      const durMin = parseInt(duration.replace(/\D/g, ""), 10) || 40;

      await sessionDetailService.editarSessaoFutura(sessionId, {
        semana: session.semana,
        dataPlanejada: plannedDate,
        duracao: durMin,
        atividades: `${sessionName ? sessionName + "\n" : ""}${serializedActivities}`,
      });

      toast.success("Planejamento da sessão futura atualizado com sucesso!");
      navigate(`/alunos/${studentId}`);
    } catch (err) {
      toast.error(authError(err, "Erro ao salvar alterações da sessão futura.").message);
    } finally {
      setSaving(false);
    }
  };

  const sportName = (routine?.nomeModalidade || routine?.modalidade?.nome || "academia")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") as Sport;

  return (
    <div className="session-edit-page">
      {/* Breadcrumb */}
      <nav className="session-edit__breadcrumb" aria-label="Navegação">
        <Link to="/alunos">Alunos</Link>
        <span>/</span>
        <Link to={`/alunos/${studentId}`}>{routine?.alunos?.[0]?.nome || "Aluno"}</Link>
        <span>/</span>
        <span>{routine?.titulo || "Rotina"}</span>
        <span>/</span>
        <span>Semana {session.semana}</span>
      </nav>

      {/* Header */}
      <div className="session-edit__header">
        <div className="session-edit__title-section">
          <h1>
            Editar sessão {session.semana} · {sessionName || "Sessão"}
          </h1>

          <div className="session-edit__meta-bar">
            <div className="session-edit__student-badge">
              <Avatar name={routine?.alunos?.[0]?.nome || "Aluno"} tone="info" />
              <span className="session-edit__student-name">
                {routine?.alunos?.[0]?.nome || "Aluno"}
              </span>
            </div>

            <Badge tone="neutral">● Planejada</Badge>
            <SportTag sport={sportName} />
            <span className="session-edit__date-status">Ainda não executada</span>
          </div>
        </div>

        <div className="session-edit__actions">
          <Button
            variant="secondary"
            onClick={() => navigate(`/alunos/${studentId}`)}
            disabled={saving}
          >
            Descartar
          </Button>
          <Button variant="primary" onClick={handleSaveSession} loading={saving}>
            Salvar alterações
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="session-edit__grid">
        {/* Left Column: Form Details & Activities */}
        <div className="session-edit__left-col">
          {/* Card: Dados da sessão */}
          <section className="workspace-card session-edit__card" aria-label="Dados da sessão">
            <h2>Dados da sessão</h2>

            <div className="session-edit__form-row">
              <FormField
                id="session-name"
                label="Nome da sessão"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Ex: Recuperação ativa"
              />
              <FormField
                id="session-date"
                label="Data planejada"
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                required
              />
              <FormField
                id="session-duration"
                label="Duração estimada"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ex: 40 min"
              />
            </div>
          </section>

          {/* Card: Atividades */}
          <section className="workspace-card session-edit__card" aria-label="Atividades">
            <header className="session-edit__activities-header">
              <div>
                <h2>Atividades</h2>
                <p>Edite ou remova atividades · a aluna verá a versão salva</p>
              </div>
              <Button
                variant="secondary"
                icon={<Plus size={16} />}
                onClick={() => setIsAddingActivity(true)}
              >
                Adicionar atividade
              </Button>
            </header>

            {/* Nova atividade form */}
            {isAddingActivity && (
              <div className="session-edit__add-activity-box">
                <h4>Nova atividade</h4>
                <div className="activity-inputs">
                  <input
                    type="text"
                    placeholder="Título (ex: Aquecimento)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="act-input-title"
                  />
                  <input
                    type="text"
                    placeholder="Descrição / séries (ex: 300 m · nado livre · ritmo leve)"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="act-input-desc"
                  />
                </div>
                <div className="activity-buttons">
                  <Button variant="ghost" onClick={() => setIsAddingActivity(false)}>
                    Cancelar
                  </Button>
                  <Button variant="primary" onClick={handleAddActivity}>
                    Adicionar
                  </Button>
                </div>
              </div>
            )}

            {/* Lista de atividades */}
            <div className="session-edit__activities-list">
              {activities.map((act, index) => {
                const isEditing = editingActivityId === act.id;

                return (
                  <div
                    key={act.id}
                    className={`session-edit__activity-item ${act.altered ? "is-altered" : ""}`}
                  >
                    <div className="activity-num">{index + 1}</div>

                    {isEditing ? (
                      <div className="activity-edit-inline">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="act-input-title"
                        />
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="act-input-desc"
                        />
                        <div className="inline-act-actions">
                          <button
                            type="button"
                            className="inline-btn save"
                            onClick={() => handleSaveEditActivity(act.id)}
                            aria-label="Salvar atividade"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            className="inline-btn cancel"
                            onClick={() => setEditingActivityId(null)}
                            aria-label="Cancelar edição"
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
                            {act.altered && <Badge tone="info">● Alterada</Badge>}
                          </div>
                          <span className="activity-desc">{act.description}</span>
                        </div>

                        <div className="activity-actions">
                          <button
                            type="button"
                            className="act-action-btn"
                            onClick={() => {
                              setEditingActivityId(act.id);
                              setEditTitle(act.title);
                              setEditDesc(act.description);
                            }}
                            aria-label="Editar atividade"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            className="act-action-btn delete"
                            onClick={() => handleDeleteActivity(act.id)}
                            aria-label="Excluir atividade"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Card: Orientações para a aluna */}
          <section className="workspace-card session-edit__card" aria-label="Orientações">
            <header className="session-edit__card-header">
              <div>
                <h2>Orientações para a aluna</h2>
                <p>Texto exibido no detalhe da sessão</p>
              </div>
            </header>

            <div className="session-edit__orientations-box">
              <textarea
                rows={3}
                maxLength={500}
                value={orientations}
                onChange={(e) => setOrientations(e.target.value)}
                placeholder="Orientações técnicas, cuidados ou foco da sessão..."
              />
              <span className="char-count">Opcional · até 500 caracteres</span>
            </div>
          </section>
        </div>

        {/* Right Column: Métricas desta sessão & Regras */}
        <div className="session-edit__right-col">
          {/* Card: Métricas desta sessão */}
          <section className="workspace-card session-edit__card" aria-label="Métricas">
            <header className="session-edit__card-header">
              <div>
                <h2>Métricas desta sessão</h2>
                <p>Da modalidade {routine?.nomeModalidade || routine?.modalidade?.nome || "Natação"} · marque as que serão registradas</p>
              </div>
            </header>

            <div className="session-edit__metrics-checklist">
              {routine?.metricas && routine.metricas.length > 0 ? (
                routine.metricas.map((m) => (
                  <div key={m.id} className="metric-check-item">
                    <Checkbox
                      label=""
                      checked={Boolean(selectedMetrics[m.id])}
                      onChange={(e) =>
                        setSelectedMetrics((prev) => ({
                          ...prev,
                          [m.id]: e.target.checked,
                        }))
                      }
                    />
                    <div className="metric-check-text">
                      <strong>{m.titulo}</strong>
                      <span className="metric-type-hint">{m.tipo}</span>
                    </div>
                    <Badge
                      tone={
                        m.obrigatoria
                          ? "danger"
                          : m.quemPreenche === "PERSONAL"
                          ? "neutral"
                          : "info"
                      }
                    >
                      {m.obrigatoria
                        ? "Obrigatória"
                        : m.quemPreenche === "PERSONAL"
                        ? "Personal preenche"
                        : "Opcional"}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="no-metrics-msg">
                  <p>Métricas padrão da modalidade ativas para esta sessão.</p>
                </div>
              )}
            </div>
          </section>

          {/* Card Informativo: Regra US-10 C2 */}
          <div className="session-edit__info-box" role="status">
            <Info size={20} className="info-icon" />
            <div>
              <strong>Somente sessões futuras podem ser editadas</strong>
              <p>
                As sessões já executadas e seus resultados são preservados. Se a aluna já tiver
                iniciado o registro desta sessão, a edição é bloqueada.
              </p>
            </div>
          </div>

          <div className="session-edit__footer-compliance">
            <Shield size={16} />
            <span>Alterações no planejamento ficam registradas com seu nome, data e hora.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
