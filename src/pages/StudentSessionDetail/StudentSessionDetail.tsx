// src/pages/StudentSessionDetail/StudentSessionDetail.tsx
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Calendar,
  Activity,
  CheckCircle2,
  Hourglass,
  Lock,
  MessageSquare,
  AlertCircle,
  Timer,
  Hash,
  Heart,
  FileText,
  Flame,
} from "lucide-react";
import Button from "../../components/Button/Button";
import Badge from "../../components/Badge/Badge";
import SportTag from "../../components/SportTag/SportTag";
import Avatar from "../../components/Avatar/Avatar";
import ValidateSessionModal from "../../components/ValidateSessionModal/ValidateSessionModal";
import SessionAuditModal from "../../components/SessionAuditModal/SessionAuditModal";
import SessionCorrectionModal from "../../components/SessionCorrectionModal/SessionCorrectionModal";
import { sessionDetailService } from "../../services/sessionDetailService";
import { authError } from "../../utils/authError";
import type {
  DesempenhoDetalheResponse,
  ObservacaoFeedbackResponse,
} from "../../types/sessionDetail";
import type { Sport } from "../../components/SportTag/SportTag";
import "./StudentSessionDetail.css";

export default function StudentSessionDetail() {
  const navigate = useNavigate();
  const { studentId = "", sessionId = "" } = useParams();

  const [session, setSession] = useState<DesempenhoDetalheResponse | null>(null);
  const [feedbacks, setFeedbacks] = useState<ObservacaoFeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modais
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  // Métrica pendente inline
  const [pendingMetricValue, setPendingMetricValue] = useState("");
  const [savingPendingMetric, setSavingPendingMetric] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [desempenhoData, feedbacksData] = await Promise.all([
        sessionDetailService.obterDesempenho(sessionId),
        sessionDetailService.consultarFeedbacks(studentId).catch(() => []),
      ]);
      setSession(desempenhoData);
      setFeedbacks(feedbacksData);
    } catch (err) {
      setError(authError(err, "Não foi possível carregar os detalhes da sessão.").message);
    } finally {
      setLoading(false);
    }
  }, [sessionId, studentId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="session-detail-loading" role="status">
        Carregando detalhes da sessão...
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="session-detail-error" role="alert">
        <h2>Sessão não encontrada</h2>
        <p>{error || "Não foi possível carregar os dados desta sessão."}</p>
        <Link to={`/alunos/${studentId}`} className="session-detail__back-link">
          ← Voltar ao perfil do aluno
        </Link>
      </div>
    );
  }

  // Verifica se há métricas pendentes para o personal preencher
  const pendingPersonalMetric = session.metricas.find((m) => m.inclusaoPermitida && !m.valor);

  const handleSavePendingMetric = async () => {
    if (!pendingPersonalMetric || !pendingMetricValue.trim()) {
      toast.error("Por favor, preencha o valor da métrica.");
      return;
    }

    setSavingPendingMetric(true);
    try {
      await sessionDetailService.corrigirDesempenho(session.sessaoId, {
        metricas: [
          {
            metricaId: pendingPersonalMetric.metricaId,
            valor: pendingMetricValue.trim(),
          },
        ],
      });
      toast.success("Métrica preenchida e salva com sucesso!");
      setPendingMetricValue("");
      void loadData();
    } catch (err) {
      toast.error(authError(err, "Erro ao salvar a métrica pendente.").message);
    } finally {
      setSavingPendingMetric(false);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    const [, m, d] = iso.split("-");
    if (!d) return iso;
    return `${d}/${m}`;
  };

  const formatFullDate = (iso?: string | null) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    if (!d) return iso;
    return `${d}/${m}/${y}`;
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      const date = new Date(iso);
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  // Ícone por tipo de métrica
  const renderMetricIcon = (tipo: string) => {
    switch (tipo) {
      case "TEMPO":
        return <Timer size={18} className="metric-icon" />;
      case "NUMERICO":
        return <Hash size={18} className="metric-icon" />;
      case "FREQUENCIA_CARDIACA":
        return <Heart size={18} className="metric-icon" />;
      case "TEXTO":
        return <FileText size={18} className="metric-icon" />;
      default:
        return <Activity size={18} className="metric-icon" />;
    }
  };

  // Cálculo da diferença em dias
  const diffDays = () => {
    if (!session.dataPlanejada || !session.dataReal) return "";
    const p = new Date(session.dataPlanejada);
    const r = new Date(session.dataReal);
    const diffTime = r.getTime() - p.getTime();
    const diff = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (diff === 0) return "no mesmo dia do planejado";
    if (diff === 1) return "1 dia após o planejado";
    if (diff > 1) return `${diff} dias após o planejado`;
    if (diff === -1) return "1 dia antes do planejado";
    return `${Math.abs(diff)} dias antes do planejado`;
  };

  // Identifica esportes suportados pelo SportTag
  const sportName = (session.modalidadeNome || "academia")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") as Sport;

  // Busca feedback do personal registrado mais recente
  const personalFeedback = feedbacks.find((f) => f.papelAutor === "PERSONAL_TRAINER");

  return (
    <div className="session-detail-page">
      {/* Top Header & Breadcrumb */}
      <nav className="session-detail__breadcrumb" aria-label="Navegação">
        <Link to="/alunos">Alunos</Link>
        <span>/</span>
        <Link to={`/alunos/${studentId}`}>{session.nomeAluno}</Link>
        <span>/</span>
        <span>{session.rotinaTitulo || "Rotina"}</span>
        <span>/</span>
        <span>Semana {session.semana}</span>
      </nav>

      <div className="session-detail__header">
        <div className="session-detail__title-section">
          <h1>
            Sessão {session.semana} · {session.rotinaTitulo || "Treino"}
          </h1>

          <div className="session-detail__meta-bar">
            <div className="session-detail__student-badge">
              <Avatar name={session.nomeAluno} tone="info" />
              <span className="session-detail__student-name">{session.nomeAluno}</span>
            </div>

            {session.concluidaAluno ? (
              <Badge tone="success">● Concluída pelo aluno</Badge>
            ) : (
              <Badge tone="neutral">● Planejada</Badge>
            )}

            {session.validadaPersonal ? (
              <Badge tone="success">● Validada por você</Badge>
            ) : session.concluidaAluno ? (
              <Badge tone="warning">● Aguardando sua validação</Badge>
            ) : (
              <Badge tone="neutral">● Sessão futura</Badge>
            )}

            <SportTag sport={sportName} />

            <span className="session-detail__dates-label">
              Planejada {formatDate(session.dataPlanejada)}
              {session.dataReal ? ` · Executada ${formatDate(session.dataReal)}` : ""}
            </span>
          </div>
        </div>

        <div className="session-detail__actions">
          {session.concluidaAluno ? (
            <>
              {session.validadaPersonal && (
                <Button variant="ghost" onClick={() => setShowAuditModal(true)}>
                  Histórico de alterações
                </Button>
              )}

              <Button variant="secondary" onClick={() => setShowCorrectionModal(true)}>
                Corrigir registro
              </Button>

              {!session.validadaPersonal && (
                <Button variant="primary" onClick={() => setShowValidateModal(true)}>
                  Validar execução
                </Button>
              )}
            </>
          ) : (
            <Button
              variant="primary"
              onClick={() => navigate(`/alunos/${studentId}/sessoes/${sessionId}/editar`)}
            >
              Editar planejamento
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="session-detail__grid">
        {/* Left Column: Registered Results & Pending Metric Box */}
        <div className="session-detail__left-col">
          {/* Card: Resultados registrados */}
          <section className="workspace-card session-detail__card" aria-label="Resultados">
            <header className="session-detail__card-header">
              <div>
                <h2>Resultados registrados</h2>
                <p>
                  Registrado por {session.nomeAluno} (aluna) ·{" "}
                  {formatDateTime(session.dataRegistro)}
                </p>
              </div>
              <Badge tone="neutral">● Registro manual</Badge>
            </header>

            <div className="session-detail__metrics-list">
              {session.metricas.map((m) => (
                <div key={m.metricaId} className="session-detail__metric-row">
                  <div className="session-detail__metric-info">
                    {renderMetricIcon(m.tipo)}
                    <div>
                      <strong className="metric-title">{m.titulo}</strong>
                      <span className="metric-subtitle">
                        {m.tipo} · {m.obrigatoria ? "Obrigatória" : "Opcional"}
                      </span>
                    </div>
                  </div>

                  <div className="session-detail__metric-val">
                    {m.valor ? (
                      <>
                        <strong className="val-text">{m.valor}</strong>
                        <span className="val-author">
                          {m.quemPreenche === "PERSONAL" ? "por Personal" : "por Aluna"}
                        </span>
                      </>
                    ) : (
                      <Badge tone="warning">● Pendente · você preenche</Badge>
                    )}
                  </div>
                </div>
              ))}

              {session.nivelCansaco !== null && session.nivelCansaco !== undefined && (
                <div className="session-detail__metric-row">
                  <div className="session-detail__metric-info">
                    <Flame size={18} className="metric-icon flame" />
                    <div>
                      <strong className="metric-title">Esforço percebido (RPE)</strong>
                      <span className="metric-subtitle">Escala de Borg CR-10</span>
                    </div>
                  </div>

                  <div className="session-detail__metric-val">
                    <strong className="val-text">
                      {session.nivelCansaco} /10
                      {session.nivelCansaco >= 7
                        ? " · Difícil"
                        : session.nivelCansaco >= 4
                        ? " · Moderado"
                        : " · Leve"}
                    </strong>
                    <span className="val-author">por Aluna</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Card: 1 métrica pendente para você preencher (Screen 1 - 549:8705) */}
          {!session.validadaPersonal && pendingPersonalMetric && (
            <section
              className="workspace-card session-detail__pending-box"
              aria-label="Métrica pendente"
            >
              <div className="session-detail__pending-header">
                <AlertCircle size={22} color="#ea580c" />
                <div>
                  <h3>1 métrica pendente para você preencher</h3>
                  <p>
                    A sessão continua Concluída. Ao salvar, a pendência é removida do perfil e das
                    notificações.
                  </p>
                </div>
              </div>

              <div className="session-detail__pending-form">
                <label htmlFor="pending-input">
                  {pendingPersonalMetric.titulo} *
                </label>
                <textarea
                  id="pending-input"
                  rows={2}
                  placeholder="Descreva a avaliação técnica da execução..."
                  value={pendingMetricValue}
                  onChange={(e) => setPendingMetricValue(e.target.value)}
                />
                <span className="pending-hint">
                  Tipo {pendingPersonalMetric.tipo} · fica visível para a aluna após salvar
                </span>
              </div>

              <div className="session-detail__pending-footer">
                <span className="compliance-note">Registro feito em seu nome, com data e hora.</span>
                <Button
                  variant="primary"
                  onClick={handleSavePendingMetric}
                  loading={savingPendingMetric}
                >
                  Salvar métrica
                </Button>
              </div>
            </section>
          )}

          {/* Card: Seu feedback na validação (Screen 3 - 550:8615) */}
          {session.validadaPersonal && personalFeedback && (
            <section
              className="workspace-card session-detail__feedback-card"
              aria-label="Feedback"
            >
              <header className="feedback-card__header">
                <MessageSquare size={20} color="#ea580c" />
                <div>
                  <h3>Seu feedback na validação</h3>
                  <p>
                    Enviado em {formatDateTime(personalFeedback.dataCriacao)} · a aluna foi notificada
                  </p>
                </div>
              </header>

              <div className="feedback-card__content">
                <p>{personalFeedback.conteudo}</p>
              </div>

              <footer className="feedback-card__footer">
                <Lock size={14} />
                <span>
                  Feedbacks são imutáveis · correções de resultados ficam no histórico de alterações
                </span>
              </footer>
            </section>
          )}
        </div>

        {/* Right Column: Timeline, Observation, Planned Activities */}
        <div className="session-detail__right-col">
          {/* Card: Linha do tempo */}
          <section className="workspace-card session-detail__card" aria-label="Linha do tempo">
            <header className="session-detail__card-header">
              <h2>Linha do tempo</h2>
              <p>Planejado × executado</p>
            </header>

            <div className="session-detail__timeline">
              <div className="timeline-item">
                <div className="timeline-icon calendar">
                  <Calendar size={16} />
                </div>
                <div className="timeline-text">
                  <strong>Sessão planejada</strong>
                  <span>{formatFullDate(session.dataPlanejada)}</span>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-icon activity">
                  <Activity size={16} />
                </div>
                <div className="timeline-text">
                  <strong>Execução registrada</strong>
                  <span>
                    {formatFullDate(session.dataReal)} · {diffDays()}
                  </span>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-icon check">
                  <CheckCircle2 size={16} />
                </div>
                <div className="timeline-text">
                  <strong>Concluída pela aluna</strong>
                  <span>{formatDateTime(session.dataRegistro)}</span>
                </div>
              </div>

              <div className="timeline-item">
                <div className={`timeline-icon ${session.validadaPersonal ? "check" : "hourglass"}`}>
                  {session.validadaPersonal ? <CheckCircle2 size={16} /> : <Hourglass size={16} />}
                </div>
                <div className="timeline-text">
                  <strong>
                    {session.validadaPersonal ? "Validada pelo personal" : "Validação do personal"}
                  </strong>
                  <span>
                    {session.validadaPersonal
                      ? `${formatDateTime(session.dataRegistro)} · Personal`
                      : "Pendente · opcional"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Card: Observação da aluna */}
          {session.observacoes && (
            <section
              className="workspace-card session-detail__card"
              aria-label="Observação da aluna"
            >
              <header className="session-detail__card-header">
                <h2>Observação da aluna</h2>
              </header>

              <div className="session-detail__student-quote">
                <MessageSquare size={16} className="quote-icon" />
                <p>“{session.observacoes}”</p>
              </div>
              <span className="quote-date">{formatDateTime(session.dataRegistro)}</span>
            </section>
          )}

          {/* Card: Atividades planejadas */}
          <section
            className="workspace-card session-detail__card"
            aria-label="Atividades planejadas"
          >
            <header className="session-detail__card-header">
              <h2>Atividades planejadas</h2>
            </header>

            <div className="session-detail__planned-activities">
              {session.atividades ? (
                session.atividades.split("\n").map((act, i) => (
                  <div key={i} className="planned-activity-item">
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>{act.trim()}</span>
                  </div>
                ))
              ) : (
                <p className="no-activities">Nenhuma atividade detalhada para esta sessão.</p>
              )}
            </div>

            <footer className="session-detail__planned-footer">
              <Lock size={14} />
              <span>Sessão executada · planejamento bloqueado para edição</span>
            </footer>
          </section>
        </div>
      </div>

      {/* Modais */}
      {showValidateModal && (
        <ValidateSessionModal
          session={session}
          studentName={session.nomeAluno}
          onClose={() => setShowValidateModal(false)}
          onValidated={() => void loadData()}
        />
      )}

      {showAuditModal && (
        <SessionAuditModal
          sessionId={session.sessaoId}
          onClose={() => setShowAuditModal(false)}
        />
      )}

      {showCorrectionModal && (
        <SessionCorrectionModal
          session={session}
          studentName={session.nomeAluno}
          onClose={() => setShowCorrectionModal(false)}
          onSaved={() => void loadData()}
        />
      )}
    </div>
  );
}
